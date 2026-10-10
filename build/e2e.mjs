// Headless end-to-end smoke test over the DevTools protocol (needs google-chrome or chromium and a built dist/).
// Usage: node build/e2e.mjs [path-under-dist ...]   — runs the built-in scenario when no paths are given.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const scenario = process.argv.length <= 2;
if (scenario) { process.env.DS_CONTENT = 'build/fixtures/content'; await build(); console.log('built from fixtures'); }
const PORT = 4399, CDP = 9333;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]); if (url.endsWith('/')) url += 'index.html';
  const f = path.join(dist, url);
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PORT);

const bin = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(b => fs.existsSync(b));
if (!bin) { console.error('No Chrome/Chromium found; set CHROME=/path/to/chrome'); process.exit(2); }
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'ds-e2e-'));
const chrome = spawn(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function json(u, method = 'GET') { let last; for (let i = 0; i < 60; i++) { try { const r = await fetch(u, { method }); if (!r.ok) throw new Error(`${r.status} ${await r.text()}`); return await r.json(); } catch (e) { last = e; await sleep(250); } } throw new Error(`chrome did not start: ${last?.message}`); }

let id = 0; const pending = new Map(); const errors = [];
let ws;
function send(method, params = {}) { return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); }); }
async function connect() {
  await json(`http://127.0.0.1:${CDP}/json/version`);
  const target = await json(`http://127.0.0.1:${CDP}/json/new?about:blank`, 'PUT');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === 'Runtime.exceptionThrown') errors.push(`exception: ${d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text}`);
    if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push(`console.${d.params.type}: ${d.params.args.map(a => a.value ?? a.description).join(' ')}`);
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon|fonts\.g/.test(d.params.entry.text)) errors.push(`log: ${d.params.entry.text} ${d.params.entry.url || ''}`);
  });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
}
async function open(p) { await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${p}` }); await sleep(900); }
async function ev(expr) { const wrapped = expr.includes(';') ? `(() => { ${expr} })()` : `(() => (${expr}))()`; const r = await send('Runtime.evaluate', { expression: wrapped, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed'); return r.result.value; }

let pass = 0, fail = 0;
const check = async (name, expr, expect = true) => { let v; try { v = await ev(expr); } catch (e) { v = `ERR ${e.message}`; } const ok = expect === undefined ? !!v : v === expect; ok ? pass++ : fail++; console.log(`${ok ? 'ok ' : 'FAIL'} ${name}${ok ? '' : ` → ${JSON.stringify(v)}`}`); };

try {
  await connect();
  const pages = process.argv.slice(2);
  if (pages.length) {
    // audit mode: load each page as Luca and as Lucia; every exercise initialised, every audio button has text,
    // every variant has two different non-empty forms, no placeholder/undefined text, no console errors.
    const AUDIT = `return (() => { const out = {}; out.ex = document.querySelectorAll('.ex').length; out.ready = document.querySelectorAll('.ex[data-ready]').length;
      out.saySilent = [...document.querySelectorAll('.say')].filter(b => !(b.dataset.say || (b.dataset.sayM && b.dataset.sayF))).length;
      out.varBad = [...document.querySelectorAll('.var')].filter(v => { const m = v.querySelector('.vm')?.textContent.trim(), f = v.querySelector('.vf')?.textContent.trim(); return !m || !f || m === f; }).length;
      out.undef = (document.body.innerText.match(/undefined|\\[object Object\\]|NaN/g) || []).length;
      out.title = document.title; return out; })()`;
    for (const p of pages) {
      for (const g of ['m', 'f']) {
        await open(p);
        await ev(`localStorage.setItem('ds:settings', JSON.stringify({hero:'${g}', self:'${g}', track:'${p.split('/')[0] === 'impara-inglese' ? 'en-for-it' : 'it-for-en'}'})); 1`);
        await open(p);
        const a = await ev(AUDIT);
        const ok = a.ex === a.ready && a.saySilent === 0 && a.varBad === 0 && a.undef === 0 && a.title.length > 0;
        ok ? pass++ : fail++;
        console.log(`${ok ? 'ok ' : 'FAIL'} ${p} as ${g}: ${a.ex} exercises, ${a.saySilent} silent audio, ${a.varBad} bad variants, ${a.undef} undefined`);
      }
    }
  }
  else {
    await open('index.html');
    await check('landing title', 'document.title.includes("Due Sponde")');
    await check('landing has two track cards', 'document.querySelectorAll(".track-card").length', 2);
    await open('learn-italian/index.html');
    await check('track home: hero dialog opens on first visit', 'document.getElementById("hero-dialog")?.open === true');
    await ev('document.querySelector("#hero-dialog input[value=f]").checked = true; document.querySelector("#hero-dialog input[name=self][value=both]").checked = true; document.querySelector("#hero-dialog form button").click(); 1');
    await sleep(200);
    await check('hero saved as Lucia', 'JSON.parse(localStorage.getItem("ds:settings")).hero', 'f');
    await check('html data-hero=f', 'document.documentElement.dataset.hero', 'f');
    await check('unit card links', 'document.querySelectorAll("a.lesson-card").length >= 1');
    await open('learn-italian/units/unit-01.html');
    await check('unit h1 shows Lucia variant', 'getComputedStyle(document.querySelector("h1 .vf")).display !== "none" && getComputedStyle(document.querySelector("h1 .vm")).display === "none"');
    await check('dialogue hero line uses Lucia name', '[...document.querySelectorAll(".line .who .vf")].some(e => e.textContent === "Lucia")');
    await check('agreement marks present', 'document.querySelectorAll("mark.agr").length > 0');
    await check('exercises rendered', 'document.querySelectorAll(".ex[data-ready]").length', 26);
    await check('say buttons carry text', '[...document.querySelectorAll(".say")].every(b => (b.dataset.say || b.dataset.sayF) && b.dataset.lang)');
    // mc: Lucia should pick "Sono stanca"? The fixture asks what Luca says → answer index 1
    await ev('document.querySelector(".ex[data-kind=mc] .opt[data-i=\\"1\\"]").click(); 1');
    await check('mc graded ok', 'document.querySelector(".ex[data-kind=mc]").dataset.status', 'ok');
    // fill with variant answer: as Lucia, typing "arrivato" → almost (other variant)
    await ev('const ex=[...document.querySelectorAll(".ex[data-kind=fill]")][1]; ex.querySelector(".ex-blank").value="arrivato"; ex.querySelector(".ex-check").click(); 1');
    await check('fill: other variant → almost', '[...document.querySelectorAll(".ex[data-kind=fill]")][1].dataset.status', 'almost');
    await check('fill: hint names Luca', '[...document.querySelectorAll(".ex[data-kind=fill]")][1].querySelector(".ex-status").textContent.includes("Luca")');
    // fill accents: "perche"-style — first fill expects "sono"; type "Sono." → ok
    await ev('const ex=[...document.querySelectorAll(".ex[data-kind=fill]")][0]; ex.querySelector(".ex-blank").value="Sono "; ex.querySelector(".ex-check").click(); 1');
    await check('fill: case/space tolerant', '[...document.querySelectorAll(".ex[data-kind=fill]")][0].dataset.status', 'ok');
    await check('fill: question shows Lucia form', 'getComputedStyle([...document.querySelectorAll(".ex[data-kind=fill]")][0].querySelector(".ex-fill")).display !== "none" && [...document.querySelectorAll(".ex[data-kind=fill]")][0].querySelector(".ex-fill").textContent.includes("stanca")');
    // self=both dropdown fill: choose "stanco" → ok (both accepted)
    await ev('const ex=[...document.querySelectorAll(".ex[data-kind=fill]")][2]; ex.querySelector(".ex-sel").value="stanco"; ex.querySelector(".ex-check").click(); 1');
    await check('fill self=both accepts masculine', '[...document.querySelectorAll(".ex[data-kind=fill]")][2].dataset.status', 'ok');
    // translate wrong then show answer
    await ev('const ex=document.querySelector(".ex[data-kind=translate]"); ex.querySelector(".ex-in").value="Sono di Roma"; ex.querySelector(".ex-check").click(); 1');
    await check('translate wrong', 'document.querySelector(".ex[data-kind=translate]").dataset.status', 'wrong');
    await check('show-answer button appears', '!!document.querySelector(".ex[data-kind=translate] .ex-show")');
    await ev('document.querySelector(".ex[data-kind=translate] .ex-in").value="io sono di toronto"; document.querySelector(".ex[data-kind=translate] .ex-check").click(); 1');
    await check('translate alt answer ok', 'document.querySelector(".ex[data-kind=translate]").dataset.status', 'ok');
    // accent bar inserts
    await check('accent bar present', 'document.querySelectorAll(".accent-bar").length > 0');
    await ev('const ex=document.querySelector(".ex[data-kind=dictation]"); const i=ex.querySelector(".ex-in"); i.focus(); i.value="Benvenuti a Roccamarina"; ex.querySelector(".ex-check").click(); 1');
    await check('dictation ok', 'document.querySelector(".ex[data-kind=dictation]").dataset.status', 'ok');
    // order: click tokens in right order
    await ev('const ex=document.querySelector(".ex[data-kind=order]"); for (const w of ["Sono","di","Toronto."]) { [...ex.querySelectorAll(".order-pool .tok")].find(t=>t.textContent===w).click(); } ex.querySelector(".ex-check").click(); 1');
    await check('order ok', 'document.querySelector(".ex[data-kind=order]").dataset.status', 'ok');
    // match
    await ev('const ex=document.querySelector(".ex[data-kind=match]"); const A=[...ex.querySelectorAll(".m-item[data-side=a]")]; for (const a of A) { a.click(); ex.querySelector(`.m-item[data-side=b][data-i="${a.dataset.i}"]`).click(); } 1');
    await check('match ok', 'document.querySelector(".ex[data-kind=match]").dataset.status', 'ok');
    // conjugate
    await ev('const ex=document.querySelector(".ex[data-kind=conjugate]"); const v=["sono","sei","e","siamo","siete","sono"]; ex.querySelectorAll(".ex-blank").forEach((f,i)=>f.value=v[i]); ex.querySelector(".ex-check").click(); 1');
    await check('conjugate missing accent → almost', 'document.querySelector(".ex[data-kind=conjugate]").dataset.status', 'almost');
    await check('progress saved', 'Object.keys(JSON.parse(localStorage.getItem("ds:it-for-en:progress")).units["01"].ex).length >= 6');
    await check('toc ring painted', 'document.querySelector(".toc-ring .pct").textContent !== "0%"');
    // switch hero to Luca via header
    await ev('document.querySelector(".hero-btn[data-hero=m]").click(); 1');
    await check('h1 now shows Luca variant', 'getComputedStyle(document.querySelector("h1 .vm")).display !== "none"');
    // both toggle
    await ev('document.querySelector(".both-toggle").click(); 1');
    await check('dialogue both shows vf too', 'getComputedStyle(document.querySelector(".dialogue .line .t .vf")).display !== "none"');
    await ev('document.querySelector(".dlg-toggle").click(); 1');
    await check('translation toggle', 'getComputedStyle(document.querySelector(".dialogue .line .n")).display', 'block');
    await ev('document.querySelector(".why").click(); 1');
    await check('why note opens', 'document.querySelector(".why-note").hidden === false');
    // flashcards
    await ev('document.querySelector(".flashcards .fc-start").click(); 1');
    await check('flashcard shows', '!!document.querySelector(".fc-card")');
    await ev('document.querySelector(".fc-flip").click(); 1');
    await ev('document.querySelector(".fc-actions .g2").click(); 1');
    await check('flashcard scheduled', 'Object.keys(JSON.parse(localStorage.getItem("ds:it-for-en:fc")).items).length', 1);
    // other pages
    await open('learn-italian/verbs.html');
    await check('verbs table rendered', 'document.querySelectorAll(".vb-out .tbl tr").length >= 6');
    await ev('document.querySelector(".vb-search").value="andare"; document.querySelector(".vb-search").dispatchEvent(new Event("change")); document.querySelector(".vb-tense").value="passato_prossimo"; document.querySelector(".vb-tense").dispatchEvent(new Event("change")); 1');
    await check('verbs compound variant for Luca', 'document.querySelector(".vb-out .tbl td .vm").textContent', 'sono andato');
    await ev('document.querySelector(".vb-mode [data-mode=drill]").click(); document.querySelectorAll(".vb-out .ex-blank").forEach((f,i)=>f.value=i===0?"sono andato":"x"); document.querySelector(".vb-check").click(); 1');
    await check('drill saved mistakes', 'Object.keys(JSON.parse(localStorage.getItem("ds:it-for-en:conj")).items).length', 5);
    await ev('document.querySelector(".vb-mode [data-mode=mistakes]").click(); 1');
    await check('mistakes mode lists due forms', 'document.querySelectorAll(".vb-out .ex-blank").length', 5);
    await open('learn-italian/glossary.html');
    await check('glossary lists words', 'document.querySelectorAll(".gl-item").length', 2);
    await ev('document.querySelector(".gl-search").value="staz"; document.querySelector(".gl-search").dispatchEvent(new Event("input")); 1');
    await check('glossary search', 'document.querySelectorAll(".gl-item").length', 1);
    await open('learn-italian/grammar.html');
    await check('grammar index has topic + unit point', 'document.querySelectorAll(".gr-list li").length >= 1');
    await open('learn-italian/grammar/essere.html');
    await check('grammar topic renders conjugation', 'document.querySelectorAll(".conj .tbl tr").length >= 6');
    await open('learn-italian/phrasebook.html');
    await check('phrasebook item', 'document.querySelectorAll(".phrases li").length', 1);
    await open('learn-italian/placement.html');
    await ev('document.querySelector(".pl-start").click(); 1');
    await check('placement question shown', '!!document.querySelector(".pl-ui .ex")');
    await ev('document.querySelector(".pl-ui .opt").click(); 1');
    await check('placement next enabled', 'document.querySelector(".pl-next").disabled === false');
    await ev('document.querySelector(".pl-next").click(); document.querySelector(".pl-ui .ex-blank").value="sono"; document.querySelector(".pl-ui .ex-check").click(); document.querySelector(".pl-next").click(); document.querySelector(".pl-ui .opt").click(); document.querySelector(".pl-next").click(); 1');
    await check('placement result', 'document.querySelector(".pl-ui h2")?.textContent.length > 0');
    await open('learn-italian/settings.html');
    await ev('document.querySelector(".settings-form [name=hero][value=f]").click(); 1');
    await check('settings change hero', 'JSON.parse(localStorage.getItem("ds:settings")).hero', 'f');
    await open('learn-italian/flashcards.html');
    await check('all-flashcards page', '!!document.querySelector(".flashcards .fc-ui")');
    await open('impara-inglese/index.html');
    await check('english track home in Italian', 'document.documentElement.lang', 'it');
    await open('impara-inglese/verbs.html');
    await check('english verbs table (be)', 'document.querySelector(".vb-out .tbl td")?.textContent.includes("I am")');
    await ev('document.querySelector(".vb-search").value="go"; document.querySelector(".vb-search").dispatchEvent(new Event("change")); document.querySelector(".vb-tense").value="present_perfect"; document.querySelector(".vb-tense").dispatchEvent(new Event("change")); 1');
    await check('english present perfect of go', '[...document.querySelectorAll(".vb-out .tbl td")].some(td => td.textContent.includes("he has gone"))');
    await open('impara-inglese/settings.html');
    await check('settings page it', '!!document.querySelector(".settings-form")');
    await open('provenance.html');
    await check('provenance page', 'document.querySelector("h1").textContent.length > 0');
  }
} catch (e) { console.error('e2e error:', e); fail++; }
finally {
  if (errors.length) { fail += errors.length; console.log('\nBrowser errors:\n' + errors.join('\n')); }
  console.log(`\n${pass} passed, ${fail} failed`);
  try { ws?.close(); } catch {}
  chrome.kill(); server.close(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch {}
  if (scenario) { delete process.env.DS_CONTENT; await build(); console.log('rebuilt real site'); }
  process.exit(fail ? 1 : 0);
}
