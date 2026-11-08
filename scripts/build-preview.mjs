import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

// Bundle all runtime assets for a portable, self-contained HTML preview.
const dist = resolve('dist');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');
const stylesheet = html.match(/<link[^>]+href="([^\"]+\.css)"[^>]*>/);
const moduleScript = html.match(/<script[^>]+src="(\/assets\/[^" ]+\.js)"[^>]*><\/script>/);
if (!stylesheet || !moduleScript) throw new Error('Expected Vite CSS and JavaScript assets were not found.');
let css = await readFile(resolve(dist, stylesheet[1].replace(/^\//, '')), 'utf8');
const fonts = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].replace(/["']/g, '')))];
for (const font of fonts) {
  if (font.startsWith('data:')) continue;
  const bytes = await readFile(resolve(dist, font.replace(/^\//, '')));
  const mime = extname(font) === '.woff2' ? 'font/woff2' : 'font/woff';
  css = css.split(font).join(`data:${mime};base64,${bytes.toString('base64')}`);
}
const js = await readFile(resolve(dist, moduleScript[1].replace(/^\//, '')), 'utf8');
const favicon = await readFile(resolve(dist, 'favicon.svg'));
html = html.replace(stylesheet[0], () => `<style>${css}</style>`)
  .replace(moduleScript[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace('<script src="/config.js"></script>', '<script>window.NEXT_ACTIVITY_URL = "";</script>')
  .replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${favicon.toString('base64')}"`);
const licenses = await Promise.all(['Nunito', 'Outfit'].map(name => readFile(resolve(dist, `licenses/OFL-${name}.txt`), 'utf8')));
html = html.replace('</head>', () => `<!-- Font licenses: SIL Open Font License 1.1\n${licenses.join('\n\n')}\n-->\n</head>`);
await mkdir('preview', {recursive:true});
await writeFile('preview/misi-preview.html', html);
console.log(`Standalone preview: preview/misi-preview.html (${Math.ceil(Buffer.byteLength(html) / 1024)} KiB)`);
