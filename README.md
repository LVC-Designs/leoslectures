# Due Sponde · Two Shores

A free, public, original two-way language course: **Italian for English speakers** and **English for Italian speakers**, A1 → B1, one story told from both sides of the ocean. No account, no server: a static site with progress saved in the browser.

- `syllabus-it.md`, `syllabus-en.md` — the two syllabi (24 units each, planned from CEFR can-do descriptors)
- `content/` — all course content, one folder per track (see `CONTENT-SCHEMA.md`)
- `locales/` — UI strings (`en` for the Italian track, `it` for the English track)
- `build/` — static-site build, checker, dev server, tests
- `src/` — stylesheet, browser scripts (exercise engine, TTS, flashcards, conjugators, progress)
- `PROVENANCE.md` — CEFR goals per unit and originality record · `PROGRESS.md` — status

## Commands

```
npm run build    # content + src → dist/
npm run check    # content schema, variants, audio, links, exercise counts
npm run dev      # build, serve http://localhost:4321/, rebuild on change
npm test         # conjugators, grading, variants
```

Node 20+ required. No dependencies.

## How it works

- Each track is built to its own folder (`dist/learn-italian/`, `dist/impara-inglese/`) with the UI in the learner's native language; the landing page is bilingual with `hreflang` links (set `url` in `site.json` to enable absolute links and a sitemap).
- The learner chooses a protagonist, **Luca or Lucia**. Content stores both versions as variants; the page renders the chosen one, highlights the words that change, and can show both side by side.
- Audio is browser text-to-speech: `it-IT` voices for Italian, `en-CA` (fallback `en-US`, `en-GB`) for English.
- Exercises grade tolerantly: missing accents are "almost right"; the other protagonist's form is "almost right" with a hint.
- Progress, flashcards (spaced repetition) and conjugation mistakes are saved per track in `localStorage`.
