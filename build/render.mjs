// Renders content blocks into HTML. Content never contains raw HTML.
// Inline markup in strings: **bold**, *italic*, [text](url), [[target-language text|gloss]] (speakable),
// {hero} (protagonist's name), {{masc|fem}} (inline Luca/Lucia variant).
// Structured fields use t = target-language text, n = native-language gloss.
import { italyMap, compassRose, REGIONS } from './map.mjs';
import { resolve, diffWords, isVariant } from '../src/js/variants.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attr = (s) => esc(s).replace(/\n/g, ' ');
const ICON_SPEAK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="w1" d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path class="w2" d="M18.5 7a7 7 0 0 1 0 10"/></svg>';

const plainText = (s) => String(s ?? '').replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1').replace(/\*\*?/g, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

/** Speaker button. text may be a variant. lang defaults to the track's target language. */
export function say(text, ctx, { lang, cls = '' } = {}) {
  const v = resolve(text, ctx.names);
  const l = lang || ctx.targetTag;
  const label = ctx.t('a11y.listenTo', { text: plainText(v.m) });
  const data = v.same ? ` data-say="${attr(plainText(v.m))}"` : ` data-say-m="${attr(plainText(v.m))}" data-say-f="${attr(plainText(v.f))}"${v.who === 'self' ? ' data-who="self"' : ''}`;
  return `<button type="button" class="say ${cls}"${data} data-lang="${l}" aria-label="${attr(label)}" title="${attr(ctx.t('tts.listen'))}">${ICON_SPEAK}</button>`;
}

function inlineBase(s, ctx) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|[^)]+\.html[^)]*)\)/g, '<a href="$2">$1</a>');
}
/** Target-language speakable span with optional gloss. */
export function tl(text, gloss, ctx) {
  const g = gloss ? ` data-gloss="${attr(gloss)}" tabindex="0"` : '';
  return `<span class="tl${gloss ? ' has-gloss' : ''}" lang="${ctx.target}"${g}>${inlineBase(text, ctx)}</span>${say(text, ctx)}`;
}
function inlineOne(s, ctx) {
  const parts = String(s).split(/(\[\[[^\]]+\]\])/);
  return parts.map(p => {
    const m = p.match(/^\[\[([^\]|]+)\|?([^\]]*)\]\]$/);
    if (m) return tl(m[1].trim(), m[2].trim() || undefined, ctx);
    return inlineBase(p, ctx);
  }).join('');
}
/** Inline markup, variant-aware. */
export function inline(s, ctx) {
  if (s == null) return '';
  const v = resolve(s, ctx.names);
  if (v.same) return inlineOne(v.m, ctx);
  return varSpan(v, ctx, { render: (x) => inlineOne(x, ctx) });
}
/** Variant span: both versions in the DOM, CSS shows the chosen one; differing words marked. */
export function varSpan(v, ctx, { lang, render, marks = false } = {}) {
  const r = render || ((x) => esc(x));
  let m = r(v.m), f = r(v.f);
  if (marks) {
    const d = diffWords(v.m, v.f);
    m = d.m.map(x => x.diff ? `<mark class="agr">${esc(x.t)}</mark>` : esc(x.t)).join('');
    f = d.f.map(x => x.diff ? `<mark class="agr">${esc(x.t)}</mark>` : esc(x.t)).join('');
  }
  const l = lang ? ` lang="${lang}"` : '';
  const note = v.note ? `<button type="button" class="why" aria-expanded="false" aria-label="${attr(ctx.t('grammar.agreement'))}">?</button><span class="why-note" hidden>${inlineOne(v.note, ctx)}</span>` : '';
  return `<span class="var${v.who === 'self' ? ' var-self' : ''}"><span class="vm"${l}>${m}</span><span class="vf"${l}>${f}</span>${note}</span>`;
}
/** Target-language text (plain, speakable field) rendered variant-aware with diff marks. */
export function ttext(x, ctx, { lang } = {}) {
  const v = resolve(x, ctx.names);
  const l = lang || ctx.target;
  if (v.same) return `<span lang="${l}">${inlineBase(v.m, ctx)}</span>`;
  return varSpan(v, ctx, { lang: l, marks: true });
}
/** Native-language gloss, variant-aware (his/her etc.). */
export function ntext(x, ctx) {
  const v = resolve(x, ctx.names);
  if (v.same) return inlineOne(v.m, ctx);
  return varSpan(v, ctx, { render: (s) => inlineOne(s, ctx) });
}

export function prose(text, ctx) {
  return String(text ?? '').trim().split(/\n\s*\n/).filter(Boolean).map(p => {
    if (/^- /m.test(p)) return '<ul>' + p.split(/\n/).map(l => `<li>${inline(l.replace(/^- /, ''), ctx)}</li>`).join('') + '</ul>';
    if (/^\d+\. /m.test(p)) return '<ol>' + p.split(/\n/).map(l => `<li>${inline(l.replace(/^\d+\. /, ''), ctx)}</li>`).join('') + '</ol>';
    return `<p>${inline(p.replace(/\n/g, ' '), ctx)}</p>`;
  }).join('\n');
}

const KINDS = { warn: '!', culture: '◆', real: '✦', memo: '✎', note: '·', why: '?', tip: '★', compare: '⇄' };
export function callout(b, ctx) {
  const icon = KINDS[b.kind] || KINDS.note;
  return `<aside class="callout callout-${esc(b.kind || 'note')}"><div class="callout-head"><span class="callout-icon" aria-hidden="true">${icon}</span><span class="callout-label">${inline(b.title || '', ctx)}</span></div><div class="callout-body">${prose(b.text, ctx)}</div></aside>`;
}

export function table(b, ctx) {
  const speak = b.speak === true ? [0] : Array.isArray(b.speak) ? b.speak : [];
  const cell = (c, i, tag) => {
    if (c && typeof c === 'object' && !isVariant(c)) return `<${tag}${c.span ? ` colspan="${c.span}"` : ''} class="${esc(c.cls || '')}">${inline(c.t, ctx)}</${tag}>`;
    const v = resolve(c, ctx.names);
    const sp = speak.includes(i) && v.m.trim() && tag === 'td' && !/^[—–-]$/.test(v.m.trim());
    return `<${tag}>${sp ? `${ttext(c, ctx)}${say(c, ctx)}` : inline(c, ctx)}</${tag}>`;
  };
  const head = b.head ? `<thead><tr>${b.head.map((h, i) => cell(h, i, 'th')).join('')}</tr></thead>` : '';
  const rows = b.rows.map(r => `<tr>${r.map((c, i) => cell(c, i, i === 0 && b.rowhead ? 'th' : 'td')).join('')}</tr>`).join('');
  return `<figure class="tbl-wrap${b.compact ? ' compact' : ''}">${b.caption ? `<figcaption>${inline(b.caption, ctx)}</figcaption>` : ''}<table class="tbl">${head}<tbody>${rows}</tbody></table>${b.note ? `<p class="tbl-note">${inline(b.note, ctx)}</p>` : ''}</figure>`;
}

export function examples(b, ctx) {
  return `<ul class="examples">${b.items.map(e => `<li><span class="ex-t">${ttext(e.t, ctx)}</span>${say(e.t, ctx)}<span class="ex-n">${ntext(e.n, ctx)}</span>${e.note ? `<span class="ex-note">${inline(e.note, ctx)}</span>` : ''}</li>`).join('')}</ul>`;
}

export function grid(b, ctx) {
  return `<div class="grid-list" style="--cols:${b.cols || 7}">${b.items.map(x => {
    const s = x.say || x.small || x.big;
    return `<button type="button" class="grid-item say" data-say="${attr(s)}" data-lang="${ctx.targetTag}" aria-label="${attr(ctx.t('a11y.listenTo', { text: s }))}"><span class="big" lang="${ctx.target}">${esc(x.big)}</span>${x.small ? `<span class="small" lang="${ctx.target}">${esc(x.small)}</span>` : ''}${x.sub ? `<span class="sub">${esc(x.sub)}</span>` : ''}</button>`;
  }).join('')}</div>`;
}

export function columns(b, ctx) {
  return `<div class="cols-list" style="--cols:${b.items.length}">${b.items.map(c => `<div class="col"><h4>${inline(c.title, ctx)}</h4><ul>${c.list.map(x => typeof x === 'string' || isVariant(x) ? `<li>${ttext(x, ctx)}${say(x, ctx)}</li>` : `<li>${ttext(x.t, ctx)}${say(x.t, ctx)}<span class="n">${ntext(x.n, ctx)}</span></li>`).join('')}</ul></div>`).join('')}</div>`;
}

export function pairs(b, ctx) {
  const one = (w) => typeof w === 'string' || isVariant(w) ? `<span class="pair">${ttext(w, ctx)}${say(w, ctx)}</span>` : `<span class="pair">${ttext(w.t, ctx)}${say(w.t, ctx)}<span class="n">${ntext(w.n, ctx)}</span></span>`;
  return `<div class="pairs">${b.caption ? `<p class="pairs-cap">${inline(b.caption, ctx)}</p>` : ''}<ul>${b.items.map(p => `<li>${p.map(one).join('<span class="vs">·</span>')}</li>`).join('')}</ul></div>`;
}

export function proverb(b, ctx) {
  return `<blockquote class="proverb"><p>${ttext(b.t, ctx)}${say(b.t, ctx)}</p><footer><span class="n">${ntext(b.n, ctx)}</span>${b.meaning ? `<span class="meaning">${inline(b.meaning, ctx)}</span>` : ''}</footer></blockquote>`;
}

/** Minimal pairs for pronunciation: {pairs:[{a, b, na, nb}]} */
export function minimal(b, ctx) {
  return `<div class="minimal">${b.caption ? `<p class="pairs-cap">${inline(b.caption, ctx)}</p>` : ''}<ul>${b.pairs.map(p => `<li><span class="mp"><span class="tl" lang="${ctx.target}">${esc(p.a)}</span>${say(p.a, ctx)}${p.na ? `<span class="n">${esc(p.na)}</span>` : ''}</span><span class="vs">/</span><span class="mp"><span class="tl" lang="${ctx.target}">${esc(p.b)}</span>${say(p.b, ctx)}${p.nb ? `<span class="n">${esc(p.nb)}</span>` : ''}</span>${p.tip ? `<span class="mp-tip">${inline(p.tip, ctx)}</span>` : ''}</li>`).join('')}</ul></div>`;
}

/** Sound cards: {items:[{sound, t, n, ipa, tip}]} */
export function sounds(b, ctx) {
  return `<ul class="sounds">${b.items.map(s => `<li class="sound"><span class="sound-key">${esc(s.sound)}</span><span class="sound-word"><span class="tl" lang="${ctx.target}">${esc(s.t)}</span>${say(s.t, ctx)}${s.ipa ? `<span class="ipa">/${esc(s.ipa)}/</span>` : ''}</span>${s.n ? `<span class="n">${esc(s.n)}</span>` : ''}${s.tip ? `<span class="sound-tip">${inline(s.tip, ctx)}</span>` : ''}</li>`).join('')}</ul>`;
}

/** Explicit agreement teaching block: both forms side by side regardless of the toggle. */
export function agreement(b, ctx) {
  return `<div class="agreement">${b.intro ? prose(b.intro, ctx) : ''}<table class="tbl agr-tbl"><thead><tr><th>${esc(ctx.names.m)}</th><th>${esc(ctx.names.f)}</th><th></th></tr></thead><tbody>${b.items.map(it => { const v = resolve(it.t, ctx.names); const d = diffWords(v.m, v.f); const mk = (arr) => arr.map(x => x.diff ? `<mark class="agr">${esc(x.t)}</mark>` : esc(x.t)).join(''); return `<tr><td><span lang="${ctx.target}">${mk(d.m)}</span>${say(v.m, ctx)}</td><td><span lang="${ctx.target}">${mk(d.f)}</span>${say(v.f, ctx)}</td><td class="n">${ntext(it.n || '', ctx)}</td></tr>`; }).join('')}</tbody></table>${b.note ? `<p class="agr-note">${inline(b.note, ctx)}</p>` : ''}</div>`;
}

/** Typical mistakes: {items:[{wrong, right, why}]} */
export function mistakes(b, ctx) {
  return `<div class="mistakes"><h4>${inline(b.title || ctx.t('grammar.mistakes'), ctx)}</h4><ul>${b.items.map(m => `<li><span class="mk-wrong"><span class="mk-lbl">✗</span> <s lang="${ctx.target}">${esc(m.wrong)}</s></span><span class="mk-right"><span class="mk-lbl">✓</span> ${ttext(m.right, ctx)}${say(m.right, ctx)}</span>${m.why ? `<span class="mk-why">${inline(m.why, ctx)}</span>` : ''}</li>`).join('')}</ul></div>`;
}

export function dialogue(b, ctx, scene = false) {
  const id = b.id || ctx.uid('dlg');
  let hasVar = false;
  const lines = b.lines.map((l, i) => {
    if (l.stage) return `<li class="stage">${inline(l.stage, ctx)}</li>`;
    const who = l.who === 'hero' ? resolve('{hero}', ctx.names) : resolve(l.who, ctx.names);
    const vt = resolve(l.t, ctx.names);
    if (!vt.same || !who.same) hasVar = true;
    const sayData = vt.same ? ` data-say="${attr(plainText(vt.m))}"` : ` data-say-m="${attr(plainText(vt.m))}" data-say-f="${attr(plainText(vt.f))}"`;
    return `<li class="line${l.who === 'hero' ? ' hero-line' : ''}" data-i="${i}"${sayData} data-lang="${ctx.targetTag}"><span class="who">${who.same ? esc(who.m) : varSpan(who, ctx)}</span><div class="line-txt"><p class="t">${ttext(l.t, ctx)}</p><p class="n">${ntext(l.n, ctx)}</p>${l.note ? `<p class="line-note">${inline(l.note, ctx)}</p>` : ''}</div>${say(l.t, ctx)}</li>`;
  }).join('');
  const notes = b.notes?.length ? `<div class="dlg-notes"><h4>${esc(ctx.t('story.keyPhrases'))}</h4><dl>${b.notes.map(n => `<div><dt>${ttext(n.phrase, ctx)}${say(n.phrase, ctx)}</dt><dd>${inline(n.note, ctx)}</dd></div>`).join('')}</dl></div>` : '';
  const qs = scene && b.questions?.length ? `<div class="scene-q"><h4>${esc(ctx.t('story.questions'))}</h4>${b.questions.map(q => exercise(q, ctx)).join('')}</div>` : '';
  const both = hasVar ? `<button type="button" class="btn btn-ghost both-toggle" aria-pressed="false" data-on="${attr(ctx.t('variants.hide', { hero: '{hero}' }))}" data-off="${attr(ctx.t('variants.show'))}">${esc(ctx.t('variants.show'))}</button>` : '';
  return `<article class="dialogue${scene ? ' scene' : ''}" id="${esc(id)}">
<header class="dlg-head"><div><h3>${inline(b.title, ctx)}</h3>${b.setting ? `<p class="setting">${inline(b.setting, ctx)}</p>` : ''}</div><div class="dlg-tools">${b.register ? `<span class="badge">${esc(b.register)}</span>` : ''}<button type="button" class="btn btn-ghost dlg-play" data-target="${esc(id)}" data-stop="${attr(ctx.t('story.stop'))}" data-play="▶ ${attr(ctx.t('story.listenAll'))}">▶ ${esc(ctx.t('story.listenAll'))}</button><button type="button" class="btn btn-ghost dlg-toggle" data-target="${esc(id)}" aria-pressed="false" data-on="${attr(ctx.t('story.hideTranslation'))}" data-off="${attr(ctx.t('story.showTranslation'))}">${esc(ctx.t('story.showTranslation'))}</button>${both}</div></header>
<ol class="lines">${lines}</ol>${notes}${qs}</article>`;
}

export function vocab(b, ctx) {
  const items = b.items.map(v => {
    ctx.vocab.push({ ...v, theme: b.theme, unit: ctx.unit.id, unitNum: ctx.unit.num });
    const head = v.article ? `${v.article.endsWith("'") ? v.article : v.article + ' '}${v.t}` : v.t;
    const gender = v.gender ? `<span class="gender g-${esc(v.gender)}">${v.gender === 'm' ? ctx.t('vocab.m') : v.gender === 'f' ? ctx.t('vocab.f') : esc(v.gender)}</span>` : '';
    const tags = (v.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('');
    return `<li class="vcard" data-t="${attr(v.t)}">
<div class="vcard-top"><span class="v-t" lang="${ctx.target}">${esc(head)}</span>${say(head, ctx)}${v.ipa ? `<span class="ipa">/${esc(v.ipa)}/</span>` : ''}${gender}${v.pos ? `<span class="pos">${esc(v.pos)}</span>` : ''}${tags}</div>
<div class="v-n">${ntext(v.n, ctx)}</div>
${v.plural ? `<div class="v-pl"><span class="lbl">${esc(ctx.t('vocab.plural'))}</span> <span lang="${ctx.target}">${esc(v.plural)}</span>${say(v.plural, ctx)}</div>` : ''}
${v.forms ? `<div class="v-pl"><span class="lbl">${esc(ctx.t('grammar.forms'))}</span> <span lang="${ctx.target}">${esc(v.forms)}</span></div>` : ''}
${v.ex ? `<div class="v-ex">${ttext(v.ex.t, ctx)}${say(v.ex.t, ctx)}<span class="v-ex-n">${ntext(v.ex.n, ctx)}</span></div>` : ''}
${v.note ? `<div class="v-note">${inline(v.note, ctx)}</div>` : ''}</li>`;
  }).join('');
  return `<div class="vocab-group"><h3 class="vocab-theme">${inline(b.theme, ctx)}${b.n ? ` <span class="theme-n">${esc(b.n)}</span>` : ''}</h3>${b.intro ? prose(b.intro, ctx) : ''}<ul class="vocab">${items}</ul></div>`;
}

export function grammar(b, ctx) {
  const id = b.id || ctx.uid('g');
  ctx.grammar.push({ id, title: b.title, category: b.category || '', rule: b.rule || '', ref: b.ref || '', unit: ctx.unit.id, unitNum: ctx.unit.num, unitTitle: ctx.unit.titleText, section: ctx.sectionId });
  const ref = b.ref ? `<a class="g-ref" href="${esc(ctx.base)}grammar/${esc(b.ref)}.html">${esc(ctx.t('grammar.ref'))} →</a>` : '';
  return `<article class="grammar" id="${esc(id)}"><header class="g-head"><span class="kicker">${esc(b.category || ctx.t('grammar.structure'))}</span><h3>${inline(b.title, ctx)}</h3>${b.rule ? `<p class="rule"><span class="rule-lbl">${esc(ctx.t('grammar.rule'))}</span> ${inline(b.rule, ctx)}</p>` : ''}</header>${blocks(b.blocks, ctx)}${ref}</article>`;
}

/** Conjugation table generated from the conjugator data: {verb | verbs:[...], tense, caption} */
export function conjugation(b, ctx) {
  const verbs = b.verbs || [b.verb];
  const tables = verbs.map(v => ctx.conj.get(v)).filter(Boolean);
  if (tables.length !== verbs.length) throw new Error(`conjugation block: unknown verb in ${JSON.stringify(verbs)} (unit ${ctx.unit.id})`);
  const tense = tables[0].tenses[b.tense];
  if (!tense) throw new Error(`conjugation block: unknown tense "${b.tense}" for ${verbs[0]}`);
  const persons = tense.persons;
  const head = `<thead><tr><th></th>${tables.map(tb => `<th lang="${ctx.target}">${esc(tb.inf)}</th>`).join('')}</tr></thead>`;
  const rows = persons.map((p, i) => `<tr><th>${esc(p)}</th>${tables.map(tb => { const f = tb.tenses[b.tense].forms[i]; return `<td>${ttext(f, ctx)}${say(f, ctx)}</td>`; }).join('')}</tr>`).join('');
  return `<figure class="tbl-wrap conj"><figcaption>${b.caption ? inline(b.caption, ctx) : `<span lang="${ctx.target}">${esc(verbs.join(', '))}</span> · ${esc(tense.label)}`}</figcaption><table class="tbl">${head}<tbody>${rows}</tbody></table>${b.note ? `<p class="tbl-note">${inline(b.note, ctx)}</p>` : ''}</figure>`;
}

export function exercise(item, ctx) {
  const id = item.id || ctx.uid('ex');
  ctx.exercises += 1;
  const data = JSON.stringify({ ...item, id }).replace(/</g, '\\u003c');
  const kindLabel = ctx.t('ex.kinds')[item.kind] || item.kind;
  return `<div class="ex" id="${esc(id)}" data-kind="${esc(item.kind)}"><div class="ex-top"><span class="ex-kind">${esc(kindLabel)}</span><span class="ex-status" aria-live="polite"></span></div><div class="ex-body"></div><script type="application/json" class="ex-data">${data}</script></div>`;
}
export function exercises(b, ctx) {
  return `<div class="ex-set${b.review ? ' ex-review' : ''}">${b.title ? `<h3 class="ex-set-title">${inline(b.title, ctx)}</h3>` : b.review ? `<h3 class="ex-set-title">${esc(ctx.t('ex.review'))}</h3>` : ''}${b.intro ? prose(b.intro, ctx) : ''}<div class="ex-list">${b.items.map(x => exercise(x, ctx)).join('')}</div><div class="ex-set-foot"></div></div>`;
}

export function cheatsheet(b, ctx) {
  return `<div class="cheat">${b.groups.map(g => `<section class="cheat-group"><h4>${inline(g.title, ctx)}</h4><ul>${g.rows.map(r => Array.isArray(r) ? `<li><span class="c-t">${ttext(r[0], ctx)}</span>${say(r[0], ctx)}<span class="c-n">${ntext(r[1], ctx)}</span></li>` : `<li class="c-text">${inline(r, ctx)}</li>`).join('')}</ul></section>`).join('')}</div>`;
}

export function flashcards(b, ctx) {
  const deck = (b.items || ctx.vocab.filter(v => v.unit === ctx.unit.id)).map(v => ({ id: `${ctx.unit.id}:${v.t}`, front: v.article ? `${v.article.endsWith("'") ? v.article : v.article + ' '}${v.t}` : v.t, back: v.n, hint: v.ex?.t || '', unit: ctx.unit.id }));
  const data = JSON.stringify(deck).replace(/</g, '\\u003c');
  return `<div class="flashcards" data-deck="unit-${esc(ctx.unit.id)}"><script type="application/json" class="fc-data">${data}</script><div class="fc-ui"></div></div>`;
}

export function phrases(b, ctx) {
  return `<section class="phrases" data-text="${attr(b.items.map(p => resolve(p.t, ctx.names).m + ' ' + resolve(p.n, ctx.names).m).join(' ').toLowerCase())}"><h3>${inline(b.title, ctx)}</h3>${b.intro ? prose(b.intro, ctx) : ''}<ul>${b.items.map(p => `<li data-text="${attr((resolve(p.t, ctx.names).m + ' ' + resolve(p.n, ctx.names).m).toLowerCase())}"><span class="ph-t">${ttext(p.t, ctx)}</span>${say(p.t, ctx)}<span class="ph-n">${ntext(p.n, ctx)}</span>${p.note ? `<span class="ph-note">${inline(p.note, ctx)}</span>` : ''}</li>`).join('')}</ul></section>`;
}

export function map(b, ctx) {
  const regions = b.list ? `<ul class="region-list">${REGIONS.map(r => { const full = r.article.endsWith("'") ? r.article + r.name : r.article + ' ' + r.name; return `<li class="${(b.highlight || []).includes(r.key) ? 'on' : ''}" data-region="${r.key}"><span lang="it">${esc(full)}</span>${say(full, ctx, { lang: 'it-IT' })}<span class="cap">${esc(r.cap)}</span></li>`; }).join('')}</ul>` : '';
  return `<figure class="map-fig${b.list ? ' with-list' : ''}">${italyMap(b)}${regions}${b.caption ? `<figcaption>${inline(b.caption, ctx)}</figcaption>` : ''}</figure>`;
}

export function blocks(list, ctx) {
  return (list || []).map(b => block(b, ctx)).join('\n');
}
export function block(b, ctx) {
  switch (b.type) {
    case 'prose': return prose(b.text, ctx);
    case 'callout': return callout(b, ctx);
    case 'table': return table(b, ctx);
    case 'examples': return examples(b, ctx);
    case 'grid': return grid(b, ctx);
    case 'columns': return columns(b, ctx);
    case 'pairs': return pairs(b, ctx);
    case 'proverb': return proverb(b, ctx);
    case 'minimal': return minimal(b, ctx);
    case 'sounds': return sounds(b, ctx);
    case 'agreement': return agreement(b, ctx);
    case 'mistakes': return mistakes(b, ctx);
    case 'dialogue': return dialogue(b, ctx);
    case 'scene': return dialogue(b, ctx, true);
    case 'vocab': return vocab(b, ctx);
    case 'grammar': return grammar(b, ctx);
    case 'conjugation': return conjugation(b, ctx);
    case 'exercise': return exercise(b, ctx);
    case 'exercises': return exercises(b, ctx);
    case 'cheatsheet': return cheatsheet(b, ctx);
    case 'flashcards': return flashcards(b, ctx);
    case 'phrases': return phrases(b, ctx);
    case 'map': return map(b, ctx);
    case 'compass': return `<figure class="compass-fig">${compassRose()}${b.caption ? `<figcaption>${inline(b.caption, ctx)}</figcaption>` : ''}</figure>`;
    case 'figure': return `<figure class="img-fig"><img src="${esc(ctx.base)}../assets/img/${esc(b.src)}" alt="${attr(b.alt || '')}" loading="lazy">${b.caption ? `<figcaption>${inline(b.caption, ctx)}</figcaption>` : ''}</figure>`;
    case 'subhead': return `<h4 class="subhead">${inline(b.text, ctx)}</h4>`;
    case 'two-col': return `<div class="two-col">${b.cols.map(c => `<div>${blocks(c, ctx)}</div>`).join('')}</div>`;
    default: throw new Error(`Unknown block type "${b.type}" in unit ${ctx.unit?.id}`);
  }
}
