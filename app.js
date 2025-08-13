const GALLERY = document.getElementById('gallery');
const TABS = document.getElementById('tabs');
const BTN_ALL = document.getElementById('downloadAll');
const DATA_URL = 'data/wallpapers.json';

let allWalls = [];   // loaded from JSON
let currentCat = 'all';

(async function init(){
  allWalls = await fetch(DATA_URL).then(r=>r.json());
  render('all');
})();

function render(cat){
  currentCat = cat;
  // tab UI
  [...TABS.querySelectorAll('button[data-cat]')].forEach(b=>{
    b.classList.toggle('active', b.dataset.cat === cat);
  });

  const list = cat === 'all' ? allWalls : allWalls.filter(w => w.category === cat);
  GALLERY.innerHTML = '';
  list.forEach(w => {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.loading = 'lazy';
    img.alt = w.title || w.file;
    img.src = w.thumb || w.src; // use smaller thumb if you add it
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = w.title || w.file;

    const btn = document.createElement('a');
    btn.className = 'btn';
    btn.textContent = 'Download';
    btn.href = w.src;
    btn.setAttribute('download', w.file); // hint browser to download

    meta.appendChild(title);
    meta.appendChild(btn);
    card.appendChild(meta);

    GALLERY.appendChild(card);
  });
}

// Category clicks
TABS.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-cat]');
  if (!b) return;
  render(b.dataset.cat);
});

// Bulk ZIP
BTN_ALL.addEventListener('click', async ()=>{
  const list = currentCat === 'all' ? allWalls : allWalls.filter(w => w.category === currentCat);
  if (!list.length) return alert('No wallpapers found for this category.');

  BTN_ALL.disabled = true; BTN_ALL.textContent = 'Preparing...';

  const zip = new JSZip();
  const folder = zip.folder(currentCat === 'all' ? 'wallpapers' : `wallpapers_${currentCat}`);

  // Fetch files from same-origin (your repo) as blobs
  for (const w of list) {
    const resp = await fetch(w.src);
    const blob = await resp.blob();
    const filename = w.file || w.src.split('/').pop();
    folder.file(filename, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const zipName = currentCat === 'all' ? 'voltedge_wallpapers_all.zip' : `voltedge_${currentCat}.zip`;
  saveAs(content, zipName);

  BTN_ALL.disabled = false; BTN_ALL.textContent = 'Download All (.zip)';
});
