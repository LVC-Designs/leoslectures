import { t, esc, targetTag } from './store.js';
const data = JSON.parse(document.getElementById('glossary-data').textContent);
const q = document.querySelector('.gl-search'), unitSel = document.querySelector('.gl-unit'), posSel = document.querySelector('.gl-pos'), genSel = document.querySelector('.gl-gender'), list = document.querySelector('.gl-list'), count = document.querySelector('.gl-count');
const lang = document.documentElement.dataset.target;
[...new Set(data.map(v => v.pos).filter(Boolean))].sort().forEach(p => posSel.insertAdjacentHTML('beforeend', `<option>${esc(p)}</option>`));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function paint() {
  const needle = norm(q.value.trim());
  const rows = data.filter(v => (!unitSel.value || v.unit === unitSel.value) && (!posSel.value || v.pos === posSel.value) && (!genSel?.value || v.gender === genSel.value) && (!needle || norm(v.t + ' ' + v.n + ' ' + (v.plural || '')).includes(needle)));
  rows.sort((a, b) => a.t.localeCompare(b.t, lang));
  count.textContent = t('glossary.count', { n: rows.length });
  list.innerHTML = rows.map(v => { const head = v.article ? `${v.article.endsWith("'") ? v.article : v.article + ' '}${v.t}` : v.t; return `<li class="gl-item"><div class="gl-top"><span class="gl-t" lang="${lang}">${esc(head)}</span><button type="button" class="say" data-say="${esc(head)}" data-lang="${targetTag()}" aria-label="${esc(t('tts.listen'))}">▶</button>${v.gender ? `<span class="gender g-${v.gender}">${v.gender}.</span>` : ''}${v.pos ? `<span class="pos">${esc(v.pos)}</span>` : ''}${v.ipa ? `<span class="ipa">/${esc(v.ipa)}/</span>` : ''}<span class="gl-unit-tag">${esc(t('unit.unit'))} ${v.unitNum}</span></div><div class="gl-n">${esc(v.n)}${v.plural ? ` · <span class="lbl">${esc(t('vocab.plural'))}</span> <span lang="${lang}">${esc(v.plural)}</span>` : ''}</div>${v.ex ? `<div class="gl-ex"><span lang="${lang}">${esc(v.ex.t)}</span> — ${esc(v.ex.n)}</div>` : ''}</li>`; }).join('');
}
[q, unitSel, posSel, genSel].forEach(el => el?.addEventListener('input', paint));
paint();
