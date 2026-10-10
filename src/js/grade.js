// Answer grading. Pure module shared by node tests and the browser.
// compare(input, accepted, opts) → { status: 'ok' | 'almost' | 'wrong', expected, reason }
//   accepted: string | string[]  (any of these is fully correct)
//   opts.lang: 'it' | 'en'  — 'en' also accepts contracted / expanded forms
//   'almost' means: correct except for accents / apostrophes / capitalisation of a proper noun

const APOS = /[‘’ʼ`´]/g;
const QUOTES = /[“”«»]/g;
const DASHES = /[–—]/g;

export function stripDiacritics(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Basic normalisation that never changes a right answer into a wrong one. */
export function normalize(s) {
  return String(s ?? '')
    .replace(APOS, "'").replace(QUOTES, '"').replace(DASHES, '-')
    .replace(/\s*'\s*/g, "'")          // l' uomo → l'uomo
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')   // ciao , → ciao,
    .trim()
    .replace(/[.!?…]+$/g, '')           // ignore final punctuation
    .trim()
    .toLowerCase();
}

/** Remove all punctuation (for a looser comparison). */
export function loose(s) {
  return normalize(s).replace(/[.,;:!?"()]/g, '').replace(/\s+/g, ' ').trim();
}

const CONTRACTIONS = [
  [/\bi'm\b/g, 'i am'], [/\byou're\b/g, 'you are'], [/\bwe're\b/g, 'we are'], [/\bthey're\b/g, 'they are'],
  [/\bisn't\b/g, 'is not'], [/\baren't\b/g, 'are not'], [/\bwasn't\b/g, 'was not'], [/\bweren't\b/g, 'were not'],
  [/\bdon't\b/g, 'do not'], [/\bdoesn't\b/g, 'does not'], [/\bdidn't\b/g, 'did not'],
  [/\bcan't\b/g, 'cannot'], [/\bcan not\b/g, 'cannot'], [/\bcouldn't\b/g, 'could not'], [/\bwon't\b/g, 'will not'], [/\bwouldn't\b/g, 'would not'],
  [/\bshouldn't\b/g, 'should not'], [/\bmustn't\b/g, 'must not'], [/\bhaven't\b/g, 'have not'], [/\bhasn't\b/g, 'has not'], [/\bhadn't\b/g, 'had not'],
  [/\b(\w+)'ll\b/g, '$1 will'], [/\b(\w+)'ve\b/g, '$1 have'], [/\b(\w+)'re\b/g, '$1 are'],
];
export function expandContractions(s) {
  let out = s;
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out;
}

function forms(s, lang) {
  const n = normalize(s), l = loose(s);
  const set = new Set([n, l]);
  if (lang === 'en') { set.add(expandContractions(n)); set.add(expandContractions(l)); }
  return [...set];
}

export function compare(input, accepted, opts = {}) {
  const lang = opts.lang || 'it';
  const list = (Array.isArray(accepted) ? accepted : [accepted]).filter(a => a != null && String(a).trim() !== '');
  const given = forms(input, lang);
  if (!given[0]) return { status: 'wrong', expected: list[0] ?? '', reason: 'empty' };
  for (const a of list) {
    const want = forms(a, lang);
    if (want.some(w => given.includes(w))) return { status: 'ok', expected: a };
  }
  // accents / diacritics only?
  for (const a of list) {
    const want = forms(a, lang).map(stripDiacritics);
    if (want.some(w => given.map(stripDiacritics).includes(w))) return { status: 'almost', expected: a, reason: 'accents' };
  }
  return { status: 'wrong', expected: list[0] ?? '' };
}

/** Grade against a hero/self variant pair: tells the learner when they typed the other gender's form. */
export function compareVariant(input, pair, opts = {}) {
  // pair: {m: string|string[], f: string|string[], same}
  const g = opts.gender || 'm';
  const mine = g === 'f' ? pair.f : pair.m, other = g === 'f' ? pair.m : pair.f;
  if (g === 'both' || pair.same) {
    const r1 = compare(input, pair.m, opts);
    if (r1.status === 'ok') return r1;
    const r2 = compare(input, pair.f, opts);
    if (r2.status === 'ok') return r2;
    return r1.status === 'almost' ? r1 : r2.status === 'almost' ? r2 : r1;
  }
  const r = compare(input, mine, opts);
  if (r.status === 'ok' || r.status === 'almost') return r;
  const o = compare(input, other, opts);
  if (o.status === 'ok') return { status: 'almost', expected: Array.isArray(mine) ? mine[0] : mine, reason: 'variant', other: g === 'f' ? 'm' : 'f' };
  return r;
}
