// Flashcards with spaced repetition (SM-2 light). Decks: per unit (all cards) or "all" (due cards only).
import { srs, schedule, t, esc, shuffle, targetTag } from './store.js';
import { speak } from './tts.js';

function init(box) {
  if (box.dataset.ready) return; box.dataset.ready = '1';
  let deck; try { deck = JSON.parse(box.querySelector('.fc-data').textContent); } catch { return; }
  const ui = box.querySelector('.fc-ui');
  const dueOnly = box.dataset.dueOnly === '1';
  const data = srs.load('fc');
  const now = Date.now();
  const isDue = (c) => { const s = data.items[c.id]; return !s || s.due <= now; };
  let queue = deck.filter(c => dueOnly ? (data.items[c.id] && data.items[c.id].due <= now) : isDue(c));
  if (!dueOnly) queue = [...queue.filter(c => data.items[c.id]), ...shuffle(queue.filter(c => !data.items[c.id]))];
  const counts = () => ({ due: deck.filter(c => data.items[c.id] && data.items[c.id].due <= now).length, fresh: deck.filter(c => !data.items[c.id]).length });
  let i = 0, flipped = false;
  const paint = () => {
    const c = queue[i];
    if (!c) { ui.innerHTML = `<p class="fc-done">${esc(t('flash.done'))}</p>`; return; }
    ui.innerHTML = `<div class="fc-meta"><span>${queue.length - i} ${esc(t('flash.left'))}</span><span>${counts().due} ${esc(t('flash.due'))} · ${counts().fresh} ${esc(t('flash.new'))}</span></div>
<div class="fc-card${flipped ? ' flipped' : ''}" tabindex="0" role="button" aria-pressed="${flipped}"><div class="fc-front"><span class="fc-word" lang="${document.documentElement.dataset.target}">${esc(c.front)}</span><button type="button" class="say" data-say="${esc(c.front)}" data-lang="${targetTag()}" aria-label="${esc(t('tts.listen'))}">▶</button></div><div class="fc-back"><span class="fc-word">${esc(c.back)}</span>${c.hint ? `<span class="fc-hint" lang="${document.documentElement.dataset.target}">${esc(c.hint)}</span>` : ''}</div></div>
<div class="fc-actions">${flipped ? `<button type="button" class="btn g0">${esc(t('flash.again'))}</button><button type="button" class="btn g1">${esc(t('flash.hard'))}</button><button type="button" class="btn btn-primary g2">${esc(t('flash.good'))}</button><button type="button" class="btn g3">${esc(t('flash.easy'))}</button>` : `<button type="button" class="btn btn-primary fc-flip">${esc(t('flash.show'))}</button>`}</div>`;
    const card = ui.querySelector('.fc-card');
    const flip = () => { flipped = !flipped; paint(); };
    card.addEventListener('click', (e) => { if (!e.target.closest('.say')) flip(); });
    card.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    ui.querySelector('.fc-flip')?.addEventListener('click', flip);
    if (!flipped) speak(c.front, { lang: targetTag() });
    [0, 1, 2, 3].forEach(g => ui.querySelector(`.g${g}`)?.addEventListener('click', () => {
      data.items[c.id] = schedule(data.items[c.id], g); srs.save('fc', data);
      if (g === 0) queue.push(c);
      i++; flipped = false; paint();
    }));
  };
  if (!queue.length) { ui.innerHTML = `<p class="fc-done">${esc(t('flash.done'))}</p>`; return; }
  ui.innerHTML = `<div class="fc-meta"><span>${queue.length} ${esc(dueOnly ? t('flash.due') : t('flash.left'))}</span></div><div class="fc-actions"><button type="button" class="btn btn-primary fc-start">${esc(t('flash.start'))}</button></div>`;
  ui.querySelector('.fc-start').addEventListener('click', paint);
}
document.querySelectorAll('.flashcards').forEach(init);
