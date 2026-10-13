// Zero-dependency production server for Railway (or any host that exposes PORT).
// Serves dist/, honours dist/_redirects (Netlify format: "from to status" per line),
// falls back to dist/404.html with a 404 status, and sends cache headers that make
// Lighthouse happy (immutable for /assets/, short for HTML).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(dist)) { console.error('dist/ not found; run `npm run build` first.'); process.exit(1); }

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf' };

// Parse _redirects. Supports:  "/from/*  /to/:splat  301"  and  "/from  /to  301".
function parseRedirects() {
  const p = path.join(dist, '_redirects');
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => {
    const parts = l.split(/\s+/);
    if (parts.length < 2) return null;
    const [from, to, codeStr] = parts;
    return { from, to, code: Number(codeStr) || 301 };
  }).filter(Boolean);
}
const redirects = parseRedirects();

function matchRedirect(url) {
  for (const r of redirects) {
    if (r.from.endsWith('/*')) {
      const prefix = r.from.slice(0, -2);
      if (url === prefix || url.startsWith(prefix + '/')) {
        const rest = url.slice(prefix.length).replace(/^\/+/, '');
        const dest = r.to.replace(':splat', rest).replace(/\/\/+/g, '/');
        return { dest, code: r.code };
      }
    } else if (url === r.from || url === r.from + '/' || url + '/' === r.from) {
      return { dest: r.to, code: r.code };
    }
  }
  return null;
}

function send(res, status, headers, body) { res.writeHead(status, headers); if (body === undefined) res.end(); else if (Buffer.isBuffer(body) || typeof body === 'string') res.end(body); else body.pipe(res); }
function headersFor(fp) {
  const h = { 'content-type': types[path.extname(fp)] || 'application/octet-stream' };
  if (/^\/assets\//.test(fp.replace(dist, ''))) h['cache-control'] = 'public, max-age=31536000, immutable';
  else if (fp.endsWith('.html')) h['cache-control'] = 'public, max-age=0, must-revalidate';
  else h['cache-control'] = 'public, max-age=3600';
  return h;
}

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  // Block path traversal
  if (url.includes('..') || url.includes('\0')) return send(res, 400, { 'content-type': 'text/plain' }, 'Bad Request');

  // Redirects first
  const r = matchRedirect(url);
  if (r) return send(res, r.code, { location: r.dest, 'cache-control': 'no-store' });

  // Normalise directory → index.html
  let fp = path.join(dist, url);
  if (!fp.startsWith(dist)) return send(res, 400, { 'content-type': 'text/plain' }, 'Bad Request');
  try {
    if (fs.existsSync(fp)) {
      const st = fs.statSync(fp);
      if (st.isDirectory()) {
        if (!url.endsWith('/')) { res.writeHead(301, { location: url + '/' }); return res.end(); }
        fp = path.join(fp, 'index.html');
      }
    } else if (!path.extname(fp)) {
      // Pretty URL like /about → /about.html
      if (fs.existsSync(fp + '.html')) fp = fp + '.html';
    }
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      return send(res, 200, headersFor(fp), fs.createReadStream(fp));
    }
  } catch (e) { console.error('serve error', e); }

  // 404 fallback
  const nf = path.join(dist, '404.html');
  if (fs.existsSync(nf)) return send(res, 404, headersFor(nf), fs.readFileSync(nf));
  send(res, 404, { 'content-type': 'text/plain' }, 'Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`leoslecture.com production server on http://${HOST}:${PORT}`);
  console.log(`loaded ${redirects.length} redirect rule(s)`);
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { console.log('shutting down'); server.close(() => process.exit(0)); });
