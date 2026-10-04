# Text questions (zadania tekstowe) for classes 4-8

Date: 2026-10-03. Status: design plus a working prototype, not wired into the app.

Prototype: `src/games/wordProblems.js`, check: `node src/games/wordProblems.check.js`
(13 stories in 10 kinds, 3000 tasks per class and level).

## Goal

Generate short word problems the same way the topic games generate equations:
pure data, random numbers, an answer that is always right, both languages, and
a node self-check that proves it. Geometry stays out (Pythagoras already has
its own topic).

## 1. Representation

A word task is a topic task with a story where the equation would be:

```js
{ kind: 'number', story: { key: 'cost', vars: { name: 'Ola', item: 'notebook', count: 3, price: 350 } },
  answer: 10.5, unit: 'zł', type: 'cost' }
{ kind: 'pick', story: { key: 'die', vars: { event: 'even' } }, options: [[{ frac: [3, 6] }], ...], answer: 2, type: 'probability' }
```

Decisions:

- **The task stores `{ key, vars }`, never the sentence.** `storyText(task, lang)`
  builds the sentence when it is shown. Reason: the language can switch under
  a live task, and the check can read every task in both languages.
- **Numbers first, sentence second, answer from the same vars.** A generator
  draws the numbers (often backwards from the answer, like `unitPrice` builds
  the total from the price), then returns vars and answer together. No answer
  is ever written by hand.
- **`vars` hold exactly what the story prints.** The check asserts every var
  has a slot in both texts and is visible in the rendered sentence, then
  re-solves the task from the vars with its own formula. So the answer is
  provably reachable from what the kid reads, and the hidden value never sits
  in the task where a template could print it by mistake (kids never see answers).
- **Money in whole grosze, like decimals in topics.js are whole hundredths.**
  Divided by 100 only for the answer and the display.
- **Slots** in a text: `{x}` number, name, list or word; `{x zł}` grosze shown
  as money (`3,50 zł`, `12 zł`); `{x w}` count x followed by word w (or the
  word id held in var w) in the right plural form.

## 2. Polish grammar: the smallest mechanism that is correct

What `src/i18n.js` already has: `tp(key, n)` with 3 Polish forms
(1 / 2-4 except 12-14 / rest) and 2 English ones. That rule is exactly what
counted nouns need, so the prototype reuses it (copied as `form()`, because
`i18n.js` imports the Vue store and cannot load under node).

Three rules make the rest unnecessary:

1. **Present tense only.** "Ania kupuje", "Tomek kupuje": the 3rd person
   present has no gender. The past tense (kupił / kupiła) would need a gender
   per name. Not needed, so no gender table.
2. **A count is never the subject of a verb.** "3 zeszyty kosztują" but
   "5 zeszytów kosztuje" needs verb agreement with the numeral. Counts only
   follow a verb or a preposition: "kupuje 3 zeszyty", "Za 3 zeszyty płaci",
   "do 3 naleśników".
3. **A word is stored in the case its slot needs**, as the same 3 forms:
   `hours` is accusative (godzinę / godziny / godzin, "jedzie 3 godziny"),
   `pancakes` genitive (naleśnika / naleśników / naleśników, "do 5
   naleśników"). Words are things only, never people or animals: for things
   the plural accusative equals the nominative, so one list serves "kupuje".
   Counts in buying stories start at 2, so the singular accusative ("1
   kredkę") never appears. A word shown without a number is its first form,
   so the singular subject "Zeszyt kosztuje" works for any gender. A
   capital is added to the first letter of the sentence.

Names are nominative only (no "Oli", "Tomka"), so a flat list of names is enough.
English: names stay Polish; "One {item}" avoids a/an; the check rejects "a"
before a vowel. Decimals never take a counted noun (units are abbreviations:
zł, km, km/h, g, h), which sidesteps "2,5 kilograma".

## 3. Templates per class

Class = 2017 annotation, always inside the 2026 band (4-6, 7-8), as in
`2026-10-03-topics-by-class-design.md`. **P** = in the prototype.

| Kind | Story | 2026 band | Class | Answer | P |
|---|---|---|---|---|---|
| cost | one costs x, buys n, how much | 4-6 (I.35) | 4 | number zł | P |
| change | buys n at x, pays with a note, change | 4-6 (IV.13) | 4 | number zł | P |
| unitPrice | n cost T together, one costs | 4-6 (I.35) | 4 | number zł | P |
| compare offers | pack of 6 for x or 1 for y, which is cheaper | 4-6 (I.35) | 5 | pick | |
| clock | starts 8:45, lasts 50 min, ends at | 4-6 (IV.9) | 4 | pick of times, or typed minutes | |
| calendar | days between two dates, weeks to days | 4-6 (IV.8) | 4 | number | |
| scale | map 1:50 000, 3 cm is how many km | 4-6 (IV.11) | 5 | number km | |
| speed | distance, speed or time, km/h, whole hours | 4-6 (IV.12) | 6 | number km, km/h, h | P |
| percent of | 25% of the class of 28 are... | 4-6 (I.34) | 6 | number | |
| discount | price drops by p%, new price | 4-6 (I.35) | 6 | number zł | P |
| average | marks 1-6, average | 4-6 (V.3) | 6 (2017: 7) | number | P |
| equation (easy) | think of a number, x 3 + 4 = 19 | 4-6 | 6 | number | |
| priceBefore | after a p% rise costs y, price before | 7-8 (I.2) | 7 | number zł | P |
| raise / cut twice | +10% then -10% | 7-8 (I.2) | 7 | number zł | |
| interest | yearly deposit at p% | 7-8 (I.2) | 7 | number zł | |
| probability | die event, balls in a bag | 7-8 (VI.6) | 7 | pick of fractions | P |
| proportion | 6 pancakes need 240 g, 10 need | 7-8 (I.10) | 7 (2017: 8) | number g | P |
| equation (story) | Ola has 3 more than Tomek, together 21 | 7-8 (II.12) | 7 | number | |
| split | share S in the ratio a:b | 7-8 (I.10) | 8 | number zł | P |
| two coins / two dice | both heads, sum 7 | 7-8 (VI.6) | 8 | pick of fractions | |

`year = cls - from` per kind (not per topic): a mixed topic spans 4-8, so a
kind first met in class 7 must not count class 4 as its first year. Counts
grow with it; prices grow with the level (50 gr steps, 10 gr steps, any grosz).

## 4. Answer formats

- **Typed number** (most): the existing input and `parseAnswer` take digits
  with comma or dot, so "18,6" and "18,60" both match 18.6 via `sameNumber`.
  **Units are not typed**: `unit` is printed after the input box ("zł", "km/h").
  Typing "18,60 zł" would need parseAnswer to strip units; not worth it.
- **Fraction** (probability): a pick of 3-4 fractions drawn by MathParts,
  shown unreduced (favourable over all, the way the kid counts). Wrong
  options are the real slips: complement, one over all, one off on top,
  favourable over unfavourable. Typing a fraction would need a new input.
- **Pick** also fits "which offer is cheaper" and clock times later.

## 5. How it plugs in

Decision: **one mixed topic "Zadania tekstowe" (id e.g. `stories`, FROM 4)**,
with kinds tagged by class, exactly like `topicTask`: `wordTask(level, cls)`,
`wordKindsFor(cls)`, `type` on every task. Reasons: one game card, one colour
and one route instead of six; a class gets more kinds every year with no new
UI; the check pattern (every class sees exactly its kinds) carries over.

Wiring (later, not done here, other files are being edited):

- `Topic.vue`: if `task.story`, show `storyText(task, settings.lang)` in place
  of `kid-eq`, and `task.unit` after the input. Pick options already render.
- `src/data/classes.js` / `games.js`: the new topic id and its colours.
- `tests.js`: a section that prints the story with a blank line for the answer
  (the answer key gets the number and unit).
- `package.json` `check`: add `node src/games/wordProblems.check.js`.
- Move `form()` into a pure helper that `i18n.js` and `wordProblems.js` both
  import (marked `ponytail:` in the prototype).

What the check proves (3000 tasks per class and level):

- every class gets exactly its kinds, and the curriculum order holds;
- both texts render with no empty slot, no em dash, start with a capital,
  end with "?", at most 30 words, every var visible in the sentence;
- the answer equals an independent re-solve from the printed vars, has at
  most two decimals, is positive, and parses back from the Polish comma;
- the story is possible: change positive and from a real banknote, total
  divides by the count, speed suits the vehicle, hours whole and at most 5,
  ratio never 1:1, marks 1-6, no sure or impossible event, options distinct;
- grammar: plural forms for 1, 2, 5, 12, 22, 112, ...; the pl and en texts
  have the same slots; counts in buying stories are at least 2.

## 6. Variety and realism

- Every kind draws from lists: 10 names, 6 small items with real price
  ranges (bułka 0,60-1,50 zł, bilet 3-15 zł), 5 big items for sales
  (rower 400-1500 zł), 4 vehicles with their own speed range.
- Sale prices are built so the new price is whole zł; a note is one of the
  two smallest that cover the cost; percents come from the level lists the
  Percents topic already uses.
- Sentences stay 2-3 short clauses; the check caps them at 30 words.
- Next for variety: 2-3 phrasings per key (`cost`, `cost2`), and not the
  same kind twice in a row in `Topic.vue`.

## Open questions (need a decision)

1. **One mixed topic or areas?** Prototype assumes one "Zadania tekstowe"
   game. Alternative: put percent stories into Percents and keep a separate
   money game for class 4-5.
2. **Where do the sentences live?** Prototype keeps them in
   `wordProblems.js` (content, like a question bank, and checkable under
   node). The app's other strings live in `i18n.js`; moving them there needs
   the check to read i18n.js as text, like `theory.check.js` does.
3. **Units typed or printed?** Prototype prints the unit after the box.
4. **Probability: pick or typed fraction?** Pick for now; a typed fraction
   needs a two-field input.
5. **Average in class 6** (2026 band 4-6) although 2017 put it in 7: kept at 6,
   matching the topics-by-class plan.
6. **English names**: keep Polish names in the English text (prototype) or
   swap to English ones?
7. **Reward**: same materials and level multiplier as a topic task, or more,
   since reading takes longer?

## Decisions (2026-10-03, from the user)

- Spread, no separate game: each story is dealt out by the topic it practises
  (`HOME` in wordProblems.js). Money (cost, change, unit price) in Decimals,
  which now opens in class 4; discount and price before a rise in Percents;
  speed and proportion in Equations; a share of a ratio and probability in
  Fractions; marks in Average.
- Units sit after the answer box, never typed.
- Probability is a pick of 3-4 fraction tiles; at least two balls of each
  colour, so there are always three tiles.
- Pay: on Łatwy a story pays like any task; on Średni and Trudny one level
  more, since it takes longer to read.
- Sentences stay in wordProblems.js, where the node check reads them.
