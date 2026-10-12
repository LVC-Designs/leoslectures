# Adding a new course to leoslectures.com

This repo is now a hub. Due Sponde (Italian ⇄ English) is the first course; the
rest of this file is for the second (QA & GMP) and beyond. Everything shared
lives in `src/` and `build/`; a new course only adds content and configuration.

## Shape of the hub

```
.
├─ site.config.json       ← hub + course list + KOFI_URL / FEEDBACK_EMAIL / analytics
├─ site.json              ← site identity + per-track configuration (slugs, UI language)
├─ locales/
│   ├─ en.json            ← every UI string the English UI uses
│   └─ it.json            ← every UI string the Italian UI uses
├─ content/
│   ├─ it-for-en/         ← Italian for English speakers (Due Sponde)
│   └─ en-for-it/         ← English for Italian speakers (Due Sponde)
├─ src/
│   ├─ css/site.css       ← design system
│   ├─ css/fonts.css      ← fonts, non-blocking
│   ├─ js/                ← exercise engine, TTS, flashcards (SM-2), store, conjugators, i18n
│   └─ assets/            ← fonts, favicon, OG images
├─ build/
│   ├─ build.mjs          ← static site generator
│   ├─ render.mjs         ← block renderers (dialogue, vocab, grammar, exercises, …)
│   ├─ i18n.mjs           ← locale loader with {placeholder} support
│   ├─ check.mjs          ← schema + output checker
│   ├─ test.mjs           ← 55 unit tests on the engines
│   └─ e2e.mjs            ← headless browser scenarios
└─ dist/                  ← built site (gitignored)
```

## To add a course

1. **Register the course in `site.config.json`:**

   ```jsonc
   {
     "id": "qa-gmp",
     "slug": "qa-gmp",
     "name": "QA & GMP",
     "levels": "Intro → Practitioner",
     "status": "ready",
     "description": {
       "en": "…one-sentence English description for the hub card…",
       "it": "…same in Italian…"
     },
     "social": { "image": "assets/og/qa-gmp.png" }
   }
   ```

   `status: "ready"` makes the hub card clickable. `"upcoming"` greys it out.

2. **Pick a content layout.** The current engine is tuned for a two-way language
   course and will not fit every subject. For a non-language course (QA & GMP,
   for example) you have two choices:

   - **Reuse what fits.** The design system, the exercise engine, the TTS,
     spaced-repetition flashcards, progress storage, and the i18n all work for
     any subject. You only need to replace the content model and the "track"
     structure. Add a new build target in `build/build.mjs` for the new course
     (see `build()` — add a parallel block for the course's content folder).
   - **Keep the hub only.** Build the new course as a separate static site and
     publish it under the `/qa-gmp/` path. The hub at `/` already treats courses
     as independent sub-sites.

3. **Add a content folder.** For language courses, mirror
   `content/it-for-en/` with `course.json`, `verbs.json`, `tenses.json`,
   `phrasebook.json`, `placement.json`, `unit-NN.json`, and `grammar/*.json`
   following `CONTENT-SCHEMA.md`. For other subjects, define a new schema in
   a parallel `COURSE_SCHEMA_QA_GMP.md` and the matching renderer.

4. **Register the output paths.** In `site.json`, add a `tracks` entry if the
   course has tracks, with `slug` set to the final URL path
   (e.g. `qa-gmp/foundations`). The existing build already supports multi-level
   slugs; it computes `rootPath` from the slug depth.

5. **Add OG images.** Drop SVGs or PNGs in `src/assets/og/`, matching the
   `social.image` paths you set in `site.config.json`. 1200 × 630 is standard.

6. **Add UI strings.** If the new course needs UI strings (section names,
   button labels), add them to both `locales/en.json` and `locales/it.json`.
   The build fails the check if a key is in one locale and not the other.

7. **Register redirects (optional).** If the new course moves from an earlier
   URL, add entries to `_redirects` via `build/build.mjs` (the `redirects` array
   near the end of `build()`).

8. **Test.** `npm run build && npm run check && npm test && node build/e2e.mjs`.
   The e2e script will tell you which built-in scenarios still pass and which
   need updating for the new course.

## Config values the course inherits from the hub

- `site.config.json.KOFI_URL` → footer + about + unit completion card
- `site.config.json.FEEDBACK_EMAIL` → unit "Report a mistake" + footer feedback
- `site.config.json.analytics` → shared analytics script (off by default)
- `site.config.json.hub.name` / `hub.author` / `hub.social.image` → shell + OG

## Deployment

See `DEPLOY.md`. The hub, every course and every track deploy together as a
single static site to Cloudflare Pages (or Netlify) from `dist/`.
