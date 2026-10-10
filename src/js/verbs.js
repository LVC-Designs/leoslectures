// Verb conjugator + trainer. Conjugates in the browser from the verb list; the trainer remembers wrong forms (SRS).
import { srs, schedule, settings, t, esc, shuffle, target, targetTag, names } from './store.js';
import { compare, compareVariant } from './grade.js';
import { isVariant } from './variants.js';

const lang = target();
const mod = await import(lang === 'it' ? './conj-it.js' : './conj-en.js');
const DATA = JSON.parse(document.getElementById('verbs-data').textContent);
const specs = DATA.verbs;
const key = (s) => s.inf || s.base;
const cache = new Map();
const conj = (k) => { if (!cache.has(k)) cache.set(k, mod.conjugate(specs.find(s => key(s) === k))); return cache.get(k); };
const G = t('verbs.groups');

const out = document.querySelector('.vb-out'), search = document.querySelector('.vb-search'), tenseSel = document.querySelector('.vb-tense'), list = document.getElementById('vb-list');
list.innerHTML = specs.map(s => `<option value="${esc(key(s))}">${esc(s.n)}</option>`).join('');
tenseSel.innerHTML = (() => { const groups = new Map(); mod.TENSES.forEach(([k, label, g]) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push([k, label]); }); return [...groups].map(([g, items]) => `<optgroup label="${esc(G[g] || g)}">${items.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</optgroup>`).join(''); })();
let mode = 'table', verb = specs[0] ? key(specs[0]) : '', tense = mod.TENSES[0][0];
const url = new URL(location.href); if (url.searchParams.get('v') && specs.find(s => key(s) === url.searchParams.get('v'))) verb = url.searchParams.get('v'); if (url.searchParams.get('t')) tense = url.searchParams.get('t');
search.value = verb; tenseSel.value = tense;

const formText = (f) => isVariant(f) ? (settings.get().hero === 'f' ? f.f : f.m) : f;
const formHtml = (f) => isVariant(f) ? `<span class="var"><span class="vm">${esc(f.m)}</span><span class="vf">${esc(f.f)}</span></span>` : esc(f);
const sayBtn = (f) => isVariant(f) ? `<button type="button" class="say" data-say-m="${esc(f.m)}" data-say-f="${esc(f.f)}" data-lang="${targetTag()}" aria-label="${esc(t('tts.listen'))}">▶</button>` : `<button type="button" class="say" data-say="${esc(f)}" data-lang="${targetTag()}" aria-label="${esc(t('tts.listen'))}">▶</button>`;

function head(v) {
  const spec = specs.find(s => key(s) === verb);
  const meta = lang === 'it' ? `${v.aux ? `${esc(t('verbs.aux'))}: <b>${esc(v.aux === 'both' ? 'avere / essere' : v.aux)}</b>` : ''}${v.irregular ? ' · <span class="badge">irr.</span>' : ''}${v.reflexive ? ' · <span class="badge">rifl.</span>' : ''}` : `${v.irregular ? '<span class="badge">irregular</span> · ' : ''}<b lang="en">${esc(v.forms.base)} · ${esc(v.forms.past)} · ${esc(v.forms.pp)}</b>`;
  const unit = spec?.unit && DATA.units[spec.unit] ? ` · ${esc(t('verbs.taughtIn'))} ${DATA.units[spec.unit]}` : '';
  return `<header class="vb-head"><h2 lang="${lang}">${esc(key(spec))}</h2><p class="vb-meta">${esc(spec?.n || '')} · ${meta}${unit}</p></header>`;
}
function table() {
  const v = conj(verb); const T = v.tenses[tense]; if (!T) { out.innerHTML = ''; return; }
  const hero = names()[settings.get().hero || 'm'];
  const note = lang === 'it' && T.forms.some(isVariant) ? `<p class="tbl-note">${esc(t('verbs.showHero', { hero }))}</p>` : '';
  if (lang === 'en' && T.neg) {
    out.innerHTML = head(v) + `<figure class="tbl-wrap conj"><figcaption>${esc(T.label)}</figcaption><table class="tbl"><thead><tr><th></th><th>+</th><th>−</th><th>?</th></tr></thead><tbody>${T.persons.map((p, i) => `<tr><th>${esc(p)}</th><td lang="en">${esc(T.forms[i])}${T.short?.[i] ? ` <span class="muted">(${esc(T.short[i])})</span>` : ''}${sayBtn(T.forms[i])}</td><td lang="en">${esc(T.neg[i])}${sayBtn(T.neg[i])}</td><td lang="en">${esc(T.q[i])}${sayBtn(T.q[i])}</td></tr>`).join('')}</tbody></table></figure>`;
  } else {
    out.innerHTML = head(v) + `<figure class="tbl-wrap conj"><figcaption>${esc(T.label)}</figcaption><table class="tbl"><tbody>${T.persons.map((p, i) => `<tr><th>${esc(p)}</th><td lang="${lang}">${formHtml(T.forms[i])}${sayBtn(T.forms[i])}</td></tr>`).join('')}</tbody></table>${note}</figure>`;
  }
}
function gradeForm(input, f) {
  return isVariant(f) ? compareVariant(input, { ...f, same: false }, { lang, gender: settings.get().hero || 'm' }) : compare(input, f, { lang });
}
function drill(items) {
  // items: [{verb, tense, i}] ; default: all persons of current verb/tense
  const v = conj(verb); const T = v.tenses[tense]; if (!T) return;
  const rows = items || T.persons.map((_, i) => ({ verb, tense, i }));
  out.innerHTML = (items ? '' : head(v)) + `<p class="ex-hint">${esc(t('verbs.fillAll'))}</p><table class="conj-tbl"><tbody>${rows.map((r, k) => { const vv = conj(r.verb), TT = vv.tenses[r.tense]; return `<tr><th>${items ? `<span lang="${lang}">${esc(r.verb)}</span> · ${esc(TT.label)} · ` : ''}${esc(TT.persons[r.i])}</th><td><input type="text" class="ex-in ex-blank" data-k="${k}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${lang}"></td></tr>`; }).join('')}</tbody></table><div class="ex-actions"><button type="button" class="btn btn-primary vb-check">${esc(t('verbs.check'))}</button></div><p class="ex-status" aria-live="polite"></p>`;
  if (lang === 'it') { const bar = document.createElement('div'); bar.className = 'accent-bar'; bar.innerHTML = ['à', 'è', 'é', 'ì', 'ò', 'ù'].map(a => `<button type="button" class="acc">${a}</button>`).join(''); let last = null; out.addEventListener('focusin', e => { if (e.target.matches('input')) last = e.target; }); bar.addEventListener('mousedown', e => e.preventDefault()); bar.addEventListener('click', e => { const b = e.target.closest('.acc'); if (b && last) { const s = last.selectionStart; last.value = last.value.slice(0, s) + b.textContent + last.value.slice(last.selectionEnd); last.setSelectionRange(s + 1, s + 1); last.focus(); } }); out.querySelector('.ex-actions').before(bar); }
  const check = () => {
    const data = srs.load('conj'); let ok = 0;
    out.querySelectorAll('.ex-blank').forEach(inp => {
      const r = rows[Number(inp.dataset.k)]; const f = conj(r.verb).tenses[r.tense].forms[r.i];
      const g = gradeForm(inp.value, f); inp.classList.remove('ok', 'almost', 'wrong'); inp.classList.add(g.status);
      const id = `${r.verb}|${r.tense}|${r.i}`;
      if (g.status === 'ok') { ok++; if (data.items[id]) data.items[id] = schedule(data.items[id], 2); }
      else { data.items[id] = schedule(data.items[id], 0); inp.title = formText(f); inp.insertAdjacentHTML('afterend', `<span class="vb-ans">${formHtml(f)}</span>`); }
    });
    srs.save('conj', data);
    out.querySelector('.ex-status').textContent = t('ex.score', { ok, total: rows.length });
    out.querySelector('.vb-check').disabled = true;
  };
  out.querySelector('.vb-check').addEventListener('click', check);
  out.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ex-blank')) { e.preventDefault(); check(); } });
}
function mistakes() {
  const data = srs.load('conj');
  const due = Object.entries(data.items).filter(([id, c]) => (c.n === 0 || c.due <= Date.now()) && specs.find(s => key(s) === id.split('|')[0])).map(([id]) => { const [v, tn, i] = id.split('|'); return { verb: v, tense: tn, i: Number(i) }; });
  if (!due.length) { out.innerHTML = `<p class="muted">${esc(t('verbs.noMistakes'))}</p>`; return; }
  drill(shuffle(due).slice(0, 12));
}
function paint() { if (mode === 'table') table(); else if (mode === 'drill') drill(); else mistakes(); history.replaceState(null, '', `?v=${encodeURIComponent(verb)}&t=${tense}`); }
search.addEventListener('change', () => { const q = search.value.trim().toLowerCase(); const hit = specs.find(s => key(s) === q) || specs.find(s => key(s).startsWith(q)) || specs.find(s => s.n.toLowerCase().includes(q)); if (hit) { verb = key(hit); search.value = verb; paint(); } });
tenseSel.addEventListener('change', () => { tense = tenseSel.value; paint(); });
document.querySelectorAll('.vb-mode .btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; document.querySelectorAll('.vb-mode .btn').forEach(x => x.classList.toggle('active', x === b)); paint(); }));
document.addEventListener('ds:settings', () => { if (mode === 'table') table(); });
paint();
