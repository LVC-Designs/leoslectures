// UI strings: locales/<lang>.json, with t('a.b.c', {param}) lookup.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cache = {};
export function loadLocale(lang) {
  if (!cache[lang]) cache[lang] = JSON.parse(fs.readFileSync(path.join(root, 'locales', `${lang}.json`), 'utf8'));
  return cache[lang];
}

export function makeT(lang) {
  const L = loadLocale(lang);
  const t = (key, params) => {
    const v = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), L);
    if (v === undefined) throw new Error(`Missing UI string "${key}" in locales/${lang}.json`);
    if (typeof v !== 'string') return v;
    return params ? v.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`)) : v;
  };
  t.lang = lang;
  t.all = L;
  return t;
}
