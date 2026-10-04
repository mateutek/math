# Geometry for classes 4-8

Date: 2026-10-03. Status: design plus a visual prototype, nothing wired into the app.

Prototype (private artifact): https://claude.ai/artifact/ChPa9N2V2SgdsVdq5R4G43
It has seven random tasks drawn the way this doc proposes, light and dark themes, a
three.js view to compare against the SVG one, and a CSS 3D net fold.

## Goal

Geometry tasks that work like the topic games already do. A task is pure data,
generated with random numbers, checked under plain node by a self-check that
recomputes the answer by a second, independent route, and drawn by a Vue
component that never sees the answer until a printed answer key asks for it.
Kids never see answers on a kid-facing screen.

## Sources and rule

The same as `2026-10-03-topics-by-class-design.md`: the 2026 band (4-6, 7-8) is the
hard limit; inside a band the 2017 class numbers (annotated by Matematyka z
plusem) set the order. Where 2017 only says "klasy 4, 5, 6" the order follows the
M+ textbooks: angles and rectangles in 4, triangles and quadrilateral areas in 5,
solids and nets in 5-6.

Two notable moves in 2026: the coordinate grid comes down into band 4-6
(2017 had it in class 7), and the circle's circumference and area stay in 7-8.
Cylinder, cone and sphere are only recognised (4-6); no volume of them anywhere.

## 1. Inventory

"Auto" means it can be generated and checked as a typed number or a pick.

| Family | Requirement (2026 item) | 2026 band | First class (2017 order) | Auto | Answer |
|---|---|---|---|---|---|
| **Lines** | point, line, ray, segment; parallel and perpendicular (4-6: 4.1, 4.3) | 4-6 | 4 | yes | pick: name the figure, which pair is parallel |
| **Measuring** | measure segments to 1 mm, angles to 1° (Miary 1, 3) | 4-6 | 4 | partly | estimate as a pick of 4 values far apart; real protractor work is offline |
| **Units** | length, area (ar, ha), volume, litre conversions (Miary 2, 4-6) | 4-6 | 4-5 | yes | number; no figure, belongs with decimals |
| **Scale** | real length from a map scale (Miary 11) | 4-6 | 4 | yes | number; a story, already the word-problem pattern |
| **Angle types** | acute, right, obtuse, straight, full, reflex (4.2) | 4-6 | 4 | yes | pick |
| **Angle pairs** | adjacent, vertical (4.4) | 4-6 | 5 | yes | number ° |
| **Parallel lines** | corresponding, alternate angles (4.4) | 4-6 | 5 (2017: 7) | yes | number ° |
| **Triangle types** | by angles and by sides (4.7) | 4-6 | 5 | yes | pick |
| **Angle sums** | triangle 180, quadrilateral 360 (4.8) | 4-6 | 5 | yes | number ° |
| **Isosceles** | equal base angles, equal arms (4.9) | 4-6 | 5 | yes | number ° or length |
| **Triangle inequality** | can these sides make a triangle (4.10) | 4-6 | 5 | yes | pick yes/no |
| **Quadrilaterals** | square, rectangle, rhombus, parallelogram, trapezoid; properties (4.11) | 4-6 | 4-5 | yes | pick (name it), number (missing angle) |
| **Perimeter** | of a polygon with given sides (4.15) | 4-6 | 4 | yes | number |
| **Area** | triangle, square, rectangle, rhombus, parallelogram, trapezoid, composite (4.14) | 4-6 | 4 (rectangle), 5 (rest) | yes | number cm² |
| **Heights** | recognise a height in triangle, parallelogram, trapezoid (4.13) | 4-6 | 5 | yes | pick which dashed segment is the height |
| **Polygons** | vertices, interior angles, sides, diagonals (4.5) | 4-6 | 4 | yes | pick, or count sides or diagonals as a number |
| **Circle parts** | centre, radius, diameter, chord (4.6) | 4-6 | 4 | yes | pick, or d = 2r as a number |
| **Symmetry axes** | axially symmetric figures, their axes (4.12) | 4-6 | 5 | yes | pick, or "how many axes" as a number |
| **Coordinates** | place and read lattice points with integer coordinates of any sign, distance on a line parallel to an axis (4.16, 4.17) | 4-6 | 4 first quadrant, all four once the class has negative numbers (5) (2017: 7) | yes | tap to place; pick a pair; number |
| **Solids** | recognise prism, pyramid, cuboid, cube, cylinder, cone, sphere; vertices, edges, faces (4.18, 4.19) | 4-6 | 5-6 | yes | pick, or count edges as a number |
| **Nets** | net of a right prism, cube, regular pyramid (4.20) | 4-6 | 5-6 | yes | pick the net that folds |
| **Cuboid** | surface area, volume, solids made of cuboids (4.21, 4.22) | 4-6 | 5 | yes | number cm², cm³ |
| **Bisectors** | perpendicular bisector, angle bisector (7-8: 3.1) | 7-8 | 8 | partly | number ° (bisected angle) |
| **Central symmetry** | centre of symmetry (3.2) | 7-8 | 8 | yes | pick |
| **Regular polygons** | interior angle (3.3) | 7-8 | 7 | yes | number ° |
| **Pythagoras** | right triangles anywhere (3.4) | 7-8 | 8 | yes | exists as a topic; extends to grids and solids |
| **Special triangles** | 30-60-90, 45-45-90 (3.5) | 7-8 | 8 | yes | number, answers as a·√2 or a·√3 coefficient |
| **Congruence** | SSS, SAS, ASA (3.6) | 7-8 | 7 | partly | pick which rule; proofs stay on paper |
| **Circle** | circumference, area, and back: the radius from the circumference or the area (3.7; the 2026 notes name the reverse explicitly) | 7-8 | 8 (2017 XIV) | yes | number as a multiple of π |
| **Decompose** | split polygons to compare or estimate areas (3.8) | 7-8 | 7 | yes | number (lattice polygons) |
| **Lattice polygons** | draw on the grid; area and perimeter (3.10, 3.11) | 7-8 | 7 | yes | number |
| **Prisms, pyramids** | right and regular; heights; surface area, volume (3.12-3.14) | 7-8 | 7 (prism), 8 (pyramid) | yes | number |

Not auto: drawing and constructing with ruler and compass, proofs, "make a model
from a net". Those stay on paper; the test builder can print the figure for them
later.

### Cross-check against both curricula (2026-10-03)

Every 2026 item has a row: Figury 4-6 points 1-22, Miary 1-6 and 11, Figury 7-8
points 3.1-3.14 (3.9, modelling real objects, is the word-problem pattern).
Fixed in this pass:
- Circle moved to class 8, as 2017 has it; it had said 7 against the doc's own
  ordering rule. The reverse tasks (radius from the area) are added, because
  the 2026 implementation notes use exactly that example.
- 4.5 (polygons: vertices, angles, diagonals) was missing.
- Coordinates: 2026 says integer coordinates, so negatives are in the 4-6 band,
  not just the first quadrant. First quadrant in class 4, all four from class 5.
- Pythagoras "is it right-angled?": the 2026 reasoning section (7-8, 5.3a) asks
  the kid to tell a theorem from its converse, which supports keeping that
  task rather than dropping it.
Dropped by 2026 and so left out: the annulus (2017 XIV.5), the midpoint of a
segment (2017 X.4), inequality sets on the number line (2017 X.1).

## 2. Rendering

### Decision: SVG for every task

Every task figure is inline SVG, generated by a Vue component from the task's
data, the way `{ triangle }` is drawn today.

Reasons:

- **Prints.** `tests.js` prints questions; SVG prints crisp and black on paper with
  `.kid-paper` styles. A WebGL canvas prints blank or as a bitmap.
- **Themes for free.** Strokes and fills are `currentColor` and `--k-*` variables;
  night mode needs no code. A WebGL scene has to re-read colours on every theme
  change (the prototype does it with a MutationObserver).
- **Accessible.** `role="img"` plus an `aria-label` built from the same data
  ("Trapez. Dolna podstawa 10 cm, górna 4 cm, wysokość 5 cm.").
- **Costs nothing.** No dependency, a few hundred lines in total. The test is
  the same `holds()` pattern, no DOM.
- **Labels are exact.** Text sits where a teacher puts it. In 3D every label must be
  projected again each frame and still collides with edges.

### Solids: oblique projection, in SVG

Polish textbooks draw solids in oblique (cabinet) projection: depth at 45°,
halved, hidden edges dashed. That is the convention kids know from the book and
the board, so it beats isometric. It covers cuboid, cube, prisms with any base
(draw the base in oblique, extrude straight up), pyramids (base in oblique, apex
above the base centre), cylinder and cone (the base is an ellipse; the far half of
the base is dashed). One `oblique(points3d)` function plus the hidden-edge rule
covers them all. It is good enough for every task in the inventory: none needs
the kid to rotate anything to answer.

### Real 3D: optional, never needed to answer

| Option | Cost | Use |
|---|---|---|
| SVG oblique | 0 KB | every task, every print |
| CSS 3D transforms | 0 KB | fold a net into a cube or a prism or pyramid (faces are divs, triangles via clip-path); spin a cuboid |
| three.js | about 118 KB gzipped for r128 (measured in the prototype: 589 KB unpacked); a tree-shaken modern build with only the parts used is still around 100-150 KB | smooth shading, cylinders and cones that spin, free orbiting |

When is 3D worth it? A net folding into its solid after a right answer, and a
"look around" toggle next to a class 7-8 prism or pyramid, to see that the
height of the pyramid is not the height of a face. Both are a reward or an aid,
never the task itself. Both fit in CSS 3D, which the prototype proves for the
cube fold.

So: **no three.js now.** If it ever comes (round solids spinning in a theory
article, say), it is lazy-loaded with a dynamic `import()` only on that route, and
the SVG stays the printable and accessible form of the same data.

### Phone

All figures use a `viewBox` of about 320 x 200 and scale to the card. Arcs, labels
and right-angle marks are sized in px after fitting, so a 3 cm and a 30 cm figure
read the same. Angles in generated triangles are at least 30° so labels never get
squeezed. A 3D view must not trap scroll: `touch-action: pan-y` and only a
sideways drag spins.

## 3. Data model

A figure is one new token in `parts`, like `{ triangle }`: `{ fig: { ... } }`. It
holds only what the kid reads. The '?' may sit inside it, exactly as it does in
`{ triangle }` today.

```js
// angle on a line, the '?' inside the figure
{ kind: 'number', parts: [{ fig: { shape: 'angles', pair: 'adjacent', angles: [125, '?'] } }], answer: 55, unit: '°' }

// triangle by its angles
{ fig: { shape: 'triangle', angles: { A: 50, B: 70, C: '?' } } }

// area: the figure has no '?', the equation after it does
{ kind: 'number', parts: [{ fig: { shape: 'trapezoid', a: 10, b: 4, h: 5, offset: 3 } }, { t: 'areaP' }, '=', '?'], answer: 35, unit: 'cm²' }

// circle, answer as a multiple of π
{ parts: [{ fig: { shape: 'circle', d: 8 } }, { t: 'areaP' }, '=', '?', { t: 'pi' }], answer: 16, unit: 'cm²' }

// grid: place a point (a new task kind), read one (a pick)
{ kind: 'place', parts: [{ fig: { shape: 'grid', range: [-5, 5] } }], target: [3, -2], prompt: 'geoPlace' }
{ kind: 'pick', parts: [{ fig: { shape: 'grid', range: [0, 10], points: { A: [3, 7] } } }], options: [[3, 7], [7, 3], ...] }

// solids
{ fig: { shape: 'cuboid', a: 4, b: 3, c: 6 } }
{ fig: { shape: 'prism', base: { shape: 'triangle', sides: [3, 4, 5] }, h: 10 } }
{ fig: { shape: 'net', cells: ['X...', 'XXXX', 'X...'] } }
```

Decisions:

- **Dimensions, not coordinates.** A generator draws numbers; a pure
  `vertices(fig)` turns them into model coordinates. Renderer and check share that
  function, so what is checked is exactly what is drawn.
- **To scale by default, inside limits.** Angles are always drawn at their true
  measure (a 125° angle must look obtuse). Lengths are drawn to scale when the
  ratio of the longest to shortest side is at most 4; otherwise the figure is
  clamped and carries a small "rysunek poglądowy" note. Circles are never to
  scale (they all look alike), only the label carries the number.
- **Units.** A figure's lengths share one unit, stated in its labels; the answer's
  unit is `task.unit`, already drawn by `Topic.vue` next to the field.
- **Labels** are numbers with units on edges, degree values in arcs, letters A, B,
  C outside the vertices. The '?' in a figure is drawn in the brand colour, as the
  slot is in an equation, and filled in on the printed answer key only.
- **aria-label** is built from the same data and never includes the hidden value.
  Where a figure cannot be described without giving the answer away (read A's
  coordinates), a screen reader gets the other variant of the task instead.

### The node check

`geometry.check.js` (or more cases in `topics.check.js`), with no DOM:

- **Angles:** the sum on a line is 180, around a point 360, in a triangle 180, in a
  quadrilateral 360; each angle at least 30°. The angle measured back off the
  vertices with `atan2` equals its label, so a picture can never contradict its
  numbers.
- **Triangles:** the triangle inequality holds for every drawn triangle (and fails
  for the "can it be built" no-cases); Pythagoras uses `isTriple` as today.
- **Areas:** the formula answer equals the shoelace area of `vertices(fig)`. Two
  unrelated computations, one number.
- **Solids:** volume equals a voxel count for whole-number cuboids and
  cuboid-made solids; surface area equals the sum of the net's face areas.
- **Nets:** roll a die over the cells; a net folds into a cube exactly when the six
  cells land on six different faces (done in the prototype). Prism and pyramid
  nets get the same treatment with their own face graph.
- **Circle:** the answer is the coefficient of π, a whole number.
- **Regular polygons:** (n - 2)·180/n, only for n with a whole answer
  (3, 4, 5, 6, 8, 9, 10, 12).
- **Picks:** exactly one option is right, all options differ, as today.

## 4. Interaction beyond typing

| Interaction | Verdict | Why |
|---|---|---|
| Type a number | yes, the default | what Topic.vue does today |
| Pick among 4 figures or names | yes | types of angles, triangles, nets, symmetry |
| Tap a lattice point | **yes** | snaps to the nearest crossing; on a 320 px phone a cell is about 23 px, enough; arrow keys and a live region read back the kid's own point (prototype card 5) |
| Read coordinates | yes, as a pick of 4 pairs | |
| Estimate a length or an angle | yes, as a pick with far-apart options (30°, 60°, 120°, 160°) | an honest drawing makes it fair; a typed estimate with tolerance is fiddly to explain |
| Drag a protractor | no | fiddly on a phone, measuring is a paper skill |
| Draw a segment or a polygon on the grid | later, maybe | two taps per vertex work, but checking "any correct rectangle of area 12" needs a new answer type |
| Draw an axis of symmetry | no | pick among dashed candidate axes instead |
| Fold or spin in 3D | only as a reward or aid | never needed to answer, never printed |

A `place` task is the only new task kind. It needs `triesFor` = 3 and a
`samePoint` compare, and `tests.js` skips it (paper has no tap) unless the test
builder prints an empty grid with "Zaznacz punkt A = (3, -2)", which is a fine
paper task too.

## 5. Phases

1. **Plane figures, class 4-6.** New `{ fig }` token and `GeoFigure.vue` (SVG),
   `vertices()` and the shoelace and angle checks. Families: angle types (pick),
   angle pairs, triangle and quadrilateral angle sums, isosceles, triangle
   inequality, perimeter, area of the six figures. Ships as one new topic
   `geometry` with `FROM = 4` and kinds tagged 4 or 5, printable in the test
   builder. This alone covers most of what band 4-6 asks.
2. **Grid and circle parts.** The `place` kind and the grid figure (classes 6+,
   first quarter in 4-5), reading coordinates, distance along an axis; circle
   parts (pick); symmetry axes (count, pick).
3. **Solids, class 5-6.** Oblique SVG for cuboid and cube; volume, surface area,
   solids made of cuboids; recognise solids; count vertices, edges, faces; pick the
   cube net, with the CSS 3D fold after a right answer.
4. **Class 7-8.** Regular polygons, parallel-line angles, special triangles,
   circle circumference and area as multiples of π, lattice polygon area,
   Pythagoras on the grid (segment length), prisms and pyramids (surface area,
   volume, with Pythagoras inside), the "obróć" CSS 3D look for prisms and
   pyramids.
5. **Theory articles** (`src/data/theory.js`) reuse the same figures with no '?'.

## Open questions

1. **One topic or several?** One `geometry` topic with many kinds keeps the Play
   grid small; separate `angles`, `areas`, `solids` topics let a kid practise one
   family. Proposal: one topic in phase 1, split if it feels like a grab bag.
2. **π:** answers as a multiple of π only, or also π ≈ 3,14 at level 3 (answers
   then need two decimals and a rounding rule)?
3. **Coordinates in class 4-5:** 2026 puts the grid in band 4-6. Start it in class
   4 (first quarter only) or keep the 2017 order and start in class 6?
4. **Converse of Pythagoras / "is it a triangle":** both are yes/no picks.
   2017 excluded the converse; 2026 does not require it. Keep both?
5. **3D at all?** The CSS 3D fold costs nothing. Is a "look around" view wanted in
   class 7-8, or is the oblique drawing enough? three.js is not proposed.
6. **Measuring tasks:** accept that measuring with a ruler and protractor stays on
   paper, with the app only asking for estimates as picks?
7. **Paper:** should the test builder print an empty grid for "place a point" and
   figures for "construct" tasks (no answer box, just the drawing)?

## Decisions (2026-10-03, from the user)

1. One `geometry` topic to start; split later if it feels like a grab bag.
2. Circle answers both ways: a multiple of π on levels 1-2, π ≈ 3,14 on level 3.
3. Coordinates from class 4 (first quadrant; all four from class 5).
4. Keep the yes/no tasks: "can it be a triangle" and "is it right-angled".
5. Real 3D for solids, with three.js. It is not installed yet (the prototype
   took it from a CDN): add the npm package in the solids phase and load it
   only on the screens that draw a solid. The SVG drawing stays for print.
6. Measuring stays on paper, as estimates in the app; printing it can come later.
7. Printing grids and construction figures: later.
