// Text-to-speech with per-language voice selection: it-IT for Italian, en-CA (fallback en-US, en-GB) for English.
import { settings, t } from './store.js';

const synth = window.speechSynthesis;
let voices = [];
let readyResolve; const readyP = new Promise(r => (readyResolve = r));
function load() { if (!synth) { readyResolve(); return; } voices = synth.getVoices(); if (voices.length) readyResolve(); }
if (synth) { load(); synth.addEventListener?.('voiceschanged', () => { load(); document.dispatchEvent(new Event('ds:voices')); }); setTimeout(() => readyResolve(), 1500); }
export const ready = () => readyP;
export const available = () => !!synth;
export const allVoices = () => voices;

const QUALITY = /natural|neural|premium|enhanced|google|microsoft|siri|alice|elsa|isabela|diego|luca|cosimo|clara|amelie|serena/i;
export function voicesFor(lang) {
  const base = lang.split('-')[0].toLowerCase();
  return voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(base));
}
function fallbacks(lang) {
  try { const list = JSON.parse(document.querySelector('meta[name="ds-voices"]')?.content || '[]'); if (list.length && list[0].split('-')[0] === lang.split('-')[0]) return list; } catch {}
  return [lang];
}
export function pickVoice(lang) {
  const s = settings.get();
  const base = lang.split('-')[0];
  const chosen = s.voice?.[base];
  if (chosen) { const v = voices.find(v => v.voiceURI === chosen || v.name === chosen); if (v) return v; }
  const cands = voicesFor(lang);
  if (!cands.length) return null;
  for (const tag of fallbacks(lang)) {
    const exact = cands.filter(v => v.lang.toLowerCase().replace('_', '-') === tag.toLowerCase());
    const good = exact.find(v => QUALITY.test(v.name)) || exact[0];
    if (good) return good;
  }
  return cands.find(v => QUALITY.test(v.name)) || cands[0];
}

let noticeShown = {};
function notice(lang) {
  const el = document.querySelector('.tts-notice');
  if (!el || noticeShown[lang]) return;
  noticeShown[lang] = true;
  el.textContent = t('tts.none', { lang: lang.split('-')[0] === 'it' ? 'Italian / italiano' : 'English / inglese' });
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 8000);
}

export function stop() { try { synth?.cancel(); } catch {} document.querySelectorAll('.say.playing').forEach(b => b.classList.remove('playing')); }

/** Speak text. Returns a promise resolving when done. opts: {lang, rate, slow, el} */
export function speak(text, opts = {}) {
  if (!synth || !text) return Promise.resolve();
  const lang = opts.lang || document.documentElement.dataset.targetTag || 'it-IT';
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = lang; notice(lang); }
    const base = opts.rate ?? Number(settings.get().rate || 0.9);
    u.rate = opts.slow ? Math.max(0.5, base - 0.3) : base;
    u.pitch = 1;
    const el = opts.el;
    if (el) el.classList.add('playing');
    u.onend = u.onerror = () => { if (el) el.classList.remove('playing'); res(); };
    try { synth.cancel(); synth.speak(u); } catch { res(); }
  });
}

/** Resolve the text of a say-button for the current protagonist. */
export function sayText(btn) {
  const d = btn.dataset;
  if (d.say != null) return d.say;
  const g = settings.gender(d.who === 'self' ? 'self' : 'hero');
  return g === 'f' ? d.sayF : d.sayM;
}

/** Wire every .say button and dialogue play-all buttons (delegated). */
export function wire(root = document) {
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('.say');
    if (b) { e.preventDefault(); e.stopPropagation(); if (b.classList.contains('playing')) { stop(); return; } await speak(sayText(b), { lang: b.dataset.lang, el: b }); return; }
    const p = e.target.closest('.dlg-play');
    if (p) {
      const art = document.getElementById(p.dataset.target);
      if (!art) return;
      if (p.classList.contains('busy')) { stop(); p.classList.remove('busy'); p.textContent = p.dataset.play; return; }
      p.classList.add('busy'); p.textContent = '■ ' + p.dataset.stop;
      const lines = [...art.querySelectorAll('li.line')];
      for (const li of lines) {
        if (!p.classList.contains('busy')) break;
        li.classList.add('now'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const btn = li.querySelector('.say');
        await speak(sayText(btn), { lang: li.dataset.lang, el: btn });
        li.classList.remove('now');
        await new Promise(r => setTimeout(r, 350));
      }
      p.classList.remove('busy'); p.textContent = p.dataset.play;
    }
  });
}
