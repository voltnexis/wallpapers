document.addEventListener('DOMContentLoaded', () => {

    const GALLERY = document.getElementById('gallery');
    const TABS = document.getElementById('tabs');
    const BTN_ALL = document.getElementById('downloadAll');
    const RES_FILTER = document.getElementById('resFilter');
    const CAT_BTN = document.getElementById('categoryBtn');
    const CAT_MENU = document.getElementById('categoryMenu');
    const CAT_SEARCH = document.getElementById('categorySearch');
    const CAT_LIST = document.getElementById('categoryList');
    const SEARCH_BOX = document.getElementById('searchBox');
    const DATA_URL = 'data/wallpapers.json';

    let allWalls = [];
    let currentCat = 'all';
    let currentRes = 'all';
    let currentSearch = '';

    (async function init(){
        try {
            allWalls = await fetch(DATA_URL).then(r => r.json());
            populateCategoryFilter();
            render();
        } catch(err) {
            console.error('Failed to load wallpapers.json:', err);
            if (GALLERY) {
                GALLERY.innerHTML = '<p style="text-align:center; color:var(--muted);">Failed to load wallpapers. Please check the JSON file.</p>';
            }
        }
    })();

    function populateCategoryFilter() {
        const allCategories = new Set();
        allWalls.forEach(w => {
            if (w.categories) {
                w.categories.forEach(cat => allCategories.add(cat));
            }
        });
        
        const sortedCategories = Array.from(allCategories).sort();
        sortedCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'filter-item';
            item.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            item.dataset.category = cat;
            item.onclick = () => {
                currentCat = cat;
                updateCategoryUI();
                CAT_MENU.classList.remove('show');
                render();
            };
            CAT_LIST.appendChild(item);
        });
    }

    function updateCategoryUI() {
        if (TABS) {
            [...TABS.querySelectorAll('button[data-cat]')].forEach(b => {
                b.classList.remove('active');
            });
        }
        [...CAT_LIST.querySelectorAll('.filter-item')].forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === currentCat) {
                item.classList.add('active');
            }
        });
    }

    function render(){
        // Update active tab UI
        if (TABS) {
            [...TABS.querySelectorAll('button[data-cat]')].forEach(b => {
                b.classList.toggle('active', b.dataset.cat === currentCat);
            });
        }
    
        let list = allWalls;
    
        // Apply filters
        if (currentCat !== 'all') {
            list = list.filter(w => w.categories && w.categories.includes(currentCat));
        }
        if (currentRes !== 'all') {
            list = list.filter(w => (w.resolution || '').toLowerCase() === currentRes.toLowerCase());
        }
        if (currentSearch.trim() !== '') {
            list = list.filter(w => (w.title || '').toLowerCase().includes(currentSearch.toLowerCase()));
        }
    
        if (GALLERY) {
            GALLERY.innerHTML = '';
            if (list.length === 0) {
                GALLERY.innerHTML = '<p style="text-align:center; color:var(--muted);">No wallpapers found with the selected filters.</p>';
            } else {
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
                    
                    // Add resolution tag if it exists
                    if (w.resolution) {
                        const resTag = document.createElement('span');
                        resTag.className = 'resTag';
                        resTag.textContent = w.resolution;
                        title.appendChild(resTag);
                    }
        
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.textContent = 'Download';
                    btn.onclick = () => downloadAsPNG(w.src, w.file);
        
                    meta.appendChild(title);
                    meta.appendChild(btn);
                    card.appendChild(meta);
        
                    GALLERY.appendChild(card);
                });
            }
        }
    }
    
    // Event listeners
    if (TABS) {
        TABS.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-cat]');
            if (!b) return;
            currentCat = b.dataset.cat;
            updateCategoryUI();
            render();
        });
    }

    if (CAT_BTN) {
        CAT_BTN.addEventListener('click', (e) => {
            e.stopPropagation();
            CAT_MENU.classList.toggle('show');
            if (CAT_MENU.classList.contains('show')) {
                CAT_SEARCH.focus();
            }
        });
    }

    if (CAT_SEARCH) {
        CAT_SEARCH.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            [...CAT_LIST.querySelectorAll('.filter-item')].forEach(item => {
                const categoryName = item.dataset.category.toLowerCase();
                if (categoryName.includes(searchTerm)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
        
        CAT_SEARCH.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    document.addEventListener('click', () => {
        CAT_MENU.classList.remove('show');
        if (CAT_SEARCH) CAT_SEARCH.value = '';
        [...CAT_LIST.querySelectorAll('.filter-item')].forEach(item => {
            item.classList.remove('hidden');
        });
    });

    if (CAT_MENU) {
        CAT_MENU.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (RES_FILTER) {
        RES_FILTER.addEventListener('change', (e) => {
            currentRes = e.target.value;
            render();
        });
    }

    if (SEARCH_BOX) {
        SEARCH_BOX.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            render();
        });
    }
    
    // WebP to PNG conversion function
    async function downloadAsPNG(webpSrc, filename) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            img.src = webpSrc;
        } catch (err) {
            console.error('PNG conversion failed:', err);
            // Fallback to direct download
            const a = document.createElement('a');
            a.href = webpSrc;
            a.download = filename;
            a.click();
        }
    }

    // Bulk ZIP (filtered list)
    if (BTN_ALL) {
        BTN_ALL.addEventListener('click', async () => {
            let list = allWalls;
            if (currentCat !== 'all') list = list.filter(w => w.categories && w.categories.includes(currentCat));
            if (currentRes !== 'all') list = list.filter(w => (w.resolution || '').toLowerCase() === currentRes.toLowerCase());
            if (currentSearch.trim() !== '') list = list.filter(w => (w.title || '').toLowerCase().includes(currentSearch.toLowerCase()));
    
            if (!list.length) return alert('No wallpapers found to download.');
    
            BTN_ALL.disabled = true; 
            BTN_ALL.textContent = 'Preparing...';
    
            const zip = new JSZip();
            const folderName = `wallpapers_${currentCat}_${currentRes}`.replace(/_all/g, '');
            const folder = zip.folder(folderName);
    
            try {
                for (const w of list) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    await new Promise((resolve, reject) => {
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            canvas.toBlob((blob) => {
                                folder.file(w.file || w.src.split('/').pop(), blob);
                                resolve();
                            }, 'image/png');
                        };
                        img.onerror = reject;
                        img.src = w.src;
                    });
                }
            
                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, `${folderName}.zip`);
            } catch (err) {
                console.error('Download failed:', err);
                alert('An error occurred during download.');
            } finally {
                BTN_ALL.disabled = false; 
                BTN_ALL.textContent = 'Download All (.zip)';
            }
        });
    }
});
