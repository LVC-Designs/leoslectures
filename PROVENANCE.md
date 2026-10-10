# Provenance

Due Sponde · Two Shores is an original course. This file records, for every unit, which public CEFR descriptors it targets and confirms that its content was written for this project.

## Rules this project follows

- No textbook, PDF, published course or private course material was read, consulted or reproduced while planning the syllabi or writing any unit. The syllabi (`syllabus-it.md`, `syllabus-en.md`) were planned from the public CEFR Companion Volume (2020) can-do descriptors for A1, A2 and B1 and from general word-frequency knowledge, not from any existing course's sequence, unit themes or structure.
- Only code was reused from the author's private study site (a build pipeline and renderer). Every word of course content, every character, place, dialogue, reading, example sentence, exercise and cultural note is original.
- Grammar is public knowledge and is taught completely, in the project's own words, tables and examples.
- Roccamarina (Puglia) and Maple & Rye Bakery (Toronto) are fictional; the cast is fictional. Real institutions (the TTC, OHIP, the Comune, INPS, Trenitalia and so on) are described factually in the "Living there" sections.

## Units

Each unit is listed here when it is written, with the CEFR descriptors it covers and a confirmation of originality.

### Italian for English speakers (`content/it-for-en/`)

#### Unit 1 · Benvenuto / Benvenuta a Roccamarina (A1) · written 2026-10-10
- **CEFR descriptors covered (A1):** spoken interaction: introduce oneself and others, ask and answer simple questions about personal details; conversation: basic greeting and leave-taking expressions, make an introduction; spoken production: describe oneself, where one is from, nationality; listening: follow very slow, carefully articulated speech; writing: spell one's name and write simple personal details.
- **Grammar:** subject pronouns; *essere* (present); gender of nouns and the singular definite article; adjective agreement (-o/-a, -e) with the Luca/Lucia contrast; yes/no questions, question words, negation with *non*; *tu* vs *Lei*; *chiamarsi* (mi chiamo / ti chiami / si chiama); numbers 0–20; the alphabet.
- **Reference pages added:** subject-pronouns, essere, nouns-and-definite-article, adjective-agreement, questions-and-negation, tu-and-lei.
- **Originality:** the two scenes (the platform with Dora's misspelled sign; the neighbour Pasquale at the door), all 40 vocabulary examples, all tables, all 40 exercises and the cultural notes were written for this project. No source text was consulted. The "Living there" notes describe general Italian customs (greetings by time of day, tu/Lei, titles, cheek kisses, the "americano" label for returning emigrants' grandchildren) from general knowledge.

#### Unit 2 · La casa di Dora (A1) · written 2026-10-10
- **CEFR descriptors covered (A1):** spoken production: describe where one lives in simple phrases; spoken interaction: ask and answer simple questions about objects and places, say what one has; listening: understand simple instructions and familiar words about everyday surroundings; reading: understand short simple notices (house rules, rubbish calendar); writing: write simple phrases about where one lives.
- **Grammar:** *avere* (present; avere fame/sete/caldo/freddo); *c'è / ci sono*, *ecco*; indefinite article (un, uno, una, un'); regular plurals of nouns, definite articles (i, gli, le) and adjectives, invariable nouns, mixed-group agreement; question words (che cos'è, dov'è, quanti, com'è); numbers 20–100; hard and soft c/g.
- **Reference pages added:** avere, ce-ci-sono, indefinite-article, plurals, question-words, numbers.
- **Originality:** the two scenes (Dora shows the flat; the three rules of the building, with Pasquale's "Ho sentito!" from downstairs), all 40 vocabulary examples, tables, 40 exercises and the cultural notes (lease types, deposit, spese condominiali, bidet, shutters, drying racks, waste sorting, quiet hours, portone / citofono / pianerottolo) were written for this project from general knowledge of Italian housing.

### English for Italian speakers (`content/en-for-it/`)

#### Unit 1 · Welcome to Canada (A1) · written 2026-10-10
- **CEFR descriptors covered (A1):** spoken interaction: introduce oneself and others, ask and answer simple questions about personal details; conversation: basic greeting and leave-taking expressions, make an introduction; spoken production: describe oneself, where one is from, nationality; listening: follow very slow, carefully articulated speech; writing: spell one's name and write simple personal details.
- **Grammar:** subject pronouns (obligatory; *it*; no formal *Lei*); *be* (full, contracted, negative, questions, short answers; uses incl. age and physical states); *a / an* (incl. professions); regular plurals (-s, -es, -ies); countries, nationalities, languages (capitals, zero article); numbers 0–20; the alphabet; th and h.
- **Reference pages added:** subject-pronouns, verb-be, a-an, plural-nouns, nationalities.
- **Originality:** the two scenes (border control at Pearson; the arrivals hall with Franco and Teresa), all 42 vocabulary examples, tables, 40 exercises and the cultural notes were written for this project. The "Vivere lì" notes describe Canada (provinces, official languages, time difference), the working-holiday arrival procedure (permit issued at the port of entry, proof of funds and insurance, customs declaration), small-talk conventions and forms of address from general knowledge; readers are pointed to the CBSA site for current rules.

#### Unit 2 · The house on Nairn Avenue (A1) · written 2026-10-10
- **CEFR descriptors covered (A1):** spoken production: describe where one lives in simple phrases; spoken interaction: ask and answer simple questions about objects and places, say what one has and whose things are; listening: understand simple instructions and familiar words about everyday surroundings; reading: understand short simple notices (bin labels); writing: write simple phrases about where one lives.
- **Grammar:** *there is / there are*; *have* with do/does (have got noted as British); *this, that, these, those*; prepositions of place (in, on, at, under, next to, behind, in front of, between, above, near); possessive adjectives and the possessive 's (his/her by owner, shown with the Luca/Lucia variant); *the* for known things; irregular plurals.
- **Reference pages added:** there-is-there-are, verb-have, this-that-these-those, prepositions-of-place, possessives (plural-nouns extended).
- **Originality:** the two scenes (the house tour with shoes off, two kitchens and Luca's/Lucia's old room; the bins and the thermostat), all 40 vocabulary examples, tables, 40 exercises and the cultural notes (Canadian house types, basements, shoes off, thermostat etiquette, Toronto's green/blue/garbage bins, "make yourself at home", the Italian-Canadian "good living room") were written for this project from general knowledge of life in Toronto.

## Shared tools

- **Conjugators** (`src/js/conj-it.js`, `src/js/conj-en.js`): rule-based, with irregular-verb dictionaries compiled from general linguistic knowledge. Verb lists and their glosses in `content/*/verbs.json` are the project's own.
- **Phrasebooks, placement tests, grammar reference pages:** written for this project; listed here as they are added.
