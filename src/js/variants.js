// Luca / Lucia variant resolution. Pure module shared by the build (node) and the browser.
// A "variant" is any of:
//   - a plain string, optionally containing {hero} (protagonist's name) or {{masc|fem}} inline alternatives
//   - an object {m: "...", f: "...", note?: "...", who?: "hero"|"self"}
// resolve() turns any of these into {m, f, same, note, who}.

export const HERO = { m: 'Luca', f: 'Lucia' };

export function isVariant(x) {
  return !!x && typeof x === 'object' && !Array.isArray(x) && ('m' in x || 'f' in x);
}

const INLINE = /\{\{([^{}|]*)\|([^{}]*)\}\}/g;

function fill(s, g, names) {
  return String(s ?? '')
    .replace(/\{hero\}/g, names[g])
    .replace(INLINE, (_, m, f) => (g === 'm' ? m : f));
}

export function hasVariants(s) {
  return typeof s === 'string' && (/\{hero\}/.test(s) || INLINE.test(s));
}

export function resolve(x, names = HERO) {
  if (isVariant(x)) {
    const m = fill(x.m ?? x.f, 'm', names), f = fill(x.f ?? x.m, 'f', names);
    return { m, f, same: m === f, note: x.note || '', who: x.who === 'self' ? 'self' : 'hero' };
  }
  const s = String(x ?? '');
  const m = fill(s, 'm', names), f = fill(s, 'f', names);
  return { m, f, same: m === f, note: '', who: 'hero' };
}

/** Pick one gender for a variant: g = 'm' | 'f' | 'both' (both → m for text, caller may show both). */
export function pick(x, g, names = HERO) {
  const v = resolve(x, names);
  return g === 'f' ? v.f : v.m;
}

/** Choose the gender that applies to a variant given the learner's settings. */
export function genderFor(v, settings) {
  const who = v.who || 'hero';
  if (who === 'self') return settings.self || 'both';
  return settings.hero || 'm';
}

/** Word-level diff: returns [{t, diff}] token lists for m and f with the differing span marked. */
export function diffWords(m, f) {
  const a = m.split(/(\s+)/), b = f.split(/(\s+)/);
  if (a.length === b.length) return { m: a.map((t, i) => ({ t, diff: t !== b[i] && t.trim() !== '' })), f: b.map((t, i) => ({ t, diff: t !== a[i] && t.trim() !== '' })) };
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const mark = (arr) => arr.map((t, i) => ({ t, diff: i >= pre && i < arr.length - suf && t.trim() !== '' }));
  return { m: mark(a), f: mark(b) };
}

/** Deep-walk any JSON value and resolve every variant to a single gender (used by the exercise engine). */
export function flatten(value, g, names = HERO) {
  if (isVariant(value)) return pick(value, g, names);
  if (Array.isArray(value)) return value.map(v => flatten(v, g, names));
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = flatten(value[k], g, names);
    return out;
  }
  if (typeof value === 'string') return fill(value, g, names);
  return value;
}
