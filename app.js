const GALLERY = document.getElementById('gallery');
const TABS = document.getElementById('tabs');
const BTN_ALL = document.getElementById('downloadAll');
const RES_FILTER = document.getElementById('resFilter');
const SEARCH_BOX = document.getElementById('searchBox');
const DATA_URL = 'data/wallpapers.json';

let allWalls = [];
let currentCat = 'all';
let currentRes = 'all';
let currentSearch = '';

(async function init(){
  allWalls = await fetch(DATA_URL).then(r=>r.json());
  render();
})();

function render(){
  // tab UI
  [...TABS.querySelectorAll('button[data-cat]')].forEach(b=>{
    b.classList.toggle('active', b.dataset.cat === currentCat);
  });

  let list = allWalls;

  // category filter
  if (currentCat !== 'all') {
    list = list.filter(w => w.category === currentCat);
  }
  // resolution filter
  if (currentRes !== 'all') {
    list = list.filter(w => (w.resolution || '').toLowerCase() === currentRes.toLowerCase());
  }
  // search filter
  if (currentSearch.trim() !== '') {
    list = list.filter(w => (w.title || '').toLowerCase().includes(currentSearch.toLowerCase()));
  }

  GALLERY.innerHTML = '';
  list.forEach(w => {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.loading = 'lazy';
    img.alt = w.title || w.file;
    img.src = w.thumb || w.src;
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = w.title || w.file;

    // resolution tag
    if (w.resolution) {
      const resTag = document.createElement('span');
      resTag.className = 'resTag';
      resTag.textContent = w.resolution;
      title.appendChild(resTag);
    }

    const btn = document.createElement('a');
    btn.className = 'btn';
    btn.textContent = 'Download';
    btn.href = w.src;
    btn.setAttribute('download', w.file);

    meta.appendChild(title);
    meta.appendChild(btn);
    card.appendChild(meta);

    GALLERY.appendChild(card);
  });
}

// Event listeners
TABS.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-cat]');
  if (!b) return;
  currentCat = b.dataset.cat;
  render();
});

RES_FILTER.addEventListener('change', (e)=>{
  currentRes = e.target.value;
  render();
});

SEARCH_BOX.addEventListener('input', (e)=>{
  currentSearch = e.target.value;
  render();
});

// Bulk ZIP (filtered list)
BTN_ALL.addEventListener('click', async ()=>{
  let list = allWalls;
  if (currentCat !== 'all') list = list.filter(w => w.category === currentCat);
  if (currentRes !== 'all') list = list.filter(w => (w.resolution || '').toLowerCase() === currentRes.toLowerCase());
  if (currentSearch.trim() !== '') list = list.filter(w => (w.title || '').toLowerCase().includes(currentSearch.toLowerCase()));

  if (!list.length) return alert('No wallpapers found.');

  BTN_ALL.disabled = true; BTN_ALL.textContent = 'Preparing...';

  const zip = new JSZip();
  const folderName = `wallpapers_${currentCat}_${currentRes}`.replace(/_all/g, '');
  const folder = zip.folder(folderName);

  for (const w of list) {
    const resp = await fetch(w.src);
    const blob = await resp.blob();
    folder.file(w.file || w.src.split('/').pop(), blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);

  BTN_ALL.disabled = false; BTN_ALL.textContent = 'Download All (.zip)';
});


  BTN_ALL.disabled = false; BTN_ALL.textContent = 'Download All (.zip)';
});
