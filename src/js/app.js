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

/* Immersion level — honours settings.immersion (low / medium / high) or 'auto' (follow unit level). */
function unitLevel() {
  // Each unit page sets body.data-unit-level in the shell when rendered. For non-unit pages, default A1.
  const el = document.querySelector('[data-unit-level]');
  return el ? el.getAttribute('data-unit-level') : 'A1';
}
function autoImmersion() { const l = unitLevel(); if (l === 'A1') return 'low'; if (l === 'A2') return 'medium'; return 'high'; }
function paintImmersion() {
  const s = settings.get();
  const m = (s.immersion && s.immersion !== 'auto') ? s.immersion : autoImmersion();
  root.setAttribute('data-immersion', m);
}
document.addEventListener('ds:settings', paintImmersion);
paintImmersion();

/* Feedback reveal: shows the email address, a Copy button, and a mailto fallback.
   Mailto links silently do nothing in browsers that have no mail handler configured, so this
   makes the email address visible immediately when the user clicks "Report a mistake". */
function cfgRead() { try { return JSON.parse(document.getElementById('ds-config')?.textContent || '{}'); } catch { return {}; } }
function mailtoURL(email, title, body) {
  return `mailto:${email}?subject=${encodeURIComponent(`[${cfgRead().hubName || 'leoslecture.com'}] ${title}`)}&body=${encodeURIComponent(body)}`;
}
function buildReveal(email, mailto, { label }) {
  const el = document.createElement('div');
  el.className = 'feedback-reveal';
  el.hidden = true;
  el.innerHTML = `
    <p>${esc(label)}</p>
    <p class="feedback-email"><a href="${mailto}" class="feedback-mail">${esc(email)}</a> <button type="button" class="btn btn-ghost feedback-copy" aria-label="Copy email">${esc(t('feedback.copy'))}</button></p>
    <p class="feedback-status" aria-live="polite"></p>
  `;
  el.querySelector('.feedback-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email); el.querySelector('.feedback-status').textContent = t('feedback.copied'); setTimeout(() => (el.querySelector('.feedback-status').textContent = ''), 1800); }
    catch { el.querySelector('.feedback-status').textContent = email; }
  });
  return el;
}

/* Completion card on unit pages: Next unit + Report a mistake (reveals email + Copy) + Ko-fi line. */
function injectCompletion() {
  const practice = document.querySelector('.sec-practice');
  if (!practice || practice.querySelector('.completion-card')) return;
  const cfg = cfgRead();
  const ui = (document.documentElement.lang === 'it') ? 'it' : 'en';
  const kofiLabel = (cfg.kofiLabel && cfg.kofiLabel[ui]) || 'Ko-fi';
  const sup = cfg.kofi ? `<p class="support-line">${t('completion.support', { link: `<a href="${cfg.kofi}" rel="noopener" target="_blank">${kofiLabel}</a>` })}</p>` : '';
  const unitEl = document.querySelector('[data-unit]'); const unitId = unitEl ? unitEl.getAttribute('data-unit') : '';
  const title = document.title; const url = location.href;
  const mail = cfg.feedback ? mailtoURL(cfg.feedback, `Mistake on ${title}`, `Hi Leo,\n\nPage: ${url}\nUnit: ${unitId}\n\nIssue:`) : '';
  const next = document.querySelector('.unit-next a[href]'); const nextHref = next ? next.getAttribute('href') : '';
  const card = document.createElement('div');
  card.className = 'completion-card';
  card.innerHTML = `
    <span class="kicker">${esc(t('completion.title'))}</span>
    <h3>✔</h3>
    <div class="completion-actions">
      ${nextHref ? `<a class="btn btn-primary" href="${nextHref}">${esc(t('completion.next'))} →</a>` : `<span class="muted">${esc(t('completion.end'))}</span>`}
      ${cfg.feedback ? `<button type="button" class="btn btn-ghost completion-report" aria-expanded="false">${esc(t('completion.reportLink'))}</button>` : ''}
    </div>
    ${sup.replace(/&amp;/g, '&')}
  `;
  if (cfg.feedback) {
    const reveal = buildReveal(cfg.feedback, mail, { label: t('feedback.inline') });
    card.appendChild(reveal);
    card.querySelector('.completion-report').addEventListener('click', (e) => {
      reveal.hidden = !reveal.hidden;
      e.currentTarget.setAttribute('aria-expanded', String(!reveal.hidden));
      if (!reveal.hidden) { try { location.href = mail; } catch {} }
    });
  }
  practice.appendChild(card);
}
injectCompletion();

/* Footer feedback: a button that reveals the email + Copy, same shape as the completion card. */
(function addFooterFeedback() {
  const cfg = cfgRead();
  if (!cfg.feedback) return;
  const foot = document.querySelector('.site-foot .wrap p:last-child');
  if (!foot) return;
  const mail = mailtoURL(cfg.feedback, `Feedback on ${document.title}`, `Hi Leo,\n\nPage: ${location.href}\n\nFeedback:`);
  foot.insertAdjacentHTML('beforeend', ' · ');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'footer-feedback-btn'; btn.textContent = t('nav.feedback'); btn.setAttribute('aria-expanded', 'false');
  foot.appendChild(btn);
  const reveal = buildReveal(cfg.feedback, mail, { label: t('feedback.inline') });
  reveal.classList.add('footer-feedback-reveal');
  document.querySelector('.site-foot .wrap').appendChild(reveal);
  btn.addEventListener('click', () => {
    reveal.hidden = !reveal.hidden;
    btn.setAttribute('aria-expanded', String(!reveal.hidden));
    if (!reveal.hidden) { try { location.href = mail; } catch {} }
  });
})();

/* About page: wire the mailto links to also reveal the email next to them. */
(function enhanceAboutLinks() {
  if (!document.body.classList.contains('page-about')) return;
  const cfg = cfgRead(); if (!cfg.feedback) return;
  document.querySelectorAll(`a[href^="mailto:${cfg.feedback}"]`).forEach(a => {
    const reveal = buildReveal(cfg.feedback, a.href, { label: t('feedback.inline') });
    reveal.hidden = false;
    reveal.classList.add('about-feedback-reveal');
    a.insertAdjacentElement('afterend', reveal);
  });
})();
