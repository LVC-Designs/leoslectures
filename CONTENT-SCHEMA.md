# Content schema

How unit files and the other content files are written. Keep this in sync with `build/render.mjs` and `build/check.mjs`.

## Folders

```
content/it-for-en/   Italian for English speakers (target t = Italian, native n = English, UI en)
content/en-for-it/   English for Italian speakers (target t = English, native n = Italian, UI it)
  course.json        track manifest: levels, units (id, num, level, title, subtitle, goal, topics, accent, checkpoint, crossover)
  unit-NN.json       one file per unit
  grammar/<slug>.json  grammar reference pages (id = slug, title, category, rule, units, blocks)
  verbs.json         verb list for the conjugator ({inf|base, n, unit, isc?, aux?})
  tenses.json        one entry per conjugator tense, in the learner's language: {name, use, form, markers?, example:{t,n}, unit?, ref?}; shown on the Verbs page when a tense is selected (checked for parity with the conjugator's tense list)
  phrasebook.json    { groups: [ {type:"phrases", title, intro?, items:[{t, n, note?}]} ] }
  placement.json     { questions: [ {level:"A1"|"A2"|"B1", ...exercise} ] }
locales/en.json, locales/it.json   every UI string (same keys in both)
```

## Strings

- `t` = target-language text (speakable; gets a 🔊 button). `n` = native-language gloss / translation.
- Inline markup in any string: `**bold**`, `*italic*`, `[text](url)`, `[[target text|gloss]]` (speakable span with tooltip).
- **Variants**: `{hero}` → Luca / Lucia; `{{masc|fem}}` → inline alternative; or an object `{"m": "...", "f": "...", "note": "why", "who": "hero"|"self"}`. `who: "self"` means the variant refers to the learner (uses their chosen form; "both" accepts either answer). Differing words are highlighted automatically; `note` adds a "?" explanation.
- Never put HTML in content.

## Unit file

```json
{
  "id": "01", "level": "A1",
  "title": {"m": "Benvenuto a Roccamarina", "f": "Benvenuta a Roccamarina"},
  "subtitle": "Welcome to Roccamarina",
  "intro": "one or two paragraphs (prose markup)",
  "objectives": ["can-do 1", "can-do 2"],
  "canDo": ["A1 · Spoken interaction: can introduce themselves …"],
  "sections": [
    {"id": "story", "kind": "story", "title": "…", "intro": "…", "blocks": [ … ]},
    {"id": "words", "kind": "words", …}, {"id": "grammar", "kind": "grammar", …},
    {"id": "pron", "kind": "pron", …}, {"id": "practice", "kind": "practice", …},
    {"id": "culture", "kind": "culture", …}, {"id": "summary", "kind": "summary", …}
  ]
}
```
All seven `kind`s are required, in this order. Section labels come from the locale (`sections.<kind>`).

## Blocks

| type | fields |
|---|---|
| `prose` | `text` (paragraphs separated by blank lines; `- ` lists; `1. ` lists) |
| `callout` | `kind` (note, warn, tip, memo, culture, real, why, compare), `title`, `text` |
| `table` | `head[]`, `rows[][]`, `rowhead`, `speak` (true or column indexes to make speakable), `caption`, `note`, `compact` |
| `examples` | `items: [{t, n, note?}]` |
| `grid` | `cols`, `items: [{big, small?, sub?, say?}]` (numbers, letters) |
| `columns` | `items: [{title, list: [string | {t, n}]}]` |
| `pairs` | `caption`, `items: [[w1, w2, …]]` (strings or `{t, n}`) |
| `proverb` | `t`, `n`, `meaning` |
| `minimal` | `caption`, `pairs: [{a, b, na?, nb?, tip?}]` (pronunciation minimal pairs) |
| `sounds` | `items: [{sound, t, n?, ipa?, tip?}]` |
| `agreement` | `intro`, `items: [{t: {m, f}, n}]`, `note` (Luca/Lucia side by side) |
| `mistakes` | `title?`, `items: [{wrong, right, why?}]` |
| `dialogue` / `scene` | `id?`, `title`, `setting`, `register?`, `lines: [{who, t, n, note?} | {stage}]`, `notes: [{phrase, note}]`, `questions` (scene only: exercises). `who: "hero"` = the protagonist |
| `vocab` | `theme`, `n`, `intro?`, `items: [{t, n, article?, gender?, plural?, forms?, pos?, ipa?, tags?, ex: {t, n}, note?}]` |
| `grammar` | `id`, `title`, `category`, `rule`, `ref?` (slug of a grammar reference page), `blocks` |
| `conjugation` | `verb` or `verbs[]`, `tense` (key from the conjugator), `caption?`, `note?` — full table generated |
| `exercises` | `title?`, `intro?`, `review?: true`, `items: [exercise]` |
| `exercise` | one exercise (see below) |
| `cheatsheet` | `groups: [{title, rows: [[t, n] | "text"]}]` (summary) |
| `flashcards` | `items?` (defaults to the unit's vocabulary) |
| `phrases` | `title`, `intro?`, `items: [{t, n, note?}]` |
| `map` | `highlight: [regionKey]`, `labels`, `list`, `caption` (Italy) · `compass` |
| `subhead` | `text` · `two-col` → `cols: [[blocks], [blocks]]` · `figure` → `src`, `alt`, `caption` |

## Exercises (`kind`)

| kind | fields |
|---|---|
| `mc` | `q`, `options[]`, `answer` (index), `why` |
| `tf` | `q`, `t?` (statement), `answer` (boolean), `why` |
| `fill` | `q` with `___` blanks, `answers: [[accepted…], …]` one array per blank, `n`, `hint?`, `choices?: [[…], …]` (dropdowns) |
| `match` | `q?`, `pairs: [[t, n], …]` (≥ 3) |
| `order` | `q?`, `answer`, `n`, `words?` (custom tokens), `why?` |
| `translate` | `q` (native sentence), `answers[]` (accepted target sentences), `hint?` |
| `dictation` | `text`, `n`, `answers?` |
| `reply` | `line: {t, n?}`, `q?`, `options[]`, `answer`, `why` |
| `conjugate` | `verb`, `tense?`, `n?`, `persons?`, `answers[]` (one per person; each string or array) |
| `speak` | `text`, `n?`, `tip?` |
| `write` | `q`, `model`, `hint?` |

Every accepted answer may be a variant. Grading ignores case, final punctuation and apostrophe spacing; missing accents → "almost right"; the other protagonist's form → "almost right" with a hint. In the English track, contracted and full forms are both accepted.

Practice sections need 25–40 exercises and must end with an `exercises` block marked `"review": true`.
