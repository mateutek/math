# Topics by class: harder every year

Date: 2026-10-03. Status: steps 1 and 2 done.

## Goal

A topic game gets harder with the school class, not only with the level the kid
picks. Class 4 meets powers as squares and cubes; class 7 meets roots and the
power rules. A class also brings bigger numbers to the kinds it already had.

## Sources

- `podstawa-programowa-nauczania-matematyki-dla-klas-4-8.pdf` (2017, annotated
  by Matematyka z plusem): gives a class for every requirement.
- `MATEMATYKA PODSTAWA PROGRAMOWA SP 2026.pdf` (2026): only two bands,
  classes 4-6 and 7-8. In force for class 4 from 2026/27, one class more each
  year after.

Rule: the 2026 band is the hard limit. Inside a band the 2017 class numbers
decide the order.

## Model

- `topicTask(topic, level, cls)`. `cls` is the school class (4..8), and it must
  have reached the topic (`FROM` in `src/data/classes.js`), else it throws.
- Every topic is a table of task kinds, each with the class that meets it
  first. A class gets every kind up to its own, picked at random.
- `year = cls - FROM[topic]`: how many years the class has had the topic. It
  grows the numbers. The level (1-3) still grows them too, and still decides
  the few level details that already exist (shared denominators below level 3,
  one decimal place below level 3, the percent lists).
- Every task carries `type`, the kind's name, so the self-check can prove that
  a class sees exactly its kinds.

## Kinds per class

| Topic | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|
| Fractions | equal, same denominator +/-, pick equal, pick biggest (shared denominator) | + fraction of a number, unlike denominators (one divides the other), pick biggest with any denominators at level 3 | unlike denominators of any pair, fraction times fraction | bigger denominators | bigger denominators |
| Powers | square, cube, pick biggest (squares) | + powers of 2, powers of 10, sum of squares, pick bigger of a power and its mirror (2^5 or 5^2) | + square of a decimal (0,3^2) | + square root, same-base multiply and divide (exponent rules) | bigger bases |
| Decimals | - | add, sub, times a digit, from a fraction, pick biggest | + times or divided by 10/100, divided by a digit | + decimal times decimal | bigger operands |
| Percents | - | - | p% of a number, fraction to percent, pick equal | + what percent, the whole from a part | bigger bases |
| Pythagoras | - | - | - | - | as today |

Number growth with `year`: fraction denominators +1 a year; square bases +1 a
year; cube bases, powers of 2 grow with level and year; decimal operands go up
a place from year 1 (level 1) or year 2 (levels 2, 3); percent bases grow x10
a year.

## Steps

1. **(done)** class-aware generators: the kinds table, `year` scaling,
   `Topic.vue` and `tests.js` pass the class, `topics.check.js` proves each
   class gets exactly its kinds and the class 4 powers stay squares and cubes.
2. **(done)** New topics without words:
   - Negatives (5): +/- with brackets, pick biggest. 6: × and ÷ with signs.
     7: order of operations with signs.
   - Equations (6): one step and two steps with the '?' as the unknown, pick
     the number that fits. 7: x on both sides, brackets, pick x. An x task
     has no '?' slot; its prompt asks for x and the printable test skips it.
   - Average (6): the mean, pick the mean among near misses. 7: the missing
     number for a given mean, means of halves and quarters.
   - Answers may be below zero; the topics with signs get a ± key next to
     the field, since a phone's number pad has no minus.
3. Word problems (money, percent raises and cuts, proportion, speed,
   probability): see 2026-10-03-text-questions-design.md.
4. Geometry later: angles, areas, volumes, coordinates, circle, symmetry.

## Open

- Pythagoras "is it right-angled?" uses the converse theorem. 2017 excluded it
  explicitly; 2026 does not require it. Kept for now.
- Mixed numbers and powers of fractions need new tokens; not in step 1.
