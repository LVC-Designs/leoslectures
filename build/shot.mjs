// Screenshots of built pages in light and dark mode via headless Chrome (DevTools protocol).
// Usage: node build/shot.mjs <out-dir> [path-under-dist ...]   (default: landing, both track homes, first unit, verbs)
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.resolve(process.argv[2] || path.join(root, 'shots'));
fs.mkdirSync(out, { recursive: true });
const pages = process.argv.slice(3);
if (!pages.length) {
  pages.push('index.html', 'learn-italian/index.html', 'impara-inglese/index.html', 'learn-italian/verbs.html');
  for (const s of ['learn-italian', 'impara-inglese']) { const d = path.join(dist, s, 'units'); if (fs.existsSync(d)) { const f = fs.readdirSync(d).sort()[0]; if (f) pages.push(`${s}/units/${f}`); } }
}
const PORT = 4397, CDP = 9334;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; const f = path.join(dist, u); if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(PORT);
const bin = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'].find(b => fs.existsSync(b));
if (!bin) { console.error('No Chrome found; set CHROME=/path'); process.exit(2); }
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'ds-shot-'));
const chrome = spawn(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function json(u, method = 'GET') { let last; for (let i = 0; i < 60; i++) { try { const r = await fetch(u, { method }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); } catch (e) { last = e; await sleep(250); } } throw new Error(`chrome did not start: ${last?.message}`); }
let id = 0; const pending = new Map(); let ws;
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  await json(`http://127.0.0.1:${CDP}/json/version`);
  const target = await json(`http://127.0.0.1:${CDP}/json/new?about:blank`, 'PUT');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const p of pages) {
    for (const scheme of ['light', 'dark']) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${p}` });
      await sleep(1200);
      await send('Runtime.evaluate', { expression: 'document.getElementById("hero-dialog")?.close(); 1' });
      const { contentSize } = await send('Page.getLayoutMetrics');
      const h = Math.min(4000, Math.ceil(contentSize.height));
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: h, deviceScaleFactor: 1, mobile: false });
      await sleep(200);
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      const name = `${p.replace(/\.html$/, '').replace(/[\/]/g, '_') || 'index'}-${scheme}.png`;
      fs.writeFileSync(path.join(out, name), Buffer.from(shot.data, 'base64'));
      console.log(name, `${h}px`);
    }
  }
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill(); server.close(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch {} }
