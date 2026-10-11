// Translates every conjugated form into the learner's language, so a paradigm never shows a form without its meaning.
// glossForms('it', 'to speak', 'passato_prossimo', forms, 'm') → ['I spoke · I have spoken', …] (Italian course: English glosses)
// glossForms('en', 'parlare', 'past_simple', forms, 'f') → ['ho parlato', …]                  (English course: Italian glosses)
// Works from the verb's dictionary gloss (verbs.json `n`): the first alternative, parentheses removed, head verb conjugated
// with the other track's conjugator, the rest of the gloss carried along ("to be able to" → "I am able to").
// Pure module: runs in the browser and in node tests. Returns null when the gloss is not a conjugatable verb.
import * as IT from './conj-it.js';
import * as EN from './conj-en.js';

const STATIVE = new Set(['be', 'have', 'know', 'want', 'like', 'love', 'need', 'prefer', 'seem', 'belong', 'mean', 'understand', 'believe', 'remember', 'hate', 'own', 'owe', 'matter', 'exist', 'can', 'must']);
const STARE = { pres: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'], imp: ['stavo', 'stavi', 'stava', 'stavamo', 'stavate', 'stavano'] };
const REFL = ['mi', 'ti', 'si', 'ci', 'vi', 'si'];
const enCache = new Map(), itCache = new Map();
const enConj = (base) => { if (!enCache.has(base)) enCache.set(base, EN.conjugate({ base, n: '' })); return enCache.get(base); };
const itConj = (inf) => { if (!itCache.has(inf)) itCache.set(inf, IT.conjugate({ inf, n: '' })); return itCache.get(inf); };
const pick = (f, gender) => typeof f === 'string' ? f : (gender === 'f' ? f.f : f.m);
const withTail = (s, tail) => tail ? `${s} ${tail}` : s;
const first = (s) => String(s).split(' / ')[0];

// "to live (in a place)" → { head: 'live', tail: '' } · "to be able to, can" → { head: 'be', tail: 'able to' } · "avere bisogno di" → { head: 'avere', tail: 'bisogno di' }
export function parseGloss(n, target) {
  let g = String(n || '').split(/[,;]/)[0].replace(/\([^)]*\)/g, '').trim();
  if (target === 'it') g = g.replace(/^to\s+/, '');
  const [head = '', ...rest] = g.split(/\s+/).filter(Boolean);
  return { head, tail: rest.join(' ') };
}

export function glossForms(target, n, tense, forms, gender = 'm') {
  try { return target === 'it' ? toEnglish(n, tense, forms) : toItalian(n, tense, forms, gender); } catch { return null; }
}

function toEnglish(n, tense, forms) {
  const { head, tail } = parseGloss(n, 'it');
  if (!head || !/^[a-z]+$/.test(head)) return null;
  const e = enConj(head), T = e.tenses;
  const f = (k, i) => withTail(T[k].forms[i].replace(/^he\b/, 'he / she'), tail);
  const six = (fn) => forms.map((_, i) => fn(i));
  const base = withTail(e.forms.base, tail);
  switch (tense) {
    case 'presente': return six(i => f('present_simple', i));
    case 'passato_prossimo': return six(i => `${f('past_simple', i)} · ${f('present_perfect', i)}`);
    case 'imperfetto': return six(i => STATIVE.has(head) ? f('past_simple', i) : `${f('past_continuous', i)} · used to ${base}`);
    case 'trapassato_prossimo': return six(i => f('past_perfect', i));
    case 'futuro': return six(i => f('future_will', i));
    case 'futuro_anteriore': return six(i => f('future_perfect', i));
    case 'passato_remoto': return six(i => f('past_simple', i));
    case 'condizionale': return six(i => f('conditional', i));
    case 'condizionale_passato': return six(i => f('conditional_perfect', i));
    case 'imperativo': return [`${base}! (informal)`, `${base}! (formal)`, `let's ${base}`, `${base}! (plural)`, `${base}! (formal plural)`, `don't ${base}`].slice(0, forms.length);
    case 'congiuntivo_presente': return six(i => `(that) ${f('present_simple', i)}`);
    case 'congiuntivo_passato': return six(i => `(that) ${f('present_perfect', i)}`);
    case 'congiuntivo_imperfetto': return six(i => `(that / if) ${f('past_simple', i)}`);
    case 'congiuntivo_trapassato': return six(i => `(that / if) ${f('past_perfect', i)}`);
    case 'forme': return [`to ${base}`, withTail(e.forms.ing, tail), withTail(first(e.forms.pp), tail)].slice(0, forms.length);
    default: return null;
  }
}

function toItalian(n, tense, forms, gender) {
  const { head, tail } = parseGloss(n, 'en');
  if (!head || !/(are|ere|ire|rsi|rre)$/.test(head)) return null;
  const c = itConj(head), T = c.tenses;
  const g = (k, i) => withTail(pick(T[k].forms[i], gender), tail);
  const six = (fn) => forms.map((_, i) => fn(i));
  const inf = T.forme.forms[0], ger = T.forme.forms[1], pp = T.forme.forms[2];
  const infFor = (i) => withTail(c.reflexive ? inf.replace(/si$/, REFL[i]) : inf, tail);
  const prog = (aux, i) => withTail(c.reflexive ? `${REFL[i]} ${aux[i]} ${ger.replace(/si$/, '')}` : `${aux[i]} ${ger}`, tail);
  const imp = T.imperativo.forms;
  switch (tense) {
    case 'present_simple': return six(i => g('presente', i));
    case 'present_continuous': return six(i => prog(STARE.pres, i));
    case 'past_simple': return six(i => g('passato_prossimo', i));
    case 'past_continuous': return six(i => prog(STARE.imp, i));
    case 'present_perfect': return six(i => g('passato_prossimo', i));
    case 'present_perfect_continuous': return six(i => `${g('presente', i)} da…`);
    case 'past_perfect': return six(i => g('trapassato_prossimo', i));
    case 'past_perfect_continuous': return six(i => `${g('imperfetto', i)} da…`);
    case 'future_will': return six(i => g('futuro', i));
    case 'future_going_to': return six(i => `${STARE.pres[i]} per ${infFor(i)}`);
    case 'future_perfect': return six(i => g('futuro_anteriore', i));
    case 'conditional': return six(i => g('condizionale', i));
    case 'conditional_perfect': return six(i => g('condizionale_passato', i));
    case 'imperative': return [`${withTail(imp[0], tail)} (tu) · ${withTail(imp[1], tail)} (Lei)`, withTail(imp[5], tail), withTail(imp[2], tail)].slice(0, forms.length);
    case 'forms': return [withTail(inf, tail), g('presente', 2), withTail(ger, tail), g('passato_prossimo', 0), withTail(pp, tail)].slice(0, forms.length);
    default: return null;
  }
}
