import { readFile, writeFile, mkdir } from 'node:fs/promises';
let html = await readFile('preview/misi-preview.html', 'utf8');
// Keep original uploaded PNGs as separate static files, without changing their bytes.
// GitHub Pages resolves this list during its normal Jekyll publication step.
const imageList = `<script>window.MIMI_UPLOADED_PNGS = [{% for file in site.static_files %}{% assign ext = file.extname | downcase %}{% if ext == '.png' or ext == '.jpg' or ext == '.jpeg' or ext == '.webp' %}{{ file.path | relative_url | jsonify }},{% endif %}{% endfor %}];</script>`;
html = '---\nlayout: null\n---\n' + html.replace('<head>', '<head>' + imageList);
await mkdir('preview/pages', {recursive:true});
const entry = `<!doctype html>
<html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Misi Kenali Jenis Ayat Tanya!</title><link rel="canonical" href="./play/"></head>
<body><p><a href="./play/">Buka permainan — LULUS: 4/5</a></p><script>const target = new URL('play/', window.location.href); target.search = window.location.search; target.hash = window.location.hash; window.location.replace(target.href);</script></body></html>`;
await writeFile('preview/pages/index.html', entry);
await mkdir('preview/pages/play', {recursive:true});
await writeFile('preview/pages/play/index.html', html);
await writeFile('preview/pages/_config.yml', 'url: "https://g-ipgp251801465-glitch.github.io"\nbaseurl: "/kuiz-jenisayattanya"\n');
console.log('GitHub Pages package prepared, with automatic original PNG discovery.');
