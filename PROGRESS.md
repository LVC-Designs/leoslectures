# Progress

Status of Due Sponde · Two Shores. One unit per session; update this file and commit after each unit.

## Status at a glance

| Area | State |
|---|---|
| Engine (build, renderer, i18n, variants, exercises, TTS, flashcards, conjugators, progress) | Built 2026-10-09, tests passing, no content yet |
| Syllabus · Italian for English speakers | Drafted 2026-10-09 · **awaiting review** |
| Syllabus · English for Italian speakers | Drafted 2026-10-09 · **awaiting review** |
| Grammar reference pages | 0 written (engine ready: `content/<track>/grammar/<slug>.json`) |
| Phrasebooks | 0 groups (engine ready) |
| Placement tests | 0 questions (engine ready) |
| Site URL for hreflang / sitemap | not set (`site.json` → `url`) |

## Units

Legend: ☐ not started · ◐ drafted · ● built, checked, committed

### Italian for English speakers

| # | Unit | Level | State |
|---|---|---|---|
| 1 | Benvenuto / Benvenuta a Roccamarina | A1 | ☐ |
| 2 | La casa di Dora | A1 | ☐ |
| 3 | Al Bar del Corso | A1 | ☐ |
| 4 | La famiglia Ferrante | A1 | ☐ |
| 5 | In giro per il paese | A1 | ☐ |
| 6 | Una settimana a Roccamarina | A1 | ☐ |
| 7 | Al mercato del sabato | A1 | ☐ |
| 8 | All'ufficio anagrafe · checkpoint | A1 | ☐ |
| 9 | Com'è andata? | A2 | ☐ |
| 10 | Cerco un locale | A2 | ☐ |
| 11 | Com'era Roccamarina | A2 | ☐ |
| 12 | Dal medico | A2 | ☐ |
| 13 | Apriamo! | A2 | ☐ |
| 14 | Clienti e vicini | A2 | ☐ |
| 15 | Weekend a Napoli | A2 | ☐ |
| 16 | Chiara parte · checkpoint | A2 | ☐ |
| 17 | Il primo inverno | B1 | ☐ |
| 18 | A tavola si discute | B1 | ☐ |
| 19 | Una videochiamata da Toronto | B1 | ☐ |
| 20 | Se avessi una casa mia | B1 | ☐ |
| 21 | In bici verso nord | B1 | ☐ |
| 22 | Carte, contratti e burocrazia | B1 | ☐ |
| 23 | Un matrimonio in Sicilia | B1 | ☐ |
| 24 | Un anno a Roccamarina · checkpoint | B1 | ☐ |

### English for Italian speakers

| # | Unit | Level | State |
|---|---|---|---|
| 1 | Welcome to Canada | A1 | ☐ |
| 2 | The house on Nairn Avenue | A1 | ☐ |
| 3 | A double-double, please | A1 | ☐ |
| 4 | Sunday dinner | A1 | ☐ |
| 5 | Taking the streetcar | A1 | ☐ |
| 6 | A typical day | A1 | ☐ |
| 7 | Groceries and a winter coat | A1 | ☐ |
| 8 | At the bank · checkpoint | A1 | ☐ |
| 9 | The interview | A2 | ☐ |
| 10 | Apartment hunting | A2 | ☐ |
| 11 | First snow | A2 | ☐ |
| 12 | At the walk-in clinic | A2 | ☐ |
| 13 | Shifts at the bakery | A2 | ☐ |
| 14 | Small talk and a barbecue | A2 | ☐ |
| 15 | Road trip: Niagara and Montréal | A2 | ☐ |
| 16 | A letter home · checkpoint | A2 | ☐ |
| 17 | Moving in | B1 | ☐ |
| 18 | Opinions, eh? | B1 | ☐ |
| 19 | Christmas, and Luca / Lucia comes home | B1 | ☐ |
| 20 | What if I stayed? | B1 | ☐ |
| 21 | Out West | B1 | ☐ |
| 22 | Paperwork | B1 | ☐ |
| 23 | Priya's wedding | B1 | ☐ |
| 24 | One year in Toronto · checkpoint | B1 | ☐ |

## Session log

- **2026-10-09** · Repo created. Build system ported from the private project and rewritten for two tracks, i18n and Luca/Lucia variants. Engine written: renderer, exercise engine (11 kinds, accent-tolerant grading, variant-aware), TTS with per-language voices, flashcards (SRS), conjugators (IT rule-based + irregulars; EN spelling rules + irregulars), conjugation trainer with SRS, glossary, grammar index, phrasebook, placement test, settings, bilingual landing. Both syllabi drafted. Stopped for syllabus review before writing any unit.

## Per-unit checklist (run before committing a unit)

1. `npm run build` passes; `npm run check` passes (schema, both variants, audio, links, 25–40 exercises, mixed review present).
2. Open the unit in a browser as Luca and as Lucia: every variant line reads correctly; the agreement notes make sense; "show both" works.
3. Play every dialogue line and a sample of vocabulary with the it-IT / en-CA voice.
4. Do every exercise once correctly and once wrong; check feedback, accents handling, "other form" hint.
5. Add the unit to `PROVENANCE.md` with its CEFR descriptors.
6. Update this file; commit.
