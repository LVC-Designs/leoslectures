// English verb conjugator: spelling rules + irregular table.
// conjugate(spec) → { base, n, unit, irregular, forms: {base, s, ing, past, pp}, tenses: { key: {label, group, persons, forms, neg, q} } }

export const PERSONS = ['I', 'you', 'he / she / it', 'we', 'you (pl.)', 'they'];
const SUBJ = ['I', 'you', 'he', 'we', 'you', 'they'];

// base: [past, past participle] — alternatives with " / "
export const IRREGULARS = {
  be: ['was / were', 'been'], become: ['became', 'become'], begin: ['began', 'begun'], bite: ['bit', 'bitten'], blow: ['blew', 'blown'], break: ['broke', 'broken'], bring: ['brought', 'brought'], build: ['built', 'built'], buy: ['bought', 'bought'],
  catch: ['caught', 'caught'], choose: ['chose', 'chosen'], come: ['came', 'come'], cost: ['cost', 'cost'], cut: ['cut', 'cut'], deal: ['dealt', 'dealt'], do: ['did', 'done'], draw: ['drew', 'drawn'], dream: ['dreamed / dreamt', 'dreamed / dreamt'], drink: ['drank', 'drunk'], drive: ['drove', 'driven'],
  eat: ['ate', 'eaten'], fall: ['fell', 'fallen'], feed: ['fed', 'fed'], feel: ['felt', 'felt'], fight: ['fought', 'fought'], find: ['found', 'found'], fly: ['flew', 'flown'], forget: ['forgot', 'forgotten'], forgive: ['forgave', 'forgiven'], freeze: ['froze', 'frozen'],
  get: ['got', 'got / gotten'], give: ['gave', 'given'], go: ['went', 'gone'], grow: ['grew', 'grown'], hang: ['hung', 'hung'], have: ['had', 'had'], hear: ['heard', 'heard'], hide: ['hid', 'hidden'], hit: ['hit', 'hit'], hold: ['held', 'held'], hurt: ['hurt', 'hurt'],
  keep: ['kept', 'kept'], know: ['knew', 'known'], lay: ['laid', 'laid'], lead: ['led', 'led'], learn: ['learned / learnt', 'learned / learnt'], leave: ['left', 'left'], lend: ['lent', 'lent'], let: ['let', 'let'], lie: ['lay', 'lain'], light: ['lit', 'lit'], lose: ['lost', 'lost'],
  make: ['made', 'made'], mean: ['meant', 'meant'], meet: ['met', 'met'], pay: ['paid', 'paid'], put: ['put', 'put'], quit: ['quit', 'quit'], read: ['read', 'read'], ride: ['rode', 'ridden'], ring: ['rang', 'rung'], rise: ['rose', 'risen'], run: ['ran', 'run'],
  say: ['said', 'said'], see: ['saw', 'seen'], sell: ['sold', 'sold'], send: ['sent', 'sent'], set: ['set', 'set'], shake: ['shook', 'shaken'], shine: ['shone', 'shone'], shoot: ['shot', 'shot'], show: ['showed', 'shown'], shut: ['shut', 'shut'], sing: ['sang', 'sung'], sink: ['sank', 'sunk'], sit: ['sat', 'sat'], sleep: ['slept', 'slept'], slide: ['slid', 'slid'], speak: ['spoke', 'spoken'], spend: ['spent', 'spent'], spill: ['spilled / spilt', 'spilled / spilt'], stand: ['stood', 'stood'], steal: ['stole', 'stolen'], stick: ['stuck', 'stuck'], strike: ['struck', 'struck'], swim: ['swam', 'swum'],
  take: ['took', 'taken'], teach: ['taught', 'taught'], tear: ['tore', 'torn'], tell: ['told', 'told'], think: ['thought', 'thought'], throw: ['threw', 'thrown'], understand: ['understood', 'understood'],
  wake: ['woke', 'woken'], wear: ['wore', 'worn'], win: ['won', 'won'], write: ['wrote', 'written'],
};

// two-syllable verbs stressed on the last syllable: double the final consonant
const STRESSED_END = new Set(['begin', 'forget', 'prefer', 'refer', 'admit', 'commit', 'occur', 'regret', 'control', 'permit', 'upset', 'submit', 'omit', 'transfer', 'equip', 'forbid']);
const NO_DOUBLE = /[wxy]$/;

function syllables(w) { return (w.match(/[aeiouy]+/g) || []).length; }
function doubles(w) {
  if (!/[^aeiou][aeiou][^aeiouwxy]$/.test(w)) return false;
  if (NO_DOUBLE.test(w)) return false;
  if (syllables(w) === 1) return true;
  if (STRESSED_END.has(w)) return true;
  if (/[^aeiou][aeiou]l$/.test(w)) return true; // Canadian / British: travel → travelling, cancel → cancelled
  return false;
}
export function ing(w) {
  if (w === 'be') return 'being';
  if (/ie$/.test(w)) return w.slice(0, -2) + 'ying';
  if (/[^eoy]e$/.test(w) && !/ee$/.test(w)) return w.slice(0, -1) + 'ing';
  if (/ee$|ye$|oe$/.test(w)) return w + 'ing';
  if (/c$/.test(w) && /[aeiou]c$/.test(w)) return w + 'king';
  if (doubles(w)) return w + w.slice(-1) + 'ing';
  return w + 'ing';
}
export function ed(w) {
  if (/e$/.test(w)) return w + 'd';
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
  if (/c$/.test(w) && /[aeiou]c$/.test(w)) return w + 'ked';
  if (doubles(w)) return w + w.slice(-1) + 'ed';
  return w + 'ed';
}
export function third(w) {
  if (w === 'have') return 'has';
  if (w === 'be') return 'is';
  if (/(s|sh|ch|x|z|o)$/.test(w)) return w + 'es';
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
  return w + 's';
}

export const TENSES = [
  ['present_simple', 'Present simple', 'present'], ['present_continuous', 'Present continuous', 'present'],
  ['past_simple', 'Past simple', 'past'], ['past_continuous', 'Past continuous', 'past'],
  ['present_perfect', 'Present perfect', 'perfect'], ['present_perfect_continuous', 'Present perfect continuous', 'perfect'], ['past_perfect', 'Past perfect', 'perfect'], ['past_perfect_continuous', 'Past perfect continuous', 'perfect'],
  ['future_will', 'Future with will', 'future'], ['future_going_to', 'Future with going to', 'future'], ['future_perfect', 'Future perfect', 'future'],
  ['conditional', 'Conditional (would)', 'conditional'], ['conditional_perfect', 'Conditional perfect (would have)', 'conditional'],
  ['imperative', 'Imperative', 'present'],
  ['forms', 'Forms', 'forms'],
];

const BE = { pres: ['am', 'are', 'is', 'are', 'are', 'are'], past: ['was', 'were', 'was', 'were', 'were', 'were'] };
const BE_SHORT = { pres: ["'m", "'re", "'s", "'re", "'re", "'re"] };
const first = (s) => s.split(' / ')[0];

export function conjugate(spec) {
  const base = spec.base;
  const irr = IRREGULARS[base];
  const past = spec.past || (irr ? irr[0] : ed(base));
  const pp = spec.pp || (irr ? irr[1] : ed(base));
  const s3 = spec.s || third(base);
  const g = spec.ing || ing(base);
  const isBe = base === 'be';
  const forms = { base, s: s3, ing: g, past, pp };
  const tenses = {};
  const put = (key, aff, neg, q, short) => { const [, label, grp] = TENSES.find(t => t[0] === key); tenses[key] = { label, group: grp, persons: PERSONS, forms: aff, neg, q, short }; };
  const P = SUBJ;
  const have = ['have', 'have', 'has', 'have', 'have', 'have'];
  const haveS = ["'ve", "'ve", "'s", "'ve", "'ve", "'ve"];

  if (isBe) {
    put('present_simple', BE.pres.map((b, i) => `${P[i]} ${b}`), BE.pres.map((b, i) => `${P[i]} ${b} not`), BE.pres.map((b, i) => `${cap(b)} ${P[i]}?`), BE.pres.map((b, i) => `${P[i]}${BE_SHORT.pres[i]}`));
    put('past_simple', BE.past.map((b, i) => `${P[i]} ${b}`), BE.past.map((b, i) => `${P[i]} ${b} not`), BE.past.map((b, i) => `${cap(b)} ${P[i]}?`), BE.past.map((b, i) => `${P[i]} ${b}n't`));
  } else {
    put('present_simple', P.map((p, i) => `${p} ${i === 2 ? s3 : base}`), P.map((p, i) => `${p} ${i === 2 ? 'does' : 'do'} not ${base}`), P.map((p, i) => `${i === 2 ? 'Does' : 'Do'} ${p} ${base}?`), P.map((p, i) => `${p} ${i === 2 ? "doesn't" : "don't"} ${base}`));
    put('past_simple', P.map(p => `${p} ${first(past)}`), P.map(p => `${p} did not ${base}`), P.map(p => `Did ${p} ${base}?`), P.map(p => `${p} didn't ${base}`));
  }
  put('present_continuous', BE.pres.map((b, i) => `${P[i]} ${b} ${g}`), BE.pres.map((b, i) => `${P[i]} ${b} not ${g}`), BE.pres.map((b, i) => `${cap(b)} ${P[i]} ${g}?`), BE.pres.map((b, i) => `${P[i]}${BE_SHORT.pres[i]} ${g}`));
  put('past_continuous', BE.past.map((b, i) => `${P[i]} ${b} ${g}`), BE.past.map((b, i) => `${P[i]} ${b} not ${g}`), BE.past.map((b, i) => `${cap(b)} ${P[i]} ${g}?`), BE.past.map((b, i) => `${P[i]} ${b}n't ${g}`));
  put('present_perfect', have.map((h, i) => `${P[i]} ${h} ${first(pp)}`), have.map((h, i) => `${P[i]} ${h} not ${first(pp)}`), have.map((h, i) => `${cap(h)} ${P[i]} ${first(pp)}?`), have.map((h, i) => `${P[i]}${haveS[i]} ${first(pp)}`));
  put('present_perfect_continuous', have.map((h, i) => `${P[i]} ${h} been ${g}`), have.map((h, i) => `${P[i]} ${h} not been ${g}`), have.map((h, i) => `${cap(h)} ${P[i]} been ${g}?`), have.map((h, i) => `${P[i]}${haveS[i]} been ${g}`));
  put('past_perfect', P.map(p => `${p} had ${first(pp)}`), P.map(p => `${p} had not ${first(pp)}`), P.map(p => `Had ${p} ${first(pp)}?`), P.map(p => `${p}'d ${first(pp)}`));
  put('past_perfect_continuous', P.map(p => `${p} had been ${g}`), P.map(p => `${p} had not been ${g}`), P.map(p => `Had ${p} been ${g}?`), P.map(p => `${p}'d been ${g}`));
  put('future_will', P.map(p => `${p} will ${base}`), P.map(p => `${p} will not ${base}`), P.map(p => `Will ${p} ${base}?`), P.map(p => `${p}'ll ${base}`));
  put('future_going_to', BE.pres.map((b, i) => `${P[i]} ${b} going to ${base}`), BE.pres.map((b, i) => `${P[i]} ${b} not going to ${base}`), BE.pres.map((b, i) => `${cap(b)} ${P[i]} going to ${base}?`), BE.pres.map((b, i) => `${P[i]}${BE_SHORT.pres[i]} going to ${base}`));
  put('future_perfect', P.map(p => `${p} will have ${first(pp)}`), P.map(p => `${p} will not have ${first(pp)}`), P.map(p => `Will ${p} have ${first(pp)}?`), P.map(p => `${p}'ll have ${first(pp)}`));
  put('conditional', P.map(p => `${p} would ${base}`), P.map(p => `${p} would not ${base}`), P.map(p => `Would ${p} ${base}?`), P.map(p => `${p}'d ${base}`));
  put('conditional_perfect', P.map(p => `${p} would have ${first(pp)}`), P.map(p => `${p} would not have ${first(pp)}`), P.map(p => `Would ${p} have ${first(pp)}?`), P.map(p => `${p}'d have ${first(pp)}`));
  tenses.imperative = { label: 'Imperative', group: 'present', persons: ['(you)', '(you) negative', "let's"], forms: [cap(base) + '!', `Don't ${base}!`, `Let's ${base}!`] };
  tenses.forms = { label: 'Forms', group: 'forms', persons: ['base', '3rd person -s', '-ing', 'past simple', 'past participle'], forms: [base, s3, g, past, pp] };
  return { base, n: spec.n, unit: spec.unit, irregular: !!irr, forms, tenses };
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function conjugateAll(list) {
  const map = new Map();
  for (const spec of list) map.set(spec.base, conjugate(spec));
  return map;
}
