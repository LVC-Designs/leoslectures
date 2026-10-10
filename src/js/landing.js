import { settings, readJSON } from './store.js';
const s = settings.get();
const cc = document.querySelector('.continue-card');
if (cc && s.track) {
  const slug = s.track === 'it-for-en' ? 'learn-italian' : 'impara-inglese';
  const p = readJSON(`ds:${s.track}:progress`, null);
  const a = cc.querySelector('.continue-link');
  a.href = p?.last?.href ? `${slug}/${p.last.href}` : `${slug}/index.html`;
  cc.querySelector('.kicker').textContent = s.track === 'it-for-en' ? 'Continue where you left off' : 'Continua da dove eri rimasto';
  cc.querySelector('.continue-title').textContent = p?.last?.title || (s.track === 'it-for-en' ? 'Learn Italian' : "Impara l'inglese");
  cc.querySelector('.continue-sub').textContent = s.track === 'it-for-en' ? 'Italian for English speakers' : 'Inglese per italiani';
  cc.hidden = false;
}
document.querySelectorAll('.track-card').forEach(a => a.addEventListener('click', () => { settings.set({ track: a.getAttribute('href').startsWith('learn-italian') ? 'it-for-en' : 'en-for-it' }); }));
