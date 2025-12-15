// fetch_tmdb.js
const fetch = require('node-fetch');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '62f39049ee4ffce51f25c75fc644802d';
if (!TMDB_API_KEY) {
  console.error('Please set TMDB_API_KEY env var.');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');
const POSTER_DIR = path.join(__dirname, 'static', 'posters');

mkdirp.sync(DATA_DIR);
mkdirp.sync(POSTER_DIR);

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

// fetch helper with timeout
async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// fetch discover movies by language
async function fetchMoviesByLanguage(lang, pages = 2) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${lang}&sort_by=popularity.desc&page=${p}`;
    try {
      console.log(`Fetching ${lang} movies page ${p}`);
      const data = await fetchWithTimeout(url);
      if (data && data.results) out.push(...data.results);
    } catch (err) {
      console.error(`Failed fetching ${lang} page ${p}:`, err.message);
    }
  }
  return out;
}

// fetch popular TV shows (web series)
async function fetchTvPages(pages = 1) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    const url = `${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${p}`;
    try {
      console.log('Fetching tv page', p);
      const data = await fetchWithTimeout(url);
      if (data && data.results) out.push(...data.results);
    } catch (err) {
      console.error('Failed fetching tv page', p, err.message);
    }
  }
  return out;
}

// optional dubbed mapping JSON
let dubbedMap = {};
try {
  dubbedMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'dubbed_map.json')));
} catch (e) {
  dubbedMap = {};
}

// assign categories
function deriveCategories(item, mediaType = 'movie') {
  const cats = new Set();
  if (mediaType === 'tv') cats.add('web_series');

  const lang = (item.original_language || '').toLowerCase();
  if (lang === 'hi') cats.add('bollywood');
  if (lang === 'en') cats.add('hollywood');
  if (lang === 'ta') cats.add('tamil');
  if (lang === 'te') cats.add('telugu');

  // dubbed mapping
  if (dubbedMap[item.id]) cats.add('dubbed');

  // fallback
  if (cats.size === 0) cats.add('others');
  return Array.from(cats);
}

// download poster
async function downloadImage(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`img ${res.status}`);
    const buffer = await res.buffer();
    fs.writeFileSync(dest, buffer);
  } catch (err) {
    console.error('Image download failed', url, err.message);
  }
}

// main
(async () => {
  console.log('Start fetching TMDB data...');

  const bollywood = await fetchMoviesByLanguage('hi', 3); // Hindi
  const tamil = await fetchMoviesByLanguage('ta', 2);
  const telugu = await fetchMoviesByLanguage('te', 2);
  const hollywood = await fetchMoviesByLanguage('en', 2);
  const tvSeries = await fetchTvPages(2);

  const combined = [];

  // process movies
  const allMovies = [...bollywood, ...hollywood, ...tamil, ...telugu];
  for (const m of allMovies) {
    const obj = {
      id: `m-${m.id}`,
      tmdb_id: m.id,
      media_type: 'movie',
      title: m.title || m.name || 'Untitled',
      overview: m.overview || '',
      release_date: m.release_date || '',
      poster_path: m.poster_path || null,
      original_language: m.original_language || '',
      categories: deriveCategories({ id: `m-${m.id}`, ...m }, 'movie')
    };
    combined.push(obj);
  }

  // process TV shows
  for (const t of tvSeries) {
    const obj = {
      id: `t-${t.id}`,
      tmdb_id: t.id,
      media_type: 'tv',
      title: t.name || t.title || 'Untitled',
      overview: t.overview || '',
      release_date: t.first_air_date || t.release_date || '',
      poster_path: t.poster_path || null,
      original_language: t.original_language || '',
      categories: deriveCategories({ id: `t-${t.id}`, ...t }, 'tv')
    };
    combined.push(obj);
  }

  // save movies.json
  const outPath = path.join(DATA_DIR, 'movies.json');
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
  console.log('Saved', combined.length, 'items to', outPath);

  // download posters
  for (const item of combined) {
    if (!item.poster_path) continue;
    const url = IMAGE_BASE + item.poster_path;
    const dest = path.join(POSTER_DIR, `${item.id}.jpg`);
    if (!fs.existsSync(dest)) {
      console.log('Downloading poster for', item.title);
      await downloadImage(url, dest);
    }
  }

  console.log('All done!');
})();
