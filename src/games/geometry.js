// Geometry for classes 4 to 8, see docs/superpowers/specs/2026-10-03-geometry-design.md.
// No Vue in here, so it runs under plain node (see geometry.check.js).
//
// A figure is one token in a task's `parts`: { fig: { shape, ... } }. It holds
// the numbers the kid reads (and a few drawing choices, like where a
// triangle's top sits); a '?' may stand in it where a number would.
// layout(fig) turns it into points in centimetres, y up. GeoFigure.vue draws
// exactly that, and geometry.check.js measures exactly that, so a picture can
// never contradict its numbers: every labelled length and angle is measured
// back off the points it is drawn from.
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'
import { shuffle } from './generators.js'

const one = (list) => list[rnd(0, list.length - 1)]
const rad = (d) => (d * Math.PI) / 180
const pol = (len, deg, from = [0, 0]) => [from[0] + len * Math.cos(rad(deg)), from[1] + len * Math.sin(rad(deg))]
const num = (x) => typeof x === 'number'

// the interior angles of a polygon listed counter-clockwise: at each corner,
// counter-clockwise from the edge to the next corner to the edge to the previous
const corners = (names) =>
  names.map((at, i) => ({ at, from: names[(i + 1) % names.length], to: names[(i - 1 + names.length) % names.length] }))

// the missing one of `values` (numbers, '?' or null) when they add up to `sum`
const rest = (values, sum) => sum - values.filter(num).reduce((s, v) => s + v, 0)

// A layout is
//   pts     { name: [x, y] } in cm
//   poly    corner names counter-clockwise, the outline, or null
//   segs    [[a, b, dashed]] lines drawn besides the outline
//   arcs    [{ at, from, to, label }]: the angle counter-clockwise from ray
//           at->from to ray at->to; label a number, '?' or null (no number)
//   edges   [{ a, b, label, t, inner }]: a length label at fraction t of a->b,
//           inside the figure for a height (`inner`), outside otherwise
//   ticks   [[a, b]] equal-length marks; rights [{ at, from, to }] square marks
const LAYOUT = {
  // one angle, for "what kind of angle is it"
  angle: ({ deg }) => ({
    pts: { O: [0, 0], P: pol(4, 0), Q: pol(4, deg) },
    segs: [['O', 'P'], ['O', 'Q']],
    arcs: [{ at: 'O', from: 'P', to: 'Q', label: null }],
  }),

  // two angles on a straight line
  line: ({ angles: [a, b] }) => {
    const q = num(a) ? a : 180 - b
    return {
      pts: { O: [0, 0], R: pol(4, 0), L: pol(4, 180), Q: pol(4, q) },
      segs: [['L', 'R'], ['O', 'Q']],
      arcs: [{ at: 'O', from: 'R', to: 'Q', label: a }, { at: 'O', from: 'Q', to: 'L', label: b }],
    }
  },

  // two crossing lines; `shown` is labelled, the '?' is opposite it or next to it
  cross: ({ shown, ask }) => ({
    pts: { O: [0, 0], P0: pol(4, 0), P1: pol(4, shown), P2: pol(4, 180), P3: pol(4, 180 + shown) },
    segs: [['P0', 'P2'], ['P1', 'P3']],
    arcs: [
      { at: 'O', from: 'P0', to: 'P1', label: shown },
      ask === 'opposite' ? { at: 'O', from: 'P2', to: 'P3', label: '?' } : { at: 'O', from: 'P1', to: 'P2', label: '?' },
    ],
  }),

  // three angles around a point
  around: ({ angles }) => {
    const [a, b] = angles.map((v) => (num(v) ? v : rest(angles, 360)))
    return {
      pts: { O: [0, 0], R0: pol(4, 0), R1: pol(4, a), R2: pol(4, a + b) },
      segs: [['O', 'R0'], ['O', 'R1'], ['O', 'R2']],
      arcs: [
        { at: 'O', from: 'R0', to: 'R1', label: angles[0] },
        { at: 'O', from: 'R1', to: 'R2', label: angles[1] },
        { at: 'O', from: 'R2', to: 'R0', label: angles[2] },
      ],
    }
  },

  // A triangle drawn from its angles on a base of 6 cm. `iso`: the angles at A
  // and B are equal and the arms AC and BC get equal-length marks.
  triangle: ({ angles, iso }) => {
    let { A, B, C } = Object.fromEntries(Object.entries(angles).map(([k, v]) => [k, num(v) ? v : null]))
    if (iso) {
      if (A === null && B !== null) A = B
      if (B === null && A !== null) B = A
      if (A === null && B === null) A = B = (180 - C) / 2
    }
    if (A === null) A = 180 - B - C
    if (B === null) B = 180 - A - C
    if (C === null) C = 180 - A - B
    const ac = (6 * Math.sin(rad(B))) / Math.sin(rad(C))
    return {
      pts: { A: [0, 0], B: [6, 0], C: pol(ac, A) },
      poly: ['A', 'B', 'C'],
      // a corner with no number gets no arc either
      arcs: corners(['A', 'B', 'C']).map((c) => ({ ...c, label: angles[c.at] ?? null })).filter((a) => a.label !== null),
      ticks: iso ? [['A', 'C'], ['B', 'C']] : [],
    }
  },

  // A quadrilateral drawn from its four angles. Walking A B C D A the heading
  // turns by 180 minus each angle; AB is 6 cm, BC is tried in steps and CD and
  // DA solved so the outline closes, keeping the most even-sided result.
  quad: ({ angles }) => {
    const [, B, C, D] = angles.map((v) => (num(v) ? v : rest(angles, 360)))
    const heads = [0, 180 - B, 360 - B - C, 540 - B - C - D].map((d) => pol(1, d))
    let best = null
    for (let s = 2; s <= 10; s += 0.25) {
      // s*e1 + u*e2 + v*e3 = -6*e0, for u and v (Cramer)
      const [e1, e2, e3] = heads.slice(1)
      const rx = -6 - s * e1[0]
      const ry = -s * e1[1]
      const det = e2[0] * e3[1] - e3[0] * e2[1]
      const u = (rx * e3[1] - e3[0] * ry) / det
      const v = (e2[0] * ry - rx * e2[1]) / det
      if (!(u > 0.5 && v > 0.5)) continue
      const sides = [6, s, u, v]
      const spread = Math.max(...sides) / Math.min(...sides)
      if (!best || spread < best.spread) best = { spread, s, u }
    }
    const pB = [6, 0]
    const pC = pol(best.s, 180 - B, pB)
    const pD = pol(best.u, 360 - B - C, pC)
    return {
      pts: { A: [0, 0], B: pB, C: pC, D: pD },
      poly: ['A', 'B', 'C', 'D'],
      arcs: corners(['A', 'B', 'C', 'D']).map((c, i) => ({ ...c, label: angles[i] })),
    }
  },

  // three segments side by side, for "can they make a triangle"
  bars: ({ sides }) => {
    const gap = Math.max(...sides) / 5
    const pts = {}
    sides.forEach((s, i) => {
      pts[`p${i}`] = [0, -i * gap]
      pts[`q${i}`] = [s, -i * gap]
    })
    return {
      pts,
      segs: sides.map((_, i) => [`p${i}`, `q${i}`]),
      edges: sides.map((s, i) => ({ a: `p${i}`, b: `q${i}`, label: s })),
    }
  },

  // a rectangle; a square is one with a = b, and gets equal-length marks
  rect: ({ a, b, bare }) => {
    const square = a === b
    return {
      pts: { A: [0, 0], B: [a, 0], C: [a, b], D: [0, b] },
      poly: ['A', 'B', 'C', 'D'],
      edges: bare ? [] : square ? [{ a: 'A', b: 'B', label: a }] : [{ a: 'A', b: 'B', label: a }, { a: 'B', b: 'C', label: b }],
      ticks: square ? [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']] : [],
      rights: corners(['A', 'B', 'C', 'D']).filter((_, i) => bare || i === 0),
    }
  },

  // a triangle from its three sides, c along the bottom
  tri3: ({ a, b, c }) => {
    const x = (b * b + c * c - a * a) / (2 * c)
    return {
      pts: { A: [0, 0], B: [c, 0], C: [x, Math.sqrt(b * b - x * x)] },
      poly: ['A', 'B', 'C'],
      edges: [{ a: 'A', b: 'B', label: c }, { a: 'B', b: 'C', label: a }, { a: 'C', b: 'A', label: b }],
    }
  },

  // a triangle by base and height; the top sits `o` cm along the base
  triH: ({ a, h, o }) => ({
    pts: { A: [0, 0], B: [a, 0], C: [o, h], F: [o, 0] },
    poly: ['A', 'B', 'C'],
    segs: [['C', 'F', true]],
    edges: [{ a: 'A', b: 'B', label: a }, { a: 'F', b: 'C', label: h, inner: true }],
    rights: [{ at: 'F', from: 'B', to: 'C' }],
  }),

  // a parallelogram by base and height, leaning `o` cm
  para: ({ a, h, o, bare }) => ({
    pts: { A: [0, 0], B: [a, 0], C: [a + o, h], D: [o, h], F: [o, 0] },
    poly: ['A', 'B', 'C', 'D'],
    segs: bare ? [] : [['D', 'F', true]],
    edges: bare ? [] : [{ a: 'A', b: 'B', label: a }, { a: 'F', b: 'D', label: h, inner: true }],
    rights: bare ? [] : [{ at: 'F', from: 'B', to: 'D' }],
  }),

  // a rhombus by its diagonals, e across and f up
  rhombus: ({ e, f, bare }) => ({
    pts: { L: [-e / 2, 0], Bt: [0, -f / 2], R: [e / 2, 0], T: [0, f / 2] },
    poly: ['L', 'Bt', 'R', 'T'],
    segs: bare ? [] : [['L', 'R', true], ['Bt', 'T', true]],
    edges: bare ? [] : [{ a: 'L', b: 'R', label: e, t: 0.25 }, { a: 'Bt', b: 'T', label: f, t: 0.75 }],
    ticks: [['L', 'Bt'], ['Bt', 'R'], ['R', 'T'], ['T', 'L']],
  }),

  // a trapezoid: bases a (bottom) and b (top), height h, the top `o` cm in
  trap: ({ a, b, h, o, bare }) => ({
    pts: { A: [0, 0], B: [a, 0], C: [o + b, h], D: [o, h], F: [o, 0] },
    poly: ['A', 'B', 'C', 'D'],
    segs: bare ? [] : [['D', 'F', true]],
    edges: bare ? [] : [{ a: 'A', b: 'B', label: a }, { a: 'D', b: 'C', label: b }, { a: 'F', b: 'D', label: h, inner: true }],
    rights: bare ? [] : [{ at: 'F', from: 'B', to: 'D' }],
  }),
}

export function layout(fig) {
  return { poly: null, segs: [], arcs: [], edges: [], ticks: [], rights: [], ...LAYOUT[fig.shape](fig) }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
const number = (prompt, fig, answer, unit) => ({ kind: 'number', prompt, parts: [{ fig }], answer, unit })

// a pick among words (angle kinds, figure names); `names` holds the right one
function wordPick(prompt, fig, right, names) {
  const options = shuffle(names)
  return { kind: 'pick', prompt, parts: [{ fig }], options: options.map((n) => [{ t: `geo_${n}` }]), answer: options.indexOf(right) }
}

// the longest side a level draws; later classes a little longer
const lenTop = (level, year) => ({ 1: 10, 2: 15, 3: 20 })[level] + 2 * year
// angles in whole tens at level 1, fives at level 2, any degree at level 3
function deg(lo, hi, level) {
  const step = { 1: 10, 2: 5, 3: 1 }[level]
  return step * rnd(Math.ceil(lo / step), Math.floor(hi / step))
}

export const ANGLE_KINDS = ['acute', 'right', 'obtuse', 'straight', 'reflex']
// the kind of an angle in degrees, for the pick and its check
export const angleKind = (d) => (d < 90 ? 'acute' : d === 90 ? 'right' : d < 180 ? 'obtuse' : d === 180 ? 'straight' : 'reflex')

export const QUAD_NAMES = ['square', 'rect', 'rhombus', 'para', 'trap']

// Each kind: [the class that meets it first, make(level, year)]. Class 4 has
// angle kinds, the five quadrilaterals, perimeter and the rectangle's area;
// class 5 the angle sums, the isosceles triangle, the triangle inequality and
// the other areas (2017 order inside the 2026 band 4-6).
export const GEOMETRY = {
  angleType: [4, (level) => {
    const kinds = ANGLE_KINDS.slice(0, { 1: 3, 2: 4, 3: 5 }[level])
    const kind = one(kinds)
    const d = { acute: deg(20, 80, level), right: 90, obtuse: deg(100, 170, level), straight: 180, reflex: deg(200, 340, level) }[kind]
    // four tiles at most: on level 3 the right kind and three of the others
    const names = kinds.length > 4 ? [kind, ...shuffle(kinds.filter((k) => k !== kind)).slice(0, 3)] : kinds
    return wordPick('geoAngleType', { shape: 'angle', deg: d }, kind, names)
  }],

  quadName: [4, () => {
    const name = one(QUAD_NAMES)
    const fig = {
      square: () => ({ shape: 'rect', a: 5, b: 5 }),
      rect: () => ({ shape: 'rect', a: rnd(6, 9), b: rnd(3, 4) }),
      rhombus: () => ({ shape: 'rhombus', e: rnd(7, 9), f: rnd(3, 5) }),
      para: () => ({ shape: 'para', a: rnd(6, 8), h: rnd(3, 4), o: rnd(2, 3) }),
      trap: () => {
        const a = rnd(8, 10)
        const b = rnd(3, 5)
        return { shape: 'trap', a, b, h: rnd(3, 4), o: rnd(1, a - b - 1) }
      },
    }[name]()
    const names = [name, ...shuffle(QUAD_NAMES.filter((n) => n !== name)).slice(0, 3)]
    return wordPick('geoQuadName', { ...fig, bare: true }, name, names)
  }],

  perimeter: [4, (level, year) => {
    const top = lenTop(level, year)
    const shape = one(['rect', 'square', 'tri3'])
    if (shape === 'square') {
      const a = rnd(2, top)
      return number('geoPerimeter', { shape: 'rect', a, b: a }, 4 * a, 'cm')
    }
    if (shape === 'rect') {
      const a = rnd(3, top)
      let b
      do b = rnd(2, top)
      while (b === a)
      return number('geoPerimeter', { shape: 'rect', a, b }, 2 * (a + b), 'cm')
    }
    // a triangle that is not too flat: c well inside |a - b| .. a + b
    for (;;) {
      const a = rnd(3, top)
      const b = rnd(3, top)
      const c = rnd(Math.abs(a - b) + 2, a + b - 2)
      if (c >= 3 && c <= top) return number('geoPerimeter', { shape: 'tri3', a, b, c }, a + b + c, 'cm')
    }
  }],

  rectArea: [4, (level, year) => {
    const top = Math.min(lenTop(level, year), 12 + 2 * year)
    const a = rnd(2, top)
    const b = rnd(0, 2) ? rnd(2, top) : a
    return number('geoArea', { shape: 'rect', a, b }, a * b, 'cm²')
  }],

  anglePair: [5, (level) => {
    const shape = one(['line', 'cross', 'around'])
    if (shape === 'line') {
      const a = deg(20, 160, level)
      return rnd(0, 1)
        ? number('geoAngle', { shape, angles: [a, '?'] }, 180 - a, '°')
        : number('geoAngle', { shape, angles: ['?', 180 - a] }, a, '°')
    }
    if (shape === 'cross') {
      let a
      do a = deg(20, 160, level)
      while (a === 90)
      const ask = one(['opposite', 'next'])
      return number('geoAngle', { shape, shown: a, ask }, ask === 'opposite' ? a : 180 - a, '°')
    }
    for (;;) {
      const a = deg(40, 200, level)
      const b = deg(40, 200, level)
      const c = 360 - a - b
      if (c < 40) continue
      const angles = [a, b, c]
      const hide = rnd(0, 2)
      return number('geoAngle', { shape, angles: angles.map((v, i) => (i === hide ? '?' : v)) }, angles[hide], '°')
    }
  }],

  triangleSum: [5, (level) => {
    for (;;) {
      const A = deg(25, 120, level)
      const B = deg(25, 120, level)
      const C = 180 - A - B
      if (C < 25) continue
      const angles = { A, B, C }
      const hide = one(['A', 'B', 'C'])
      return number('geoAngle', { shape: 'triangle', angles: { ...angles, [hide]: '?' } }, angles[hide], '°')
    }
  }],

  // the base angles are equal: from one base angle find the top, or back
  isosceles: [5, (level) => {
    for (;;) {
      const base = deg(30, 80, level)
      const top = 180 - 2 * base
      if (top < 20) continue
      return rnd(0, 1)
        ? number('geoAngle', { shape: 'triangle', iso: true, angles: { A: base, B: null, C: '?' } }, top, '°')
        : number('geoAngle', { shape: 'triangle', iso: true, angles: { A: '?', B: null, C: top } }, base, '°')
    }
  }],

  quadSum: [5, (level) => {
    for (;;) {
      const angles = [deg(60, 140, level), deg(60, 140, level), deg(60, 140, level)]
      const d = 360 - angles[0] - angles[1] - angles[2]
      if (d < 50 || d > 160) continue
      angles.push(d)
      const hide = rnd(0, 3)
      return number('geoAngle', { shape: 'quad', angles: angles.map((v, i) => (i === hide ? '?' : v)) }, angles[hide], '°')
    }
  }],

  // "tak" always first, as in Pythagoras: a yes/no pair reads wrong shuffled
  canTriangle: [5, (level, year) => {
    const top = lenTop(level, year)
    const a = rnd(2, top)
    const b = rnd(2, top)
    const yes = rnd(0, 1) === 1
    // a "no" may be a tie (a + b = c), the trap a flat triangle sets
    const c = yes ? rnd(Math.abs(a - b) + 1, a + b - 1) : rnd(a + b, a + b + 4)
    return {
      kind: 'pick',
      prompt: 'geoCanTriangle',
      parts: [{ fig: { shape: 'bars', sides: shuffle([a, b, c]) } }],
      options: [[{ t: 'yes' }], [{ t: 'no' }]],
      answer: yes ? 0 : 1,
    }
  }],

  // the other areas, each built so the answer is whole
  area: [5, (level, year) => {
    const top = lenTop(level, year)
    const shape = one(['triH', 'para', 'rhombus', 'trap'])
    for (;;) {
      const a = rnd(4, top)
      const h = rnd(2, Math.min(top, 12))
      if (shape === 'triH' && (a * h) % 2 === 0) return number('geoArea', { shape, a, h, o: rnd(1, a - 1) }, (a * h) / 2, 'cm²')
      if (shape === 'para') return number('geoArea', { shape, a, h, o: rnd(1, Math.min(4, a - 1)) }, a * h, 'cm²')
      if (shape === 'rhombus' && (a * h) % 2 === 0 && a !== h) return number('geoArea', { shape, e: a, f: h }, (a * h) / 2, 'cm²')
      if (shape === 'trap') {
        const b = rnd(2, a - 1)
        if (((a + b) * h) % 2 === 0) return number('geoArea', { shape, a, b, h, o: rnd(0, a - b) }, ((a + b) * h) / 2, 'cm²')
      }
    }
  }],
}
