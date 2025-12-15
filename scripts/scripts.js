let movies = [];

async function loadMovies() {
  const res = await fetch('data/movies.json');
  movies = await res.json();
}

// Categories buttons
function renderCategories() {
  const catSet = new Set();
  movies.forEach(m => m.categories.forEach(c=>catSet.add(c)));
  const container = document.getElementById('categories');
  container.innerHTML='';
  Array.from(catSet).forEach(c=>{
    const btn = document.createElement('button');
    btn.textContent = c.charAt(0).toUpperCase()+c.slice(1);
    btn.addEventListener('click', ()=>{
      renderGalleryFiltered('latestGallery', c);
    });
    container.appendChild(btn);
  });
}

// Render functions
function renderGallery(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML='';
  movies.slice(0,20).forEach(m=>{
    const div = document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}

function renderGalleryFiltered(containerId, category) {
  const container = document.getElementById(containerId);
  container.innerHTML='';
  movies.filter(m=>m.categories.includes(category)).slice(0,20).forEach(m=>{
    const div = document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}

// Featured / Most Favorite / Top IMDb
function renderFeatured() {
  const container = document.getElementById('featuredGallery');
  movies.sort((a,b)=> (b.vote_average||0) - (a.vote_average||0)).slice(0,10).forEach(m=>{
    const div=document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}
function renderMostFavorite() {
  const container = document.getElementById('favoriteGallery');
  movies.sort((a,b)=> (b.vote_count||0) - (a.vote_count||0)).slice(0,10).forEach(m=>{
    const div=document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}
function renderTopIMDB() {
  const container = document.getElementById('imdbGallery');
  movies.sort((a,b)=> (b.vote_average||0) - (a.vote_average||0)).slice(0,10).forEach(m=>{
    const div=document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}

function renderGalleryPaginated(containerId, page=1, perPage=20) {
  const container = document.getElementById(containerId);
  container.innerHTML='';
  const start = (page-1)*perPage;
  movies.slice(start,start+perPage).forEach(m=>{
    const div=document.createElement('div');
    div.className='movie-item';
    div.innerHTML=`<img src="static/posters/${m.id}.jpg" alt="${m.title}"><p>${m.title}</p>`;
    div.addEventListener('click', ()=>{ localStorage.setItem('movieId', m.id); window.location.href='movie.html'; });
    container.appendChild(div);
  });
}

// Init
async function initHome() {
  await loadMovies();
  renderCategories();
  renderFeatured();
  renderMostFavorite();
  renderTopIMDB();
  renderGalleryPaginated('latestGallery');
}
initHome();
