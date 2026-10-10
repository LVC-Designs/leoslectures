// Core page behaviour: settings, theme, menu, protagonist switch, variants toggle, audio wiring, progress rings, continue card.
import { settings, progress, track, t, names, esc } from './store.js';
import { wire as wireTTS, stop as stopTTS } from './tts.js';

const root = document.documentElement;
settings.apply();
wireTTS();

/* theme */
document.querySelectorAll('.theme-btn').forEach(b => b.addEventListener('click', () => {
  const cur = root.getAttribute('data-theme');
  const dark = cur === 'dark' || (cur !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  settings.set({ theme: dark ? 'light' : 'dark' });
}));

/* mobile menu */
const navBtn = document.querySelector('.nav-btn');
navBtn?.addEventListener('click', () => { const open = root.classList.toggle('nav-open'); navBtn.setAttribute('aria-expanded', String(open)); });

/* protagonist switch in the header */
function paintHero() {
  const h = settings.get().hero || 'm';
  document.querySelectorAll('.hero-btn').forEach(b => b.classList.toggle('active', b.dataset.hero === h));
  document.querySelectorAll('.both-toggle').forEach(b => paintBoth(b));
}
document.querySelectorAll('.hero-btn').forEach(b => b.addEventListener('click', () => { settings.set({ hero: b.dataset.hero }); stopTTS(); }));
document.addEventListener('ds:settings', paintHero);
paintHero();

/* per-dialogue "both versions" toggle */
function paintBoth(b) {
  const art = b.closest('.dialogue');
  const on = art?.dataset.both === '1' || settings.get().both;
  b.setAttribute('aria-pressed', String(on));
  b.textContent = on ? b.dataset.on.replace('{hero}', names()[settings.get().hero || 'm']) : b.dataset.off;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.both-toggle');
  if (b) { const art = b.closest('.dialogue'); art.dataset.both = art.dataset.both === '1' ? '0' : '1'; paintBoth(b); return; }
  const tg = e.target.closest('.dlg-toggle');
  if (tg) { const art = document.getElementById(tg.dataset.target); const on = art.classList.toggle('show-n'); tg.setAttribute('aria-pressed', String(on)); tg.textContent = on ? tg.dataset.on : tg.dataset.off; return; }
  const why = e.target.closest('.why');
  if (why) { const note = why.nextElementSibling; const open = note.hidden; note.hidden = !open; why.setAttribute('aria-expanded', String(open)); return; }
  const line = e.target.closest('li.line');
  if (line && !e.target.closest('button, a, .var')) { line.querySelector('.say')?.click(); }
});

/* dialogue lines: translation hidden by default on unit pages (class show-n toggles) */

/* progress rings */
function paintRing(el, pct) {
  if (!el) return;
  el.querySelector('.ring-val')?.setAttribute('stroke-dasharray', `${pct} 100`);
  const lbl = el.querySelector('.pct'); if (lbl) lbl.textContent = `${pct}%`;
  el.setAttribute('aria-label', `${pct} ${t('a11y.pct')}`);
}
const lesson = document.querySelector('main.lesson');
if (lesson) {
  const unit = lesson.dataset.unit, total = Number(lesson.dataset.exercises || 0);
  const paint = () => { const st = progress.stats(unit, total); paintRing(document.querySelector('.toc-ring'), total ? st.pct : 0); };
  paint();
  document.addEventListener('ds:progress', paint);
  // section observer: current section in the TOC + remember position
  const title = document.querySelector('h1')?.textContent?.trim() || '';
  const sections = [...lesson.querySelectorAll('section.sec')];
  const links = new Map([...document.querySelectorAll('.toc-list a')].map(a => [a.dataset.sec, a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.dataset.sec;
      links.forEach((a, k) => a.classList.toggle('current', k === id));
      progress.seen(unit, id);
      progress.touch(unit, id, title, location.pathname.split('/').slice(-2).join('/') + '#sec-' + id);
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));
  // unit visited even without scrolling
  progress.touch(unit, '', title, location.pathname.split('/').slice(-2).join('/'));
}

/* track home: card rings, continue card, protagonist dialog */
const home = document.querySelector('main.home');
if (home) {
  const p = progress.get();
  document.querySelectorAll('.lesson-card[data-unit]').forEach(card => {
    const id = card.dataset.unit; const meta = card.querySelector('.card-meta')?.textContent || '';
    const total = Number((meta.match(/(\d+)\s/) || [])[1] || 0);
    const st = progress.stats(id, total);
    paintRing(card.querySelector('.card-prog'), total ? st.pct : 0);
  });
  const cc = home.querySelector('.continue-card');
  if (cc && p.last?.href) { cc.hidden = false; const a = cc.querySelector('.continue-link'); a.href = p.last.href; cc.querySelector('.continue-title').textContent = p.last.title || ''; cc.querySelector('.continue-sub').textContent = `${t('unit.unit')} ${Number(p.last.unit)}`; }
  const dlg = document.getElementById('hero-dialog');
  const s = settings.get();
  if (dlg && !s.hero && typeof dlg.showModal === 'function') {
    dlg.addEventListener('close', () => { const f = dlg.querySelector('form'); const fd = new FormData(f); settings.set({ hero: fd.get('hero') || 'm', self: fd.get('self') || 'm', track: track() }); });
    dlg.showModal();
  } else if (!s.track || s.track !== track()) settings.set({ track: track() });
}

/* speed slider */
document.querySelectorAll('.tts-rate').forEach(r => {
  r.value = settings.get().rate || 0.9;
  const out = r.closest('.tts-ctl')?.querySelector('.tts-rate-val'); if (out) out.textContent = `${Number(r.value).toFixed(1)}×`;
  r.addEventListener('input', () => { settings.set({ rate: Number(r.value) }); if (out) out.textContent = `${Number(r.value).toFixed(1)}×`; });
});

/* gloss tooltips are CSS; keyboard users get them on focus. Escape stops audio. */
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stopTTS(); });
