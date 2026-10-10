// Build: site.json + locales/ + content/<track>/ + src/ → dist/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, inline, prose, blocks, say, ttext, ntext } from './render.mjs';
import { makeT } from './i18n.mjs';
import { resolve } from '../src/js/variants.js';
import * as conjIt from '../src/js/conj-it.js';
import * as conjEn from '../src/js/conj-en.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => path.join(root, ...p);
const read = (p) => fs.readFileSync(p, 'utf8');
const readJSON = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(p);
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const jsonTag = (id, obj) => `<script type="application/json" id="${id}">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const ACCENTS = { terracotta: '#b5533c', olive: '#5a6b3b', adriatic: '#2f6f93', amber: '#c08a2e', maple: '#b43a2f', lake: '#2b6c7f', plum: '#6b4a6e', ink: '#2a2d34', pine: '#3f6b4f' };
const hexRgb = (h) => h.slice(1).match(/../g).map(x => parseInt(x, 16)).join(',');
const ring = (cls = '') => `<span class="ring-wrap ${cls}"><svg viewBox="0 0 36 36" class="ring" aria-hidden="true"><circle cx="18" cy="18" r="15.9"/><circle cx="18" cy="18" r="15.9" class="ring-val" stroke-dasharray="0 100"/></svg><span class="pct">0%</span></span>`;

const site = readJSON(P('site.json'));

/* ---------- page shell ---------- */
function shell(ctx, { title, description, body, bodyClass = '', accent, scripts = [], alternates = '', canonical = '' }) {
  const { t, rootPath } = ctx;
  const ui = t.lang;
  const trackAttrs = ctx.track ? ` data-track="${ctx.track}" data-target="${ctx.target}" data-target-tag="${ctx.targetTag}" data-slug="${ctx.slug}" data-base="${ctx.base}"` : '';
  const voices = ctx.track ? JSON.stringify(ctx.cfg.voiceFallback) : '[]';
  return `<!doctype html>
<html lang="${ui}" data-theme="auto" data-hero="m" data-self="m" data-both="0"${trackAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website">
${canonical}${alternates}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,50;1,9..144,300..700,50&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rootPath}assets/site.css">
<link rel="icon" href="${rootPath}assets/favicon.svg" type="image/svg+xml">
<script>(function(){try{var s=JSON.parse(localStorage.getItem('ds:settings')||'{}');var d=document.documentElement;if(s.theme)d.setAttribute('data-theme',s.theme);if(s.hero)d.setAttribute('data-hero',s.hero);if(s.self)d.setAttribute('data-self',s.self);if(s.both)d.setAttribute('data-both','1');}catch(e){}})();</script>
<meta name="ds-voices" content='${voices}'>
</head>
<body class="${bodyClass}"${accent ? ` style="--accent:${accent};--accent-rgb:${hexRgb(accent)}"` : ''}>
<a class="skip" href="#main">${esc(t('nav.skip'))}</a>
${ctx.track ? header(ctx) : landingHeader(ctx)}
${body}
${footer(ctx)}
${jsonTag('ui-data', { ...t.all, names: site.hero })}
<script type="module" src="${rootPath}assets/app.js"></script>
${scripts.map(s => `<script type="module" src="${rootPath}assets/${s}"></script>`).join('\n')}
</body></html>`;
}
function header(ctx) {
  const { t, base } = ctx;
  const nav = [['index.html', 'nav.units'], ['grammar.html', 'nav.grammar'], ['verbs.html', 'nav.verbs'], ['glossary.html', 'nav.glossary'], ['phrasebook.html', 'nav.phrasebook'], ['placement.html', 'nav.placement'], ['flashcards.html', 'nav.flashcards']];
  return `<header class="site-head"><div class="wrap">
<a class="brand" href="${base}index.html"><span class="brand-mark" aria-hidden="true">DS</span><span class="brand-name">${esc(site.name)}<span class="brand-sub">${esc(t('track.short'))}</span></span></a>
<nav class="site-nav" aria-label="${esc(t('nav.site'))}">${nav.map(([h, k]) => `<a href="${base}${h}">${esc(t(k))}</a>`).join('')}<a class="nav-switch" href="${ctx.rootPath}${ctx.otherSlug}/index.html" lang="${ctx.otherUi}" title="${esc(t('track.switchHint'))}">${esc(t('track.switch'))}</a></nav>
<div class="head-tools">
<div class="hero-switch" role="group" aria-label="${esc(t('settings.hero'))}"><button type="button" data-hero="m" class="hero-btn">${esc(site.hero.m)}</button><button type="button" data-hero="f" class="hero-btn">${esc(site.hero.f)}</button></div>
<div class="tts-ctl" title="${esc(t('tts.rate'))}"><label><span class="sr-only">${esc(t('tts.rate'))}</span><input type="range" min="0.6" max="1.2" step="0.1" value="0.9" class="tts-rate" aria-label="${esc(t('tts.rate'))}"></label><span class="tts-rate-val">0.9×</span></div>
<button type="button" class="theme-btn" aria-label="${esc(t('theme.toggle'))}" title="${esc(t('theme.toggle'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
<a class="settings-link" href="${base}settings.html" aria-label="${esc(t('nav.settings'))}" title="${esc(t('nav.settings'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></a>
<button type="button" class="nav-btn" aria-label="${esc(t('nav.menu'))}" aria-expanded="false"><span></span></button>
</div></div></header>
<div class="tts-notice" hidden role="status"></div>`;
}
function landingHeader(ctx) {
  const { t } = ctx;
  return `<header class="site-head landing-head"><div class="wrap"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">DS</span><span class="brand-name">${esc(site.name)} <span class="brand-alt">· ${esc(site.nameAlt)}</span></span></a><div class="head-tools"><button type="button" class="theme-btn" aria-label="${esc(t('theme.toggle'))}" title="${esc(t('theme.toggle'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></div></div></header>`;
}
function footer(ctx) {
  const { t, rootPath } = ctx;
  return `<footer class="site-foot"><div class="wrap"><p>${esc(t('footer.about'))}</p><p><a href="${rootPath}index.html">${esc(site.name)} · ${esc(site.nameAlt)}</a> · <a href="${rootPath}provenance.html">${esc(t('footer.provenance'))}</a>${ctx.track ? ` · <a href="${rootPath}${ctx.otherSlug}/index.html" lang="${ctx.otherUi}">${esc(t('track.switch'))}</a>` : ''}</p></div></footer>`;
}
function alternatesFor(pathA, pathB) {
  if (!site.url) return '';
  const u = site.url.replace(/\/$/, '');
  return `<link rel="alternate" hreflang="en" href="${u}/${pathA}"><link rel="alternate" hreflang="it" href="${u}/${pathB}"><link rel="alternate" hreflang="x-default" href="${u}/">`;
}
function canonicalFor(p) { return site.url ? `<link rel="canonical" href="${site.url.replace(/\/$/, '')}/${p}">` : ''; }

/* ---------- track context ---------- */
function trackCtx(track) {
  const cfg = site.tracks[track];
  const other = Object.keys(site.tracks).find(k => k !== track);
  const t = makeT(cfg.ui);
  return {
    track, cfg, slug: cfg.slug, ui: cfg.ui, target: cfg.target, targetTag: cfg.targetTag, nativeTag: cfg.nativeTag, t, names: site.hero,
    otherSlug: site.tracks[other].slug, otherUi: site.tracks[other].ui,
    base: '', rootPath: '../', vocab: [], grammar: [], exercises: 0, sectionId: '', counters: {}, unit: null, conj: null,
    uid(prefix) { this.counters[prefix] = (this.counters[prefix] || 0) + 1; return `${prefix}-${this.unit?.id || 'p'}-${this.sectionId || 'x'}-${this.counters[prefix]}`; },
  };
}
const sub = (ctx, extra) => ({ ...ctx, counters: {}, exercises: 0, vocab: [], grammar: [], ...extra });

/* ---------- pages ---------- */
function unitPage(ctx0, U, course, idx, built) {
  const ctx = sub(ctx0, { base: '../', rootPath: '../../', unit: null, sectionId: '' });
  const meta = course.units[idx];
  const titleV = resolve(U.title ?? meta.title, ctx.names);
  const unit = { ...meta, ...U, titleText: titleV.m };
  ctx.unit = unit;
  const { t } = ctx;
  const secs = (U.sections || []).map(s => { ctx.sectionId = s.id; ctx.counters = {}; return { ...s, label: t('sections')[s.kind] || s.label || s.kind, html: blocks(s.blocks, ctx) }; });
  const toc = secs.map(s => `<li><a href="#sec-${esc(s.id)}" data-sec="${esc(s.id)}"><span class="toc-dot"></span>${esc(s.label)}</a></li>`).join('');
  const sections = secs.map((s, i) => `<section class="sec sec-${esc(s.kind)}" id="sec-${esc(s.id)}" data-sec="${esc(s.id)}"><header class="sec-head"><span class="kicker"><span class="sec-n">${String(i + 1).padStart(2, '0')}</span> ${esc(s.label)}</span><h2>${inline(s.title, ctx)}</h2>${s.intro ? `<div class="sec-intro">${prose(s.intro, ctx)}</div>` : ''}</header>${s.html}</section>`).join('\n');
  const prev = course.units[idx - 1], next = course.units[idx + 1];
  const link = (u, cls, kick) => `<a class="${cls}" href="unit-${u.id}.html"><span class="kicker">${kick}</span><span>${ttext(u.title, ctx)}</span></a>`;
  const nav = `<nav class="lesson-nav" aria-label="${esc(t('unit.sections'))}">${prev && built.has(prev.id) ? link(prev, 'prev', `← ${esc(t('unit.unit'))} ${prev.num}`) : '<span></span>'}${next && built.has(next.id) ? link(next, 'next', `${esc(t('unit.unit'))} ${next.num} →`) : `<span class="next muted"><span class="kicker">${esc(t('unit.next'))}</span><span>${next ? ttext(next.title, ctx) : esc(t('unit.end'))} · ${esc(t('unit.soon'))}</span></span>`}</nav>`;
  const cross = unit.crossover ? `<p class="crossover">⇄ ${esc(t('unit.crossover'))}</p>` : '';
  const canDo = unit.canDo?.length ? `<details class="cando"><summary>${esc(t('unit.canDo'))}</summary><ul>${unit.canDo.map(c => `<li>${inline(c, ctx)}</li>`).join('')}</ul></details>` : '';
  const body = `<main id="main" class="lesson" data-unit="${esc(unit.id)}" data-sections="${secs.length}" data-exercises="${ctx.exercises}">
<div class="lesson-hero"><div class="wrap hero-grid">
<div class="hero-num"><span class="numeral" aria-hidden="true">${esc(unit.num)}</span></div>
<div class="hero-txt"><p class="kicker">${esc(t('unit.unit'))} ${unit.num} · ${esc(t('level')[unit.level])}${unit.checkpoint ? ` · ${esc(t('checkpoint'))}` : ''}</p><h1>${ttext(unit.title, ctx)}${say(unit.title, ctx)}</h1><p class="hero-n">${ntext(unit.subtitle, ctx)}</p>${unit.intro ? `<div class="hero-intro">${prose(unit.intro, ctx)}</div>` : ''}
<div class="objectives"><h2 class="kicker">${esc(t('unit.goal'))}</h2><ul>${(unit.objectives || []).map(o => `<li>${inline(o, ctx)}</li>`).join('')}</ul></div>${canDo}${cross}</div>
</div></div>
<div class="wrap lesson-grid">
<aside class="toc" aria-label="${esc(t('unit.sections'))}"><div class="toc-inner"><div class="toc-progress">${ring('toc-ring')}<span class="toc-lbl">${esc(t('unit.progress'))}</span></div><ol class="toc-list">${toc}</ol><a class="toc-top" href="#main">↑ ${esc(t('unit.top'))}</a></div></aside>
<div class="lesson-body">${sections}${nav}</div>
</div></main>`;
  const html = shell(ctx, { title: `${t('unit.unit')} ${unit.num} · ${titleV.m} — ${site.name}`, description: resolve(unit.goal || unit.subtitle || '', ctx.names).m, body, bodyClass: 'page-lesson', accent: ACCENTS[unit.accent] || ACCENTS.terracotta, scripts: ['exercises.js', 'flashcards.js'], canonical: canonicalFor(`${ctx.slug}/units/unit-${unit.id}.html`) });
  return { html, vocab: ctx.vocab, grammar: ctx.grammar, exercises: ctx.exercises, sections: secs.length };
}

function trackHome(ctx, course, built, stats) {
  const { t, base } = ctx;
  const levels = course.levels.map(L => {
    const cards = L.units.map(id => {
      const U = course.units.find(u => u.id === id);
      const ok = built.has(U.id), st = stats[U.id];
      const inner = `<div class="card-num"><span class="numeral" aria-hidden="true">${U.num}</span></div><div class="card-txt"><span class="kicker">${esc(t('unit.unit'))} ${U.num}${U.checkpoint ? ` · ${esc(t('checkpoint'))}` : ''}</span><h3>${ttext(U.title, ctx)}</h3><p class="card-n">${ntext(U.subtitle, ctx)}</p><ul class="card-topics">${(U.topics || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${ok ? `<div class="card-foot"><span class="card-meta">${st.exercises} ${esc(t('unit.exercises'))} · ${st.vocab} ${esc(t('unit.words'))}</span>${ring('card-prog')}</div>` : `<div class="card-foot"><span class="card-meta">${esc(t('home.upcoming'))}</span></div>`}</div>`;
      return ok ? `<a class="card lesson-card" href="${base}units/unit-${U.id}.html" data-unit="${U.id}" style="--accent:${ACCENTS[U.accent] || ACCENTS.terracotta}">${inner}</a>` : `<div class="card lesson-card upcoming" data-unit="${U.id}" style="--accent:${ACCENTS[U.accent] || ACCENTS.terracotta}">${inner}</div>`;
    }).join('');
    return `<section class="level" id="level-${esc(L.id)}"><div class="sec-head"><span class="kicker">${esc(t('unit.level'))} ${esc(L.id)}</span><h2>${esc(t('level')[L.id])}</h2>${L.intro ? `<p class="lede">${inline(L.intro, ctx)}</p>` : ''}</div><div class="card-grid">${cards}</div></section>`;
  }).join('');
  const tools = [['grammar.html', 'nav.grammar', 'home.refGrammar'], ['verbs.html', 'nav.verbs', 'home.refVerbs'], ['glossary.html', 'nav.glossary', 'home.refGlossary'], ['phrasebook.html', 'phrasebook.title', 'home.refPhrasebook'], ['placement.html', 'nav.placement', 'home.refPlacement'], ['flashcards.html', 'nav.flashcards', 'home.refFlashcards']];
  const body = `<main id="main" class="home">
<section class="home-hero"><div class="wrap">
<p class="kicker">${esc(t('track.name'))} · ${esc(t('track.levels'))}</p>
<h1>${esc(t('track.hero'))}</h1>
<p class="lede">${inline(course.lede, ctx)}</p>
<div class="continue-card" hidden><span class="kicker">${esc(t('home.continue'))}</span><a class="continue-link" href="#"><span class="continue-title"></span><span class="continue-sub"></span></a></div>
<ul class="hero-facts">${t('home.facts').map(f => `<li>${esc(f)}</li>`).join('')}</ul>
</div></section>
<section class="wrap how"><div class="how-grid"><div><span class="kicker">${esc(t('home.howTitle'))}</span></div><ol class="how-steps">${t('home.how').map(s => `<li>${esc(s)}</li>`).join('')}</ol></div></section>
<div class="wrap" id="units">${levels}</div>
<section class="wrap tools"><div class="sec-head"><span class="kicker">${esc(t('home.tools'))}</span></div><div class="card-grid">${tools.map(([h, k, d]) => `<a class="card ref-card" href="${base}${h}"><h3>${esc(t(k))}</h3><p>${esc(t(d))}</p></a>`).join('')}</div></section>
${heroDialog(ctx)}
</main>`;
  return shell(ctx, { title: `${t('track.name')} — ${site.name}`, description: resolve(course.lede, ctx.names).m, body, bodyClass: 'page-home', accent: ACCENTS[course.accent] || ACCENTS.terracotta, alternates: alternatesFor('learn-italian/', 'impara-inglese/'), canonical: canonicalFor(`${ctx.slug}/`) });
}
function heroDialog(ctx) {
  const { t } = ctx;
  return `<dialog class="hero-dialog" id="hero-dialog"><form method="dialog"><h2>${esc(t('home.chooseHero'))}</h2><p>${esc(t('home.heroIntro'))}</p>
<div class="hero-choice"><label><input type="radio" name="hero" value="m" checked><span class="hc-name">${esc(site.hero.m)}</span><span class="hc-desc">${esc(t('home.heroMDesc'))}</span></label><label><input type="radio" name="hero" value="f"><span class="hc-name">${esc(site.hero.f)}</span><span class="hc-desc">${esc(t('home.heroFDesc'))}</span></label></div>
<fieldset class="self-choice"><legend>${esc(t('home.selfQ'))}</legend><label><input type="radio" name="self" value="m" checked>${esc(t('home.selfM'))}</label><label><input type="radio" name="self" value="f">${esc(t('home.selfF'))}</label><label><input type="radio" name="self" value="both">${esc(t('home.selfBoth'))}</label></fieldset>
<button type="submit" class="btn btn-primary">${esc(t('home.go'))}</button></form></dialog>`;
}

function grammarIndex(ctx, topics, unitPoints, course) {
  const { t, base } = ctx;
  const byCat = new Map();
  const add = (cat, item) => { if (!byCat.has(cat)) byCat.set(cat, []); byCat.get(cat).push(item); };
  topics.forEach(tp => add(tp.category || t('grammar.structure'), { ...tp, href: `${base}grammar/${tp.id}.html` }));
  unitPoints.filter(g => !g.ref || !topics.find(tp => tp.id === g.ref)).forEach(g => add(g.category || t('grammar.structure'), { id: g.id, title: g.title, rule: g.rule, units: [g.unit], href: `${base}units/unit-${g.unit}.html#${g.id}` }));
  const list = [...byCat.entries()].map(([cat, items]) => `<section class="gr-cat"><h2>${esc(cat)}</h2><ul class="gr-list">${items.map(g => `<li data-text="${esc((resolve(g.title, ctx.names).m + ' ' + cat + ' ' + resolve(g.rule || '', ctx.names).m).toLowerCase())}"><a href="${g.href}"><span class="gr-title">${inline(g.title, ctx)}</span>${g.rule ? `<span class="gr-rule">${inline(g.rule, ctx)}</span>` : ''}${g.units?.length ? `<span class="gr-units">${esc(t('grammar.seeUnit'))} ${g.units.map(u => `<a href="${base}units/unit-${u}.html">${Number(u)}</a>`).join(', ')}</span>` : ''}</a></li>`).join('')}</ul></section>`).join('');
  const body = `<main id="main" class="wrap page-ref"><header class="ref-head"><span class="kicker">${esc(t('nav.grammar'))}</span><h1>${esc(t('nav.grammar'))}</h1><p class="lede">${esc(t('grammar.index'))}</p></header>
<label class="field"><span class="sr-only">${esc(t('glossary.search'))}</span><input type="search" class="gr-search" placeholder="${esc(t('glossary.search'))}"></label>${list || `<p class="muted">${esc(t('home.upcoming'))}</p>`}</main>`;
  return shell(ctx, { title: `${t('nav.grammar')} — ${t('track.name')} — ${site.name}`, description: t('grammar.index'), body, bodyClass: 'page-grammar', accent: ACCENTS.adriatic, scripts: ['grammar.js'], canonical: canonicalFor(`${ctx.slug}/grammar.html`) });
}
function grammarTopicPage(ctx0, tp, course) {
  const ctx = sub(ctx0, { base: '../', rootPath: '../../', unit: { id: `g-${tp.id}`, num: 0, titleText: '' }, sectionId: 'ref' });
  const { t } = ctx;
  const units = (tp.units || []).map(u => { const U = course.units.find(x => x.id === u); return U ? `<a href="../units/unit-${u}.html">${esc(t('unit.unit'))} ${U.num} · ${ttext(U.title, ctx)}</a>` : ''; }).join(' · ');
  const body = `<main id="main" class="wrap page-ref page-topic"><header class="ref-head"><span class="kicker"><a href="../grammar.html">${esc(t('nav.grammar'))}</a> · ${esc(tp.category || '')}</span><h1>${inline(tp.title, ctx)}</h1>${tp.rule ? `<p class="rule"><span class="rule-lbl">${esc(t('grammar.rule'))}</span> ${inline(tp.rule, ctx)}</p>` : ''}${units ? `<p class="topic-units">${esc(t('grammar.seeUnit'))}: ${units}</p>` : ''}</header><div class="topic-body">${blocks(tp.blocks, ctx)}</div></main>`;
  return shell(ctx, { title: `${resolve(tp.title, ctx.names).m} — ${t('nav.grammar')} — ${site.name}`, description: resolve(tp.rule || tp.title, ctx.names).m, body, bodyClass: 'page-grammar page-topic', accent: ACCENTS.adriatic, scripts: ['exercises.js'], canonical: canonicalFor(`${ctx.slug}/grammar/${tp.id}.html`) });
}

function verbsPage(ctx, verbs, course) {
  const { t } = ctx;
  const body = `<main id="main" class="wrap page-ref page-verbs"><header class="ref-head"><span class="kicker">${esc(t('nav.verbs'))}</span><h1>${esc(t('verbs.title'))}</h1><p class="lede">${esc(t('verbs.intro'))}</p></header>
<div class="vb-tools"><label class="field"><span>${esc(t('verbs.verb'))}</span><input type="search" class="vb-search" list="vb-list" placeholder="${esc(t('verbs.search'))}" autocomplete="off"><datalist id="vb-list"></datalist></label><label class="field"><span>${esc(t('verbs.tense'))}</span><select class="vb-tense"></select></label><div class="vb-mode" role="group" aria-label="${esc(t('verbs.table'))}"><button type="button" class="btn active" data-mode="table">${esc(t('verbs.table'))}</button><button type="button" class="btn" data-mode="drill">${esc(t('verbs.drill'))}</button><button type="button" class="btn" data-mode="mistakes">${esc(t('verbs.mistakes'))}</button></div></div>
<div class="vb-out"></div>${jsonTag('verbs-data', { verbs, units: Object.fromEntries(course.units.map(u => [u.id, u.num])) })}</main>`;
  return shell(ctx, { title: `${t('verbs.title')} — ${t('track.name')} — ${site.name}`, description: t('verbs.intro'), body, bodyClass: 'page-verbs', accent: ACCENTS.amber, scripts: ['verbs.js'], canonical: canonicalFor(`${ctx.slug}/verbs.html`) });
}
function glossaryPage(ctx, allVocab, course) {
  const { t } = ctx;
  const body = `<main id="main" class="wrap page-ref"><header class="ref-head"><span class="kicker">${esc(t('nav.glossary'))}</span><h1>${esc(t('glossary.title'))}</h1><p class="lede">${esc(t('glossary.intro'))}</p></header>
<div class="gl-tools"><label class="field grow"><span class="sr-only">${esc(t('glossary.search'))}</span><input type="search" class="gl-search" placeholder="${esc(t('glossary.search'))}" autocomplete="off"></label>
<select class="gl-unit" aria-label="${esc(t('unit.unit'))}"><option value="">${esc(t('glossary.all'))}</option>${course.units.filter(u => allVocab.some(v => v.unit === u.id)).map(u => `<option value="${u.id}">${esc(t('unit.unit'))} ${u.num} · ${esc(resolve(u.title, ctx.names).m)}</option>`).join('')}</select>
<select class="gl-pos" aria-label="${esc(t('glossary.pos'))}"><option value="">${esc(t('glossary.pos'))}</option></select>
${ctx.target === 'it' ? `<select class="gl-gender" aria-label="${esc(t('glossary.gender'))}"><option value="">${esc(t('glossary.gender'))}</option><option value="m">${esc(t('vocab.m'))}</option><option value="f">${esc(t('vocab.f'))}</option></select>` : ''}</div>
<p class="gl-count" aria-live="polite"></p><ul class="gl-list"></ul>${jsonTag('glossary-data', allVocab.map(v => ({ t: v.t, n: resolve(v.n, ctx.names).m, article: v.article || '', gender: v.gender || '', pos: v.pos || '', plural: v.plural || '', ipa: v.ipa || '', ex: v.ex ? { t: resolve(v.ex.t, ctx.names).m, n: resolve(v.ex.n, ctx.names).m } : null, theme: v.theme || '', unit: v.unit, unitNum: v.unitNum })))}</main>`;
  return shell(ctx, { title: `${t('glossary.title')} — ${t('track.name')} — ${site.name}`, description: t('glossary.intro'), body, bodyClass: 'page-glossary', accent: ACCENTS.olive, scripts: ['glossary.js'], canonical: canonicalFor(`${ctx.slug}/glossary.html`) });
}
function phrasebookPage(ctx0, pb) {
  const ctx = sub(ctx0, { unit: { id: 'pb', num: 0, titleText: '' }, sectionId: 'pb' });
  const { t } = ctx;
  const body = `<main id="main" class="wrap page-ref page-phrasebook"><header class="ref-head"><span class="kicker">${esc(t('nav.phrasebook'))}</span><h1>${esc(t('phrasebook.title'))}</h1><p class="lede">${esc(t('phrasebook.intro'))}</p></header>
<label class="field"><span class="sr-only">${esc(t('phrasebook.search'))}</span><input type="search" class="ph-search" placeholder="${esc(t('phrasebook.search'))}"></label>
${pb.groups?.length ? blocks(pb.groups, ctx) : `<p class="muted">${esc(t('home.upcoming'))}</p>`}</main>`;
  return shell(ctx, { title: `${t('phrasebook.title')} — ${site.name}`, description: t('phrasebook.intro'), body, bodyClass: 'page-phrasebook', accent: ACCENTS.plum, scripts: ['phrasebook.js'], canonical: canonicalFor(`${ctx.slug}/phrasebook.html`) });
}
function placementPage(ctx, pl, course) {
  const { t } = ctx;
  const n = pl.questions?.length || 0;
  const starts = Object.fromEntries(course.levels.map(L => [L.id, L.units[0]]));
  const body = `<main id="main" class="wrap page-ref page-placement"><header class="ref-head"><span class="kicker">${esc(t('nav.placement'))}</span><h1>${esc(t('placement.title'))}</h1><p class="lede">${esc(t('placement.intro', { n }))}</p></header>
<div class="pl-ui">${n ? `<button type="button" class="btn btn-primary pl-start">${esc(t('placement.start'))}</button>` : `<p class="muted">${esc(t('placement.empty'))}</p>`}</div>${jsonTag('placement-data', { questions: pl.questions || [], starts })}</main>`;
  return shell(ctx, { title: `${t('placement.title')} — ${t('track.name')} — ${site.name}`, description: t('placement.intro', { n }), body, bodyClass: 'page-placement', accent: ACCENTS.lake, scripts: ['exercises.js', 'placement.js'], canonical: canonicalFor(`${ctx.slug}/placement.html`) });
}
function flashcardsPage(ctx, allVocab) {
  const { t } = ctx;
  const deck = allVocab.map(v => ({ id: `${v.unit}:${v.t}`, front: v.article ? `${v.article.endsWith("'") ? v.article : v.article + ' '}${v.t}` : v.t, back: resolve(v.n, ctx.names).m, hint: v.ex ? resolve(v.ex.t, ctx.names).m : '', unit: v.unit }));
  const body = `<main id="main" class="wrap page-ref page-flash"><header class="ref-head"><span class="kicker">${esc(t('nav.flashcards'))}</span><h1>${esc(t('flash.title'))}</h1><p class="lede">${esc(t('flash.allIntro'))}</p></header><div class="flashcards" data-deck="all" data-due-only="1"><script type="application/json" class="fc-data">${JSON.stringify(deck).replace(/</g, '\\u003c')}</script><div class="fc-ui"></div></div></main>`;
  return shell(ctx, { title: `${t('flash.title')} — ${t('track.name')} — ${site.name}`, description: t('flash.allIntro'), body, bodyClass: 'page-flash', accent: ACCENTS.pine, scripts: ['flashcards.js'], canonical: canonicalFor(`${ctx.slug}/flashcards.html`) });
}
function settingsPage(ctx) {
  const { t } = ctx;
  const body = `<main id="main" class="wrap page-ref page-settings"><header class="ref-head"><span class="kicker">${esc(t('nav.settings'))}</span><h1>${esc(t('settings.title'))}</h1><p class="lede">${esc(t('settings.storage'))}</p></header>
<form class="settings-form">
<fieldset><legend>${esc(t('settings.hero'))}</legend><label><input type="radio" name="hero" value="m">${esc(site.hero.m)}</label><label><input type="radio" name="hero" value="f">${esc(site.hero.f)}</label></fieldset>
<fieldset><legend>${esc(t('settings.self'))}</legend><label><input type="radio" name="self" value="m">${esc(t('home.selfM'))}</label><label><input type="radio" name="self" value="f">${esc(t('home.selfF'))}</label><label><input type="radio" name="self" value="both">${esc(t('home.selfBoth'))}</label></fieldset>
<fieldset><legend>${esc(t('settings.variants'))}</legend><label><input type="checkbox" name="both">${esc(t('settings.variants'))}</label></fieldset>
<fieldset><legend>${esc(t('settings.theme'))}</legend><label><input type="radio" name="theme" value="auto">${esc(t('settings.themeAuto'))}</label><label><input type="radio" name="theme" value="light">${esc(t('settings.themeLight'))}</label><label><input type="radio" name="theme" value="dark">${esc(t('settings.themeDark'))}</label></fieldset>
<fieldset><legend>${esc(t('settings.voice'))}</legend><label class="field"><span class="sr-only">${esc(t('settings.voice'))}</span><select name="voice"><option value="">${esc(t('settings.voiceAuto'))}</option></select></label><label class="field"><span>${esc(t('settings.rate'))}</span><input type="range" name="rate" min="0.6" max="1.2" step="0.1"></label><button type="button" class="btn voice-test">${esc(t('settings.test'))}</button></fieldset>
<fieldset><legend>${esc(t('settings.track'))}</legend><p>${esc(t('track.name'))} · <a href="${ctx.rootPath}${ctx.otherSlug}/index.html" lang="${ctx.otherUi}">${esc(t('track.switch'))}</a></p></fieldset>
<fieldset class="danger"><legend>${esc(t('settings.reset'))}</legend><button type="button" class="btn reset-btn" data-confirm="${esc(t('settings.resetConfirm'))}" data-done="${esc(t('settings.resetDone'))}">${esc(t('settings.reset'))}</button> <button type="button" class="btn export-btn">${esc(t('settings.export'))}</button> <label class="btn import-btn">${esc(t('settings.import'))}<input type="file" accept="application/json" hidden></label></fieldset>
<p class="settings-status" aria-live="polite"></p></form></main>`;
  return shell(ctx, { title: `${t('settings.title')} — ${site.name}`, description: t('settings.storage'), body, bodyClass: 'page-settings', accent: ACCENTS.ink, scripts: ['settings.js'] });
}

function landingPage(courses) {
  const tEn = makeT('en'), tIt = makeT('it');
  const ctx = { t: tEn, rootPath: '', track: null };
  const card = (t, lang, cfg, course) => `<a class="track-card" href="${cfg.slug}/index.html" lang="${lang}" hreflang="${lang}"><span class="kicker">${esc(t('track.levels'))}</span><h2>${esc(lang === 'en' ? t('landing.en') : t('landing.it'))}</h2><p>${esc(lang === 'en' ? t('landing.enDesc') : t('landing.itDesc'))}</p><p class="track-hero">${esc(t('track.hero'))}</p><span class="btn btn-primary">${esc(t('home.go'))} →</span></a>`;
  const col = (t, lang) => `<div class="land-col" lang="${lang}"><p class="kicker">${esc(t('landing.kicker'))}</p><h1>${esc(t('landing.title'))}</h1><p class="lede">${esc(t('landing.lede'))}</p><ul class="land-features"><li>${esc(t('landing.f1'))}</li><li>${esc(t('landing.f2'))}</li><li>${esc(t('landing.f3'))}</li><li>${esc(t('landing.f4'))}</li></ul></div>`;
  const body = `<main id="main" class="landing"><section class="wrap land-grid">${col(tEn, 'en')}${col(tIt, 'it')}</section>
<section class="wrap land-choose"><div class="continue-card" hidden><span class="kicker"></span><a class="continue-link" href="#"><span class="continue-title"></span><span class="continue-sub"></span></a></div><div class="track-grid">${card(tEn, 'en', site.tracks['it-for-en'], courses['it-for-en'])}${card(tIt, 'it', site.tracks['en-for-it'], courses['en-for-it'])}</div></section></main>`;
  return shell(ctx, { title: `${site.name} · ${site.nameAlt} — ${tEn('track.name')} · ${tIt('track.name')}`, description: `${tEn('landing.lede')} ${tIt('landing.lede')}`, body, bodyClass: 'page-landing', accent: ACCENTS.terracotta, scripts: ['landing.js'], alternates: alternatesFor('learn-italian/', 'impara-inglese/'), canonical: canonicalFor('') });
}
function provenancePage() {
  const t = makeT('en');
  const ctx = { t, rootPath: '', track: null };
  const md = exists(P('PROVENANCE.md')) ? read(P('PROVENANCE.md')) : '';
  const html = md.split(/\n\s*\n/).map(p => p.startsWith('#') ? `<h${Math.min(3, p.match(/^#+/)[0].length)}>${esc(p.replace(/^#+\s*/, ''))}</h${Math.min(3, p.match(/^#+/)[0].length)}>` : p.startsWith('|') ? '' : p.startsWith('- ') ? `<ul>${p.split('\n').map(l => `<li>${esc(l.replace(/^- /, ''))}</li>`).join('')}</ul>` : `<p>${esc(p)}</p>`).join('\n');
  const body = `<main id="main" class="wrap page-ref page-prose"><header class="ref-head"><h1>${esc(t('footer.provenance'))}</h1></header>${html}</main>`;
  return shell(ctx, { title: `${t('footer.provenance')} — ${site.name}`, description: t('footer.about'), body, bodyClass: 'page-provenance', accent: ACCENTS.ink });
}

/* ---------- build ---------- */
export async function build() {
  fs.rmSync(P('dist'), { recursive: true, force: true });
  const summary = { tracks: {} };
  const courses = {};
  for (const track of Object.keys(site.tracks)) {
    const ctx = trackCtx(track);
    const realDir = P('content', track);
    const dir = process.env.DS_CONTENT ? path.resolve(root, process.env.DS_CONTENT, track) : realDir;
    if (!exists(dir)) fs.mkdirSync(dir, { recursive: true });
    const shared = (f) => exists(path.join(dir, f)) ? path.join(dir, f) : path.join(realDir, f);
    const course = readJSON(shared('course.json'));
    courses[track] = course;
    const verbsSpec = exists(shared('verbs.json')) ? readJSON(shared('verbs.json')).verbs : [];
    const conj = ctx.target === 'it' ? conjIt.conjugateAll(verbsSpec) : conjEn.conjugateAll(verbsSpec);
    ctx.conj = conj;
    const files = fs.readdirSync(dir).filter(f => /^unit-\d\d\.json$/.test(f)).sort();
    const units = files.map(f => readJSON(path.join(dir, f)));
    const built = new Set(units.map(u => u.id));
    const allVocab = [], allGrammar = [], stats = {};
    const out = (...p) => P('dist', ctx.slug, ...p);
    units.forEach(U => {
      const idx = course.units.findIndex(c => c.id === U.id);
      if (idx < 0) throw new Error(`${track}: unit ${U.id} not in course.json`);
      const r = unitPage(ctx, U, course, idx, built);
      write(out('units', `unit-${U.id}.html`), r.html);
      allVocab.push(...r.vocab); allGrammar.push(...r.grammar);
      stats[U.id] = { vocab: r.vocab.length, exercises: r.exercises, sections: r.sections };
    });
    const gdir = path.join(dir, 'grammar');
    const topics = exists(gdir) ? fs.readdirSync(gdir).filter(f => f.endsWith('.json')).sort().map(f => readJSON(path.join(gdir, f))) : [];
    topics.forEach(tp => { tp.units = [...new Set([...(tp.units || []), ...allGrammar.filter(g => g.ref === tp.id).map(g => g.unit)])].sort(); write(out('grammar', `${tp.id}.html`), grammarTopicPage(ctx, tp, course)); });
    write(out('index.html'), trackHome(ctx, course, built, stats));
    write(out('grammar.html'), grammarIndex(ctx, topics, allGrammar, course));
    write(out('verbs.html'), verbsPage(ctx, verbsSpec, course));
    write(out('glossary.html'), glossaryPage(ctx, allVocab, course));
    write(out('phrasebook.html'), phrasebookPage(ctx, exists(path.join(dir, 'phrasebook.json')) ? readJSON(path.join(dir, 'phrasebook.json')) : { groups: [] }));
    write(out('placement.html'), placementPage(ctx, exists(path.join(dir, 'placement.json')) ? readJSON(path.join(dir, 'placement.json')) : { questions: [] }, course));
    write(out('flashcards.html'), flashcardsPage(ctx, allVocab));
    write(out('settings.html'), settingsPage(ctx));
    write(out('data', 'glossary.json'), JSON.stringify(allVocab));
    summary.tracks[track] = { units: files.length, vocab: allVocab.length, grammar: allGrammar.length, topics: topics.length, verbs: conj.size, exercises: Object.values(stats).reduce((a, s) => a + s.exercises, 0), stats };
  }
  write(P('dist/index.html'), landingPage(courses));
  write(P('dist/provenance.html'), provenancePage());
  // assets
  fs.mkdirSync(P('dist/assets'), { recursive: true });
  for (const f of fs.readdirSync(P('src/css'))) fs.copyFileSync(P('src/css', f), P('dist/assets', f));
  for (const f of fs.readdirSync(P('src/js'))) fs.copyFileSync(P('src/js', f), P('dist/assets', f));
  if (exists(P('src/assets'))) fs.cpSync(P('src/assets'), P('dist/assets'), { recursive: true });
  if (site.url) {
    const u = site.url.replace(/\/$/, '');
    const pages = ['', 'provenance.html'];
    for (const track of Object.keys(site.tracks)) { const s = site.tracks[track].slug; const d = P('dist', s); (function rec(dd) { for (const e of fs.readdirSync(dd, { withFileTypes: true })) { const p = path.join(dd, e.name); if (e.isDirectory()) rec(p); else if (p.endsWith('.html')) pages.push(path.relative(P('dist'), p)); } })(d); }
    write(P('dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `<url><loc>${u}/${p.replace(/index\.html$/, '')}</loc></url>`).join('\n')}\n</urlset>\n`);
    write(P('dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${u}/sitemap.xml\n`);
  }
  write(P('dist/data/build.json'), JSON.stringify({ ...summary, builtAt: new Date().toISOString() }, null, 1));
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().then(s => console.log('built:', JSON.stringify(s.tracks, (k, v) => k === 'stats' ? undefined : v))).catch(e => { console.error(e); process.exit(1); });
}
