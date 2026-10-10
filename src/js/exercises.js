// Exercise engine. Reads each .ex block's JSON, renders it for the chosen protagonist, grades answers.
import { settings, progress, t, names, esc, shuffle, target, targetTag } from './store.js';
import { speak } from './tts.js';
import { resolve, isVariant } from './variants.js';
import { compare, compareVariant } from './grade.js';

const ACCENTS = ['à', 'è', 'é', 'ì', 'ò', 'ù'];
const lang = () => target();

/* ---- variant helpers ---- */
function vh(x) { // display html for a possibly-variant string (both forms in DOM, CSS picks)
  const v = resolve(x, names());
  if (v.same) return esc(v.m);
  return `<span class="var${v.who === 'self' ? ' var-self' : ''}"><span class="vm">${esc(v.m)}</span><span class="vf">${esc(v.f)}</span></span>`;
}
function vtext(x) { const v = resolve(x, names()); return v.same ? v.m : (settings.gender(v.who) === 'f' ? v.f : v.m); }
function heroName() { return names()[settings.get().hero || 'm']; }
function otherName(g) { return names()[g]; }
/** Grade input against one or more accepted answers, each possibly a variant. */
function grade(input, accepted) {
  const list = Array.isArray(accepted) ? accepted : [accepted];
  let best = { status: 'wrong', expected: vtext(list[0]) };
  for (const a of list) {
    const v = resolve(a, names());
    const r = v.same ? compare(input, v.m, { lang: lang() }) : compareVariant(input, v, { lang: lang(), gender: settings.gender(v.who) });
    if (r.status === 'ok') return r;
    if (r.status === 'almost' && best.status !== 'almost') best = r;
  }
  return best;
}
function feedbackText(r) {
  if (r.status === 'ok') return t('ex.ok');
  if (r.status === 'almost') {
    if (r.reason === 'variant') return `${t('ex.almost')} · ${t('ex.otherVariant', { other: otherName(r.other), hero: heroName() })} ${r.expected}`;
    return `${t('ex.almost')} · ${t('ex.accents')} ${r.expected}`;
  }
  return t('ex.wrong');
}

/* ---- accent bar ---- */
function accentBar(container) {
  if (lang() !== 'it') return;
  const bar = document.createElement('div');
  bar.className = 'accent-bar'; bar.setAttribute('aria-label', t('accent.label'));
  bar.innerHTML = ACCENTS.map(a => `<button type="button" class="acc" title="${t('accent.hint')}">${a}</button>`).join('');
  let last = null;
  container.addEventListener('focusin', (e) => { if (e.target.matches('input[type=text], textarea')) last = e.target; });
  bar.addEventListener('mousedown', (e) => e.preventDefault());
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.acc'); if (!b || !last) return;
    const s = last.selectionStart ?? last.value.length, en = last.selectionEnd ?? s;
    last.value = last.value.slice(0, s) + b.textContent + last.value.slice(en);
    last.setSelectionRange(s + 1, s + 1); last.focus();
  });
  container.appendChild(bar);
}

/* ---- rendering ---- */
const inputHtml = (extra = '') => `<input type="text" class="ex-in" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${lang()}" placeholder="${esc(t('ex.placeholder'))}" ${extra}>`;
const btn = (cls, label) => `<button type="button" class="btn ${cls}">${esc(label)}</button>`;

export function initExercise(el, opts = {}) {
  if (el.dataset.ready) return;
  el.dataset.ready = '1';
  let d; try { d = JSON.parse(el.querySelector('.ex-data').textContent); } catch { return; }
  const body = el.querySelector('.ex-body'), status = el.querySelector('.ex-status');
  const unit = el.closest('main.lesson')?.dataset.unit || '';
  const nosave = !!el.closest('[data-nosave]');
  let done = false, tries = 0;
  const report = (r, why) => {
    el.dataset.status = r.status;
    status.textContent = feedbackText(r);
    status.className = `ex-status st-${r.status}`;
    if (why && r.status !== 'wrong') status.insertAdjacentHTML('beforeend', `<span class="ex-why">${vh(why)}</span>`);
    if (r.status === 'ok' || r.status === 'almost') { done = true; el.classList.add('done'); if (!nosave) progress.markExercise(unit, d.id, r.status); el.querySelectorAll('.ex-show').forEach(b => b.remove()); }
    else { tries++; if (tries >= 1 && !el.querySelector('.ex-show') && opts.showAnswer !== false) { const sb = document.createElement('button'); sb.type = 'button'; sb.className = 'btn btn-ghost ex-show'; sb.textContent = t('ex.show'); sb.addEventListener('click', () => reveal()); el.querySelector('.ex-actions')?.appendChild(sb); } }
    opts.onResult?.(r.status, d);
  };
  let reveal = () => {};
  const q = d.q ? `<p class="ex-q">${vh(d.q)}</p>` : '';
  const render = {
    mc() {
      body.innerHTML = `${q}<div class="ex-opts" role="group">${d.options.map((o, i) => `<button type="button" class="opt" data-i="${i}" lang="${lang()}">${vh(o)}</button>`).join('')}</div>`;
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { if (done) return; const ok = Number(b.dataset.i) === d.answer; b.classList.add(ok ? 'ok' : 'wrong'); if (ok) body.querySelectorAll('.opt').forEach(x => x.disabled = true); report({ status: ok ? 'ok' : 'wrong', expected: vtext(d.options[d.answer]) }, d.why); }));
      reveal = () => { body.querySelector(`.opt[data-i="${d.answer}"]`)?.classList.add('ok'); status.innerHTML = `${esc(t('ex.expected'))} <b>${vh(d.options[d.answer])}</b> <span class="ex-why">${vh(d.why || '')}</span>`; };
    },
    reply() {
      body.innerHTML = `<p class="ex-line"><span class="ex-line-t" lang="${lang()}">${vh(d.line.t)}</span><button type="button" class="say" data-say="${esc(vtext(d.line.t))}" data-lang="${targetTag()}" aria-label="${esc(t('ex.listen'))}">▶</button>${d.line.n ? `<span class="ex-line-n">${vh(d.line.n)}</span>` : ''}</p>${q}<div class="ex-opts" role="group">${d.options.map((o, i) => `<button type="button" class="opt" data-i="${i}" lang="${lang()}">${vh(o)}</button>`).join('')}</div>`;
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { if (done) return; const ok = Number(b.dataset.i) === d.answer; b.classList.add(ok ? 'ok' : 'wrong'); if (ok) body.querySelectorAll('.opt').forEach(x => x.disabled = true); report({ status: ok ? 'ok' : 'wrong' }, d.why); }));
      reveal = () => { body.querySelector(`.opt[data-i="${d.answer}"]`)?.classList.add('ok'); status.innerHTML = `${esc(t('ex.expected'))} <b>${vh(d.options[d.answer])}</b> <span class="ex-why">${vh(d.why || '')}</span>`; };
    },
    tf() {
      body.innerHTML = `${q}${d.t ? `<p class="ex-line"><span lang="${lang()}">${vh(d.t)}</span><button type="button" class="say" data-say="${esc(vtext(d.t))}" data-lang="${targetTag()}" aria-label="${esc(t('ex.listen'))}">▶</button></p>` : ''}<div class="ex-opts tf" role="group"><button type="button" class="opt" data-v="true">${esc(t('ex.true'))}</button><button type="button" class="opt" data-v="false">${esc(t('ex.false'))}</button></div>`;
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { if (done) return; const ok = (b.dataset.v === 'true') === d.answer; b.classList.add(ok ? 'ok' : 'wrong'); report({ status: ok ? 'ok' : 'wrong' }, d.why); }));
      reveal = () => { body.querySelector(`.opt[data-v="${d.answer}"]`)?.classList.add('ok'); status.innerHTML = `<span class="ex-why">${vh(d.why || '')}</span>`; };
    },
    fill() {
      const parts = vtext(d.q).split('___');
      let html = '<p class="ex-fill" lang="' + lang() + '">';
      parts.forEach((p, i) => { html += esc(p); if (i < parts.length - 1) html += d.choices ? `<select class="ex-sel" data-b="${i}"><option value=""></option>${shuffle(d.choices[i]).map(c => `<option>${esc(vtext(c))}</option>`).join('')}</select>` : `<input type="text" class="ex-in ex-blank" data-b="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" size="${Math.max(6, Math.min(24, (vtext(d.answers[i][0]) || '').length + 2))}">`; });
      html += '</p>';
      if (d.n) html += `<p class="ex-n">${vh(d.n)}</p>`;
      if (d.hint) html += `<p class="ex-hint">${esc(t('ex.hint'))}: ${vh(d.hint)}</p>`;
      body.innerHTML = html + `<div class="ex-actions">${btn('btn-primary ex-check', t('ex.check'))}</div>`;
      if (!d.choices) accentBar(body);
      const check = () => {
        if (done) return;
        const fields = [...body.querySelectorAll('.ex-blank, .ex-sel')];
        let worst = { status: 'ok' };
        fields.forEach(f => { const r = grade(f.value, d.answers[Number(f.dataset.b)]); f.classList.remove('ok', 'almost', 'wrong'); f.classList.add(r.status); if (r.status === 'wrong' || (r.status === 'almost' && worst.status === 'ok')) worst = r; });
        report(worst, d.why);
      };
      body.querySelector('.ex-check').addEventListener('click', check);
      body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ex-blank')) { e.preventDefault(); check(); } });
      reveal = () => body.querySelectorAll('.ex-blank, .ex-sel').forEach(f => { f.value = vtext(d.answers[Number(f.dataset.b)][0]); f.classList.add('ok'); });
    },
    translate() {
      body.innerHTML = `${q}${d.hint ? `<p class="ex-hint">${esc(t('ex.hint'))}: ${vh(d.hint)}</p>` : ''}<div class="ex-row">${inputHtml('size="40"')}</div><div class="ex-actions">${btn('btn-primary ex-check', t('ex.check'))}</div>`;
      accentBar(body);
      const inp = body.querySelector('.ex-in');
      const check = () => { if (done) return; const r = grade(inp.value, d.answers); inp.classList.remove('ok', 'almost', 'wrong'); inp.classList.add(r.status); report(r, d.why); };
      body.querySelector('.ex-check').addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      reveal = () => { inp.value = vtext(d.answers[0]); inp.classList.add('ok'); };
    },
    dictation() {
      body.innerHTML = `${q}<div class="ex-row"><button type="button" class="btn ex-listen">▶ ${esc(t('ex.listen'))}</button><button type="button" class="btn btn-ghost ex-listen-slow">${esc(t('ex.listenSlow'))}</button></div><div class="ex-row">${inputHtml('size="40"')}</div><div class="ex-actions">${btn('btn-primary ex-check', t('ex.check'))}</div>`;
      accentBar(body);
      const inp = body.querySelector('.ex-in');
      body.querySelector('.ex-listen').addEventListener('click', (e) => speak(vtext(d.text), { lang: targetTag(), el: e.currentTarget }));
      body.querySelector('.ex-listen-slow').addEventListener('click', (e) => speak(vtext(d.text), { lang: targetTag(), slow: true, el: e.currentTarget }));
      const check = () => { if (done) return; const r = grade(inp.value, d.answers || d.text); inp.classList.remove('ok', 'almost', 'wrong'); inp.classList.add(r.status); report(r); if (r.status !== 'wrong' && d.n) status.insertAdjacentHTML('beforeend', ` <span class="ex-why">${vh(d.n)}</span>`); };
      body.querySelector('.ex-check').addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      reveal = () => { inp.value = vtext(d.text); inp.classList.add('ok'); status.innerHTML = `<span class="ex-why">${vh(d.n || '')}</span>`; };
    },
    match() {
      const pairs = d.pairs.map((p, i) => ({ i, a: vtext(p[0]), b: vtext(p[1]) }));
      const right = shuffle(pairs);
      body.innerHTML = `${q}<p class="ex-hint">${esc(t('ex.match'))}</p><div class="match"><div class="m-col">${pairs.map(p => `<button type="button" class="m-item" data-side="a" data-i="${p.i}" lang="${lang()}">${esc(p.a)}</button>`).join('')}</div><div class="m-col">${right.map(p => `<button type="button" class="m-item" data-side="b" data-i="${p.i}">${esc(p.b)}</button>`).join('')}</div></div>`;
      let sel = null, matched = 0, wrongs = 0;
      body.querySelectorAll('.m-item').forEach(b => b.addEventListener('click', () => {
        if (b.classList.contains('paired')) return;
        if (!sel) { sel = b; b.classList.add('sel'); return; }
        if (sel === b) { b.classList.remove('sel'); sel = null; return; }
        if (sel.dataset.side === b.dataset.side) { sel.classList.remove('sel'); sel = b; b.classList.add('sel'); return; }
        if (sel.dataset.i === b.dataset.i) { sel.classList.add('paired'); b.classList.add('paired'); sel.classList.remove('sel'); matched++; if (b.dataset.side === 'a') speak(b.textContent, { lang: targetTag() }); else speak(sel.textContent, { lang: targetTag() }); }
        else { wrongs++; sel.classList.add('shake'); b.classList.add('shake'); setTimeout(() => body.querySelectorAll('.shake').forEach(x => x.classList.remove('shake')), 400); sel.classList.remove('sel'); }
        sel = null;
        if (matched === pairs.length) report({ status: wrongs > pairs.length ? 'almost' : 'ok' });
      }));
      reveal = () => {};
    },
    order() {
      const answer = vtext(d.answer);
      const tokens = d.words ? d.words.map(vtext) : answer.split(/\s+/);
      let pool = shuffle(tokens.map((w, i) => ({ w, i })));
      if (pool.length > 1 && pool.map(x => x.w).join(' ') === tokens.join(' ')) pool = pool.reverse();
      const chosen = [];
      body.innerHTML = `${q}<p class="ex-hint">${esc(t('ex.order'))}</p>${d.n ? `<p class="ex-n">${vh(d.n)}</p>` : ''}<div class="order-out" lang="${lang()}" aria-live="polite"></div><div class="order-pool"></div><div class="ex-actions">${btn('btn-primary ex-check', t('ex.check'))}${btn('btn-ghost ex-clear', t('ex.clear'))}</div>`;
      const out = body.querySelector('.order-out'), poolEl = body.querySelector('.order-pool');
      const paint = () => {
        out.innerHTML = chosen.map((x, k) => `<button type="button" class="tok" data-k="${k}">${esc(x.w)}</button>`).join('') || '<span class="order-empty">…</span>';
        poolEl.innerHTML = pool.map((x, k) => `<button type="button" class="tok" data-k="${k}">${esc(x.w)}</button>`).join('');
      };
      paint();
      out.addEventListener('click', (e) => { const b = e.target.closest('.tok'); if (!b || done) return; pool.push(chosen.splice(Number(b.dataset.k), 1)[0]); paint(); });
      poolEl.addEventListener('click', (e) => { const b = e.target.closest('.tok'); if (!b || done) return; chosen.push(pool.splice(Number(b.dataset.k), 1)[0]); paint(); });
      body.querySelector('.ex-clear').addEventListener('click', () => { if (done) return; pool.push(...chosen.splice(0)); paint(); });
      body.querySelector('.ex-check').addEventListener('click', () => { if (done) return; const r = grade(chosen.map(x => x.w).join(' '), d.answer); out.classList.remove('ok', 'wrong'); out.classList.add(r.status === 'wrong' ? 'wrong' : 'ok'); if (r.status !== 'wrong') speak(answer, { lang: targetTag() }); report(r, d.why); });
      reveal = () => { out.innerHTML = `<span class="tok ok">${esc(answer)}</span>`; };
    },
    conjugate() {
      const persons = d.persons || (lang() === 'it' ? ['io', 'tu', 'lui / lei', 'noi', 'voi', 'loro'] : ['I', 'you', 'he / she / it', 'we', 'you', 'they']);
      body.innerHTML = `${q || `<p class="ex-q"><b lang="${lang()}">${esc(d.verb)}</b>${d.tense ? ` · ${esc(d.tense)}` : ''}${d.n ? ` <span class="ex-n">(${vh(d.n)})</span>` : ''}</p>`}<table class="conj-tbl"><tbody>${persons.map((p, i) => `<tr><th>${esc(p)}</th><td><input type="text" class="ex-in ex-blank" data-b="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${lang()}"></td></tr>`).join('')}</tbody></table><div class="ex-actions">${btn('btn-primary ex-check', t('ex.check'))}</div>`;
      accentBar(body);
      const check = () => { if (done) return; let worst = { status: 'ok' }; body.querySelectorAll('.ex-blank').forEach(f => { const a = d.answers[Number(f.dataset.b)]; const r = grade(f.value, Array.isArray(a) ? a : [a]); f.classList.remove('ok', 'almost', 'wrong'); f.classList.add(r.status); if (r.status === 'wrong' || (r.status === 'almost' && worst.status === 'ok')) worst = r; }); report(worst, d.why); };
      body.querySelector('.ex-check').addEventListener('click', check);
      body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ex-blank')) { e.preventDefault(); check(); } });
      reveal = () => body.querySelectorAll('.ex-blank').forEach(f => { const a = d.answers[Number(f.dataset.b)]; f.value = vtext(Array.isArray(a) ? a[0] : a); f.classList.add('ok'); });
    },
    speak() {
      const text = vtext(d.text);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      body.innerHTML = `${q}<p class="ex-line"><span class="ex-line-t" lang="${lang()}">${vh(d.text)}</span><button type="button" class="say" data-say="${esc(text)}" data-lang="${targetTag()}" aria-label="${esc(t('ex.listen'))}">▶</button>${d.n ? `<span class="ex-line-n">${vh(d.n)}</span>` : ''}</p>${d.tip ? `<p class="ex-hint">${vh(d.tip)}</p>` : ''}<div class="ex-actions">${SR ? btn('btn-primary ex-rec', '🎙 ' + t('ex.record')) : ''}${btn('btn-ghost ex-good', t('ex.good'))}${btn('btn-ghost ex-again', t('ex.again'))}</div><p class="ex-heard"></p>${SR ? '' : `<p class="ex-hint">${esc(t('ex.noMic'))}</p>`}`;
      body.querySelector('.ex-good').addEventListener('click', () => report({ status: 'ok' }));
      body.querySelector('.ex-again').addEventListener('click', () => report({ status: 'wrong' }));
      if (SR) body.querySelector('.ex-rec').addEventListener('click', (e) => {
        const rec = new SR(); rec.lang = targetTag(); rec.interimResults = false; rec.maxAlternatives = 3;
        const heard = body.querySelector('.ex-heard'); heard.textContent = t('ex.recording'); e.currentTarget.classList.add('busy');
        rec.onresult = (ev) => { const alts = [...ev.results[0]].map(a => a.transcript); heard.textContent = `${t('ex.heard')} ${alts[0]}`; const r = grade(alts.find(a => grade(a, text).status !== 'wrong') || alts[0], text); report(r); };
        rec.onerror = rec.onend = () => { e.currentTarget.classList.remove('busy'); if (heard.textContent === t('ex.recording')) heard.textContent = ''; };
        try { rec.start(); } catch { heard.textContent = ''; }
      });
      reveal = () => {};
    },
    write() {
      body.innerHTML = `${q}${d.hint ? `<p class="ex-hint">${esc(t('ex.hint'))}: ${vh(d.hint)}</p>` : ''}<textarea class="ex-in ex-area" rows="4" lang="${lang()}" placeholder="${esc(t('ex.placeholder'))}"></textarea><div class="ex-actions">${btn('btn-primary ex-model', t('ex.model'))}</div><div class="ex-modelbox" hidden><p class="ex-hint">${esc(t('ex.selfCheck'))}</p><blockquote lang="${lang()}">${vh(d.model)}</blockquote><div class="ex-actions">${btn('btn-ghost ex-good', t('ex.good'))}${btn('btn-ghost ex-again', t('ex.again'))}</div></div>`;
      accentBar(body);
      body.querySelector('.ex-model').addEventListener('click', () => { body.querySelector('.ex-modelbox').hidden = false; });
      body.querySelector('.ex-good').addEventListener('click', () => report({ status: 'ok' }));
      body.querySelector('.ex-again').addEventListener('click', () => report({ status: 'wrong' }));
      reveal = () => {};
    },
  };
  (render[d.kind] || (() => { body.textContent = `? ${d.kind}`; }))();
  // already done earlier? show state
  if (!nosave && unit) { const e = progress.unit(unit).ex[d.id]; if (e?.s === 'ok') el.classList.add('was-done'); }
}

/* set footer scores */
function paintSets() {
  document.querySelectorAll('.ex-set').forEach(set => {
    const all = [...set.querySelectorAll('.ex')], ok = all.filter(x => x.dataset.status === 'ok' || x.dataset.status === 'almost' || x.classList.contains('was-done')).length;
    const f = set.querySelector('.ex-set-foot'); if (f) f.textContent = t('ex.score', { ok, total: all.length });
  });
}
export function initAll(root = document) { root.querySelectorAll('.ex').forEach(el => initExercise(el)); paintSets(); }
document.addEventListener('ds:progress', paintSets);
if (!document.querySelector('main.page-placement, .page-placement')) initAll();
