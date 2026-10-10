// Settings, progress and spaced-repetition storage. Everything lives in localStorage, per track, wrapped in try/catch.
const KEY = 'ds:';
const root = document.documentElement;
export const track = () => root.dataset.track || '';
export const target = () => root.dataset.target || 'it';
export const targetTag = () => root.dataset.targetTag || 'it-IT';

export function readJSON(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
export function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }

let uiData = null;
export function ui() { if (!uiData) { try { uiData = JSON.parse(document.getElementById('ui-data')?.textContent || '{}'); } catch { uiData = {}; } } return uiData; }
export function t(key, params) {
  const v = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), ui());
  if (v === undefined) return key;
  if (typeof v !== 'string') return v;
  return params ? v.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`)) : v;
}
export const names = () => ui().names || { m: 'Luca', f: 'Lucia' };

/* ---- settings (global, not per track) ---- */
const DEFAULTS = { track: '', hero: '', self: 'm', both: false, theme: 'auto', rate: 0.9, voice: {} };
export const settings = {
  get() { return { ...DEFAULTS, ...readJSON(KEY + 'settings', {}) }; },
  set(patch) { const s = { ...this.get(), ...patch }; writeJSON(KEY + 'settings', s); this.apply(s); document.dispatchEvent(new CustomEvent('ds:settings', { detail: s })); return s; },
  apply(s = this.get()) {
    root.setAttribute('data-hero', s.hero || 'm');
    root.setAttribute('data-self', s.self || 'm');
    root.setAttribute('data-both', s.both ? '1' : '0');
    root.setAttribute('data-theme', s.theme || 'auto');
  },
  gender(who) { const s = this.get(); return who === 'self' ? (s.self || 'm') : (s.hero || 'm'); },
};

/* ---- progress (per track) ---- */
const pkey = () => `${KEY}${track()}:progress`;
export const progress = {
  get() { return readJSON(pkey(), { units: {}, last: null }); },
  save(p) { writeJSON(pkey(), p); document.dispatchEvent(new CustomEvent('ds:progress', { detail: p })); },
  unit(id) { const p = this.get(); return p.units[id] || { ex: {}, seen: {} }; },
  markExercise(unit, id, status) {
    if (!unit) return;
    const p = this.get(); const u = (p.units[unit] = p.units[unit] || { ex: {}, seen: {} });
    const prev = u.ex[id] || { n: 0 };
    const ok = status === 'ok' || status === 'almost';
    u.ex[id] = { s: ok ? 'ok' : (prev.s === 'ok' ? 'ok' : 'wrong'), n: prev.n + 1, t: Date.now() };
    u.last = Date.now();
    this.save(p);
  },
  seen(unit, section) { if (!unit) return; const p = this.get(); const u = (p.units[unit] = p.units[unit] || { ex: {}, seen: {} }); if (!u.seen[section]) { u.seen[section] = Date.now(); this.save(p); } },
  touch(unit, section, title, href) { const p = this.get(); p.last = { unit, section, title, href, t: Date.now() }; writeJSON(pkey(), p); },
  stats(unit, total) { const u = this.unit(unit); const ok = Object.values(u.ex).filter(e => e.s === 'ok').length; return { ok, total: total ?? ok, pct: total ? Math.min(100, Math.round(ok / total * 100)) : 0 }; },
  reset() { try { for (const k of Object.keys(localStorage)) if (k.startsWith(`${KEY}${track()}:`)) localStorage.removeItem(k); } catch {} },
  exportAll() { const out = {}; try { for (const k of Object.keys(localStorage)) if (k.startsWith(KEY)) out[k] = localStorage.getItem(k); } catch {} return out; },
  importAll(obj) { try { for (const [k, v] of Object.entries(obj)) if (k.startsWith(KEY) && typeof v === 'string') localStorage.setItem(k, v); return true; } catch { return false; } },
};

/* ---- spaced repetition (SM-2 light). grade: 0 again · 1 hard · 2 good · 3 easy ---- */
const DAY = 86400000;
export function schedule(card, grade, now = Date.now()) {
  const c = { ef: 2.5, iv: 0, n: 0, due: now, ...(card || {}) };
  if (grade === 0) { c.n = 0; c.iv = 0; c.ef = Math.max(1.3, c.ef - 0.2); c.due = now + 10 * 60000; return c; }
  if (grade === 1) { c.iv = Math.max(1, Math.round(c.iv * 1.2)); c.ef = Math.max(1.3, c.ef - 0.15); }
  else if (grade === 2) { c.iv = c.n === 0 ? 1 : c.n === 1 ? 3 : Math.round(c.iv * c.ef); }
  else { c.iv = c.n === 0 ? 4 : Math.round(c.iv * c.ef * 1.3); c.ef = c.ef + 0.15; }
  c.n += 1; c.due = now + c.iv * DAY; return c;
}
export const srs = {
  load(name) { return readJSON(`${KEY}${track()}:${name}`, { items: {} }); },
  save(name, data) { writeJSON(`${KEY}${track()}:${name}`, data); },
  due(name, now = Date.now()) { const d = this.load(name); return Object.entries(d.items).filter(([, c]) => c.due <= now).map(([id]) => id); },
};

export function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
