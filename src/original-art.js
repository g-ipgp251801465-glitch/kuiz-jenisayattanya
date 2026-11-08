// Original files stay unchanged. Object URLs are used only for rendering them.
const DATABASE = 'mimi-original-art';
const STORE = 'images';
const activeUrls = new Map();
let database;
function openDatabase() {
  database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
async function readImage(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeImage(key, file) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(file, key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}
function imageUrl(key, blob) {
  if (activeUrls.has(key)) URL.revokeObjectURL(activeUrls.get(key));
  const url = URL.createObjectURL(blob);
  activeUrls.set(key, url);
  return url;
}
export function applyOriginalImage(key, blob) {
  const url = imageUrl(key, blob);
  if (key === 'background') {
    const workspace = document.querySelector('.workspace');
    workspace.style.backgroundImage = `url("${url}")`;
    workspace.classList.add('original-background');
  } else {
    const scene = document.querySelector('.scene');
    let image = scene.querySelector('img.original-mimi');
    if (!image) {
      image = document.createElement('img');
      image.className = 'mimi original-mimi';
      image.alt = 'Mimi asal, rakan robot kucing kamu';
      scene.querySelector('.mimi-stage .mimi').replaceWith(image);
    }
    image.src = url;
    scene.classList.add('original-character');
  }
}
async function validateImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Pilih fail PNG, JPG atau WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Pilih gambar yang lebih kecil daripada 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error();
  } catch { throw new Error('Gambar ini tidak dapat dibuka. Cuba pilih PNG asal sekali lagi.'); }
  finally { URL.revokeObjectURL(url); }
}
export async function initializeOriginalArt() {
  // GitHub Pages supplies the repository PNG list at publication time.
  // Aspect ratios identify the landscape background and portrait Mimi without renaming files.
  const published = Array.isArray(window.MIMI_UPLOADED_PNGS) ? window.MIMI_UPLOADED_PNGS : [];
  await Promise.all(published.map(async url => {
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth > image.naturalHeight * 1.3) {
        const workspace = document.querySelector('.workspace');
        workspace.style.backgroundImage = `url("${url}")`;
        workspace.classList.add('original-background');
      } else {
        const scene = document.querySelector('.scene');
        let mimi = scene.querySelector('img.original-mimi');
        if (!mimi) { mimi = document.createElement('img'); mimi.className = 'mimi original-mimi'; mimi.alt = 'Mimi asal'; scene.querySelector('.mimi-stage .mimi').replaceWith(mimi); }
        mimi.src = url; scene.classList.add('original-character');
      }
    } catch { /* A failed image must not block the quiz. */ }
  }));
  await Promise.all(['background','mimi'].map(async key => {
    try { const file = await readImage(key); if (file) applyOriginalImage(key, file); } catch { /* Picking a file still works when storage is restricted. */ }
  }));
}
export function installArtPicker() {
  if (new URLSearchParams(location.search).get('gambar') !== '1') return;
  const panel = document.createElement('aside');
  panel.className = 'art-picker';
  panel.setAttribute('aria-label', 'Pilih gambar asal');
  panel.innerHTML = `<div class="art-picker-heading"><strong>Gunakan PNG asal</strong><span>Pilih gambar terus daripada peranti. Tidak perlu ZIP.</span></div>
    <div class="art-picker-buttons"><label class="art-file-button">Pilih PNG latar<input type="file" accept="image/png,image/jpeg,image/webp" data-art="background"></label><label class="art-file-button">Pilih PNG Mimi<input type="file" accept="image/png,image/jpeg,image/webp" data-art="mimi"></label></div>
    <p class="art-picker-status" role="status">Gambar disimpan pada pelayar ini. Perubahan ini belum mengubah versi untuk semua murid.</p>
    <a class="art-finish" href="?v=3">Lihat permainan →</a><p class="art-publish">Untuk semua murid: <a href="https://github.com/g-ipgp251801465-glitch/kuiz-jenisayattanya/upload/gh-pages" target="_blank" rel="noopener">Muat naik kedua-dua PNG ke GitHub</a>, kemudian pilih “Commit changes”. Versi umum akan menggunakan PNG asal secara automatik.</p>`;
  document.body.prepend(panel);
  panel.addEventListener('change', async event => {
    const input = event.target.closest('[data-art]');
    const file = input?.files?.[0];
    if (!file) return;
    const status = panel.querySelector('.art-picker-status');
    try {
      await validateImage(file);
      applyOriginalImage(input.dataset.art, file);
      try {
        await storeImage(input.dataset.art, file);
        status.textContent = `${input.dataset.art === 'background' ? 'Latar' : 'Mimi'} asal telah digunakan dan disimpan pada pelayar ini. Gambar tidak diubah atau dilukis semula.`;
      } catch { status.textContent = 'Gambar asal telah digunakan. Pelayar ini tidak membenarkan simpanan; pilih semula apabila membuka halaman nanti.'; }
      input.closest('label').classList.add('art-selected');
    } catch (error) { status.textContent = error.message; }
    finally { input.value = ''; }
  });
}
