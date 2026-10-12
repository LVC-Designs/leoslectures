// Content + output checks: exercise schema, translations present, both Luca/Lucia variants well-formed,
// every audio button has text, no placeholder text in dist, internal links and anchors resolve, UI strings complete.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isVariant } from '../src/js/variants.js';
import { TENSES as TENSES_IT } from '../src/js/conj-it.js';
import { TENSES as TENSES_EN } from '../src/js/conj-en.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => path.join(root, ...p);
const problems = [];
const warn = (m) => problems.push(m);
const site = JSON.parse(fs.readFileSync(P('site.json'), 'utf8'));

function checkVar(x, ctx) {
  if (isVariant(x)) {
    if (!x.m || !x.f) warn(`${ctx}: variant needs both m and f: ${JSON.stringify(x)}`);
    if (x.m === x.f) warn(`${ctx}: variant with identical m/f (use a plain string): ${JSON.stringify(x)}`);
    if (x.who && x.who !== 'self' && x.who !== 'hero') warn(`${ctx}: variant.who must be hero or self`);
  }
  if (typeof x === 'string' && /\{\{[^|}]*\}\}/.test(x)) warn(`${ctx}: inline variant without "|": ${x}`);
}
function walk(b, ctx) {
  if (Array.isArray(b)) return b.forEach(x => walk(x, ctx));
  if (!b || typeof b !== 'object') return;
  if (b.type === 'dialogue' || b.type === 'scene') {
    (b.lines || []).forEach((l, i) => { if (!l.stage && (!l.t || !l.n)) warn(`${ctx}: dialogue "${b.title}" line ${i + 1} missing t/n`); checkVar(l.t, ctx); checkVar(l.n, ctx); checkVar(l.who, ctx); });
    if (!b.title) warn(`${ctx}: dialogue without title`);
    if (b.questions) b.questions.forEach(q => checkEx(q, ctx + ' scene-q'));
  }
  if (b.type === 'vocab') (b.items || []).forEach(v => { if (!v.t || !v.n) warn(`${ctx}: vocab item missing t/n: ${JSON.stringify(v)}`); if (!v.ex) warn(`${ctx}: vocab "${v.t}" has no example sentence`); });
  if (b.type === 'examples') (b.items || []).forEach(e => { if (!e.t || !e.n) warn(`${ctx}: example missing t/n`); checkVar(e.t, ctx); checkVar(e.n, ctx); });
  if (b.type === 'grammar' && !b.title) warn(`${ctx}: grammar block without title`);
  if (b.type === 'conjugation' && !b.tense) warn(`${ctx}: conjugation block without tense`);
  if (b.type === 'agreement') (b.items || []).forEach(it => { if (!isVariant(it.t)) warn(`${ctx}: agreement item must be a variant`); });
  if (b.type === 'exercise' || (b.kind && !b.type)) checkEx(b, ctx);
  if (b.type === 'exercises') { if (!Array.isArray(b.items) || !b.items.length) warn(`${ctx}: empty exercise set`); (b.items || []).forEach(x => checkEx(x, ctx)); }
  if (b.blocks) walk(b.blocks, ctx);
  if (Array.isArray(b.cols)) b.cols.forEach(c => walk(c, ctx));
  if (b.groups) walk(b.groups, ctx);
}
function checkEx(x, ctx) {
  const id = `${ctx} [${x.kind}] "${String(typeof x.q === 'string' ? x.q : x.q?.m || x.text || x.line?.t || '').slice(0, 40)}"`;
  const ans = (a) => (Array.isArray(a) ? a : [a]);
  switch (x.kind) {
    case 'mc': case 'reply':
      if (!Array.isArray(x.options) || x.options.length < 2) warn(`${id}: options`);
      if (typeof x.answer !== 'number' || x.answer < 0 || x.answer >= (x.options || []).length) warn(`${id}: answer index`);
      if (!x.why) warn(`${id}: missing why`);
      if (x.kind === 'reply' && !x.line?.t) warn(`${id}: reply needs line.t`);
      break;
    case 'tf':
      if (typeof x.answer !== 'boolean') warn(`${id}: tf answer must be boolean`);
      if (!x.why) warn(`${id}: missing why`);
      break;
    case 'fill': {
      const q = typeof x.q === 'string' ? x.q : x.q?.m || '';
      const blanks = (q.match(/___/g) || []).length;
      if (!blanks) warn(`${id}: fill has no ___ blank`);
      if (!Array.isArray(x.answers) || x.answers.length !== blanks) warn(`${id}: ${blanks} blanks vs ${x.answers?.length} answer sets`);
      (x.answers || []).forEach(a => { if (!Array.isArray(a) || !a.length) warn(`${id}: each answer set must be a non-empty array`); a.forEach?.(v => checkVar(v, id)); });
      if (x.choices && (!Array.isArray(x.choices) || x.choices.length !== blanks)) warn(`${id}: choices must match blanks`);
      if (!x.n) warn(`${id}: missing n translation`);
      break; }
    case 'match': if (!Array.isArray(x.pairs) || x.pairs.length < 3) warn(`${id}: match needs ≥3 pairs`); break;
    case 'order': if (!x.answer || !x.n) warn(`${id}: order needs answer + n`); break;
    case 'translate': if (!Array.isArray(x.answers) || !x.answers.length) warn(`${id}: answers`); if (!x.q) warn(`${id}: q`); break;
    case 'dictation': if (!x.text) warn(`${id}: text`); if (!x.n) warn(`${id}: missing n`); break;
    case 'conjugate': if (!x.verb || !Array.isArray(x.answers) || (x.persons && x.answers.length !== x.persons.length)) warn(`${id}: conjugate answers`); break;
    case 'speak': if (!x.text) warn(`${id}: text`); break;
    case 'write': if (!x.q || !x.model) warn(`${id}: write needs q + model`); break;
    default: warn(`${id}: unknown kind`);
  }
  checkVar(x.q, id);
}

// locales: same key set
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [p + k]);
const en = new Set(flat(JSON.parse(fs.readFileSync(P('locales/en.json'), 'utf8')))), it = new Set(flat(JSON.parse(fs.readFileSync(P('locales/it.json'), 'utf8'))));
for (const k of en) if (!it.has(k)) warn(`locales/it.json missing "${k}"`);
for (const k of it) if (!en.has(k)) warn(`locales/en.json missing "${k}"`);

// tenses.json: one explanation per conjugator tense, in the learner's language
for (const track of Object.keys(site.tracks)) {
  const f = P('content', track, 'tenses.json'); if (!fs.existsSync(f)) { warn(`${track}: content/${track}/tenses.json missing`); continue; }
  const T = JSON.parse(fs.readFileSync(f, 'utf8'));
  const keys = (site.tracks[track].target === 'it' ? TENSES_IT : TENSES_EN).map(t => t[0]);
  for (const k of keys) if (!T[k]) warn(`${track}/tenses.json: no entry for tense "${k}"`);
  for (const [k, v] of Object.entries(T)) {
    if (!keys.includes(k)) warn(`${track}/tenses.json: unknown tense "${k}"`);
    for (const field of ['name', 'use', 'form']) if (!v[field]) warn(`${track}/tenses.json "${k}": missing ${field}`);
    if (!v.example?.t || !v.example?.n) warn(`${track}/tenses.json "${k}": example needs t and n`);
  }
}
for (const track of Object.keys(site.tracks)) {
  const dir = P('content', track);
  const course = JSON.parse(fs.readFileSync(path.join(dir, 'course.json'), 'utf8'));
  for (const f of fs.readdirSync(dir).filter(f => /^unit-\d\d\.json$/.test(f))) {
    const U = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const ctxf = `${track}/${f}`;
    if (!course.units.find(u => u.id === U.id)) warn(`${ctxf}: id ${U.id} not in course.json`);
    const kinds = (U.sections || []).map(s => s.kind);
    for (const k of ['story', 'words', 'grammar', 'pron', 'practice', 'culture', 'summary']) if (!kinds.includes(k)) warn(`${ctxf}: missing section kind "${k}"`);
    let exCount = 0, review = false;
    (U.sections || []).forEach(s => { walk(s.blocks, `${ctxf}/${s.id}`); (function cnt(b) { if (Array.isArray(b)) return b.forEach(cnt); if (!b || typeof b !== 'object') return; if (b.type === 'exercises') { exCount += b.items?.length || 0; if (b.review) review = true; } if (b.type === 'exercise') exCount++; if (b.questions) exCount += b.questions.length; if (b.blocks) cnt(b.blocks); if (Array.isArray(b.cols)) b.cols.forEach(cnt); })(s.blocks); });
    if (exCount < 25) warn(`${ctxf}: only ${exCount} exercises (template asks for 25–40)`);
    if (!review) warn(`${ctxf}: practice section has no mixed review set (exercises block with "review": true)`);
  }
  const gdir = path.join(dir, 'grammar');
  if (fs.existsSync(gdir)) for (const f of fs.readdirSync(gdir).filter(f => f.endsWith('.json'))) { const G = JSON.parse(fs.readFileSync(path.join(gdir, f), 'utf8')); if (G.id !== f.replace(/\.json$/, '')) warn(`${track}/grammar/${f}: id must equal filename`); walk(G.blocks, `${track}/grammar/${f}`); }
  for (const f of ['phrasebook.json', 'placement.json']) if (fs.existsSync(path.join(dir, f))) walk(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).groups || [], `${track}/${f}`);
}

// dist checks
const dist = P('dist');
if (fs.existsSync(dist)) {
  const htmls = [];
  (function rec(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) rec(p); else if (p.endsWith('.html')) htmls.push(p); } })(dist);
  for (const h of htmls) {
    const s = fs.readFileSync(h, 'utf8');
    const rel = path.relative(root, h);
    const content = s.replace(/<script type="application\/json" id="ui-data">[\s\S]*?<\/script>/, '');
    if (/\bTODO\b|\bPLACEHOLDER\b|\bTBD\b|\bFIXME\b/.test(content) || /lorem ipsum/i.test(content)) warn(`${rel}: placeholder text`);
    if (/data-say=""/.test(s) || /data-say-m=""/.test(s) || /data-say-f=""/.test(s)) warn(`${rel}: empty audio button`);
    for (const m of s.matchAll(/(?:href|src)="([^"#:]+)(#[^"]*)?"/g)) {
      if (/^(mailto|tel|javascript):/.test(m[1])) continue;
      // Absolute (starts with /) resolves against dist root; relative resolves from the page's directory.
      // A link to a directory (trailing /) is treated as that directory's index.html.
      let href = m[1];
      const absolute = href.startsWith('/');
      let target = absolute ? path.join(dist, href) : path.resolve(path.dirname(h), href);
      if (target.endsWith('/') || !path.extname(target)) {
        const asIndex = path.join(target, 'index.html');
        if (fs.existsSync(asIndex)) target = asIndex;
      }
      if (!fs.existsSync(target)) warn(`${rel}: broken link ${m[1]}`);
      else if (m[2] && m[2].length > 1 && target.endsWith('.html')) {
        const t = fs.readFileSync(target, 'utf8');
        if (!new RegExp(`id="${m[2].slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(t)) warn(`${rel}: missing anchor ${m[1]}${m[2]}`);
      }
    }
  }
} else warn('dist/ not built (run npm run build first)');
if (problems.length) { console.log(problems.join('\n')); console.log(`\n${problems.length} problem(s)`); process.exit(1); }
console.log('check: all good');
