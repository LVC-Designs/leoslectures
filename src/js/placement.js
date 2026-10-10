// Placement test: runs a sample of questions per level through the exercise engine, scores by level, suggests a start unit.
import { t, esc, shuffle, writeJSON, track } from './store.js';
import { initExercise } from './exercises.js';
const DATA = JSON.parse(document.getElementById('placement-data').textContent);
const ui = document.querySelector('.pl-ui');
document.querySelector('.pl-start')?.addEventListener('click', start);
function start() {
  const byLevel = { A1: [], A2: [], B1: [] };
  DATA.questions.forEach(q => (byLevel[q.level] = byLevel[q.level] || []).push(q));
  const qs = ['A1', 'A2', 'B1'].flatMap(l => shuffle(byLevel[l] || []).slice(0, 10));
  let i = 0; const score = { A1: [0, 0], A2: [0, 0], B1: [0, 0] };
  ui.setAttribute('data-nosave', '1');
  const next = () => {
    if (i >= qs.length) return finish();
    const q = qs[i];
    ui.innerHTML = `<p class="kicker">${i + 1} / ${qs.length}</p><div class="ex" data-kind="${esc(q.kind)}"><div class="ex-top"><span class="ex-kind">${esc(t('ex.kinds')[q.kind] || q.kind)}</span><span class="ex-status" aria-live="polite"></span></div><div class="ex-body"></div><script type="application/json" class="ex-data">${JSON.stringify({ ...q, id: `pl-${i}` }).replace(/</g, '\\u003c')}</script></div><div class="ex-actions"><button type="button" class="btn pl-next" disabled>${esc(t('placement.next'))}</button></div>`;
    const el = ui.querySelector('.ex'); const nb = ui.querySelector('.pl-next');
    initExercise(el, { showAnswer: false, onResult: (status) => { score[q.level][1]++; if (status === 'ok' || status === 'almost') score[q.level][0]++; nb.disabled = false; } });
    nb.addEventListener('click', () => { i++; next(); });
  };
  const finish = () => {
    const pct = (l) => score[l][1] ? score[l][0] / score[l][1] : 0;
    let level = 'A0';
    if (pct('A1') >= 0.7) level = 'A1';
    if (level === 'A1' && pct('A2') >= 0.7) level = 'A2';
    if (level === 'A2' && pct('B1') >= 0.7) level = 'B1';
    const startUnit = level === 'A0' ? DATA.starts.A1 : level === 'A1' ? DATA.starts.A2 : level === 'A2' ? DATA.starts.B1 : DATA.starts.B1;
    writeJSON(`ds:${track()}:placement`, { level, score, at: Date.now() });
    ui.innerHTML = `<h2>${esc(t('placement.result'))}: ${level === 'A0' ? 'A1' : level}</h2><p>${esc(t('placement.level')[level])}</p><p class="pl-scores">${['A1', 'A2', 'B1'].map(l => `${l}: ${score[l][0]} / ${score[l][1]}`).join(' · ')}</p><p><a class="btn btn-primary" href="units/unit-${startUnit}.html">${esc(t('placement.startAt', { unit: Number(startUnit) }))}</a> <button type="button" class="btn pl-again">${esc(t('placement.again'))}</button></p>`;
    ui.querySelector('.pl-again').addEventListener('click', start);
  };
  next();
}
