// Tiny dev server: builds, serves dist/, rebuilds on changes to content/, src/, locales/ or build/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4321);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

let building = Promise.resolve();
function rebuild(reason) {
  building = building.then(async () => {
    const t = Date.now();
    try { await build(); console.log(`[dev] rebuilt (${reason}) in ${Date.now() - t}ms`); }
    catch (e) { console.error('[dev] build failed:', e.message); }
  });
  return building;
}
await rebuild('start');

let timer;
for (const dir of ['content', 'src', 'build', 'locales']) {
  fs.watch(path.join(root, dir), { recursive: true }, (_ev, file) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(`${dir}/${file}`), 120);
  });
}

http.createServer(async (req, res) => {
  await building;
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const file = path.join(dist, url);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found: ' + url); return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`[dev] http://localhost:${port}/`));
