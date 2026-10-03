// The pictures on the topic articles (fractions, decimals, percents, powers,
// negative numbers, equations, the mean, Pythagoras), as pure data, the same
// way as opPictures.js: what a kid may pick, and what each picture shows.
// Their ranges join opPictures' tables, so settle() and allPicks() serve
// both; topicPictures.check.js tries every pick. No Vue in here.
import { LIMITS, DEFAULTS } from './opPictures.js'

const range = (n) => Array.from({ length: n }, (_, i) => i)
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
// a number after an operator: a negative one goes in brackets
const opd = (n) => (n < 0 ? ['(', n, ')'] : [n])

Object.assign(LIMITS, {
  // n of d, and the same scaled by k; the scaled bar stays at 24 parts or fewer
  fractions: { d: () => [2, 12], n: ({ d }) => [1, d], k: ({ d }) => [2, Math.floor(24 / d)] },
  // hundredths, from 0,01 to 0,99
  decimals: { h: () => [1, 99] },
  // p in fives (p5 × 5 %), of a base in twenties (b × 20), so the part is whole
  percents: { p5: () => [1, 20], b: () => [1, 10] },
  // b to the e, kept to 1000 at most
  powers: { b: () => [1, 10], e: ({ b }) => [1, b <= 3 ? 6 : b <= 5 ? 4 : 3] },
  // a + b on the line from −10 to 10
  negatives: { a: () => [-9, 9], b: ({ a }) => [Math.max(-9, -10 - a), Math.min(9, 10 - a)] },
  // a·x + b = c on a balance; c stays at 24 weights or fewer
  equations: { a: () => [1, 3], x: () => [1, 6], b: () => [0, 6] },
  // the mean of n numbers (the first n of v1..v5), each 1 to 10
  average: { n: () => [2, 5], v1: () => [1, 10], v2: () => [1, 10], v3: () => [1, 10], v4: () => [1, 10], v5: () => [1, 10] },
  // a whole-number right triangle, by index
  pythagoras: { i: () => [0, 4] },
})

Object.assign(DEFAULTS, {
  fractions: { d: 4, n: 3, k: 2 },
  decimals: { h: 37 },
  percents: { p5: 5, b: 4 },
  powers: { b: 2, e: 3 },
  negatives: { a: -3, b: 5 },
  equations: { a: 2, x: 4, b: 3 },
  average: { n: 4, v1: 4, v2: 7, v3: 10, v4: 3, v5: 6 },
  pythagoras: { i: 0 },
})

// n of d parts of a bar, and the same with every part cut in k
export function fractionsPicture({ d, n, k }) {
  return {
    bar: range(d).map((i) => i < n),
    scaled: range(d * k).map((i) => i < n * k),
    eq: [{ frac: [n, d] }, '=', { frac: [n * k, d * k] }],
    vars: { d, n, k, nk: n * k, dk: d * k },
  }
}

// h hundredths: a 10 × 10 square filled a column (a tenth) at a time
export function decimalsPicture({ h }) {
  return {
    // row-major cells; a cell is on when its column-first index is below h
    grid: range(100).map((i) => (i % 10) * 10 + Math.floor(i / 10) < h),
    eq: [h / 100, '=', { frac: [h, 100] }],
    vars: { h, tenths: Math.floor(h / 10), hundredths: h % 10 },
  }
}

// p % of base: p cells of a hundred, and the part of the base they stand for
export function percentsPicture({ p5, b }) {
  const p = p5 * 5
  const base = b * 20
  const part = (p * base) / 100
  const g = gcd(p, 100)
  return {
    grid: range(100).map((i) => i < p),
    eq: [{ pct: p }, { t: 'of' }, base, '=', part],
    frac: [{ pct: p }, '=', { frac: [p / g, 100 / g] }],
    vars: { p, base, part },
  }
}

// b^e as a product, and b² as a square of dots with its root
export function powersPicture({ b, e }) {
  const chain = range(e).flatMap((i) => (i ? ['·', b] : [b]))
  return {
    eq: e === 1 ? [{ pow: [b, e] }, '=', b] : [{ pow: [b, e] }, '=', ...chain, '=', b ** e],
    square: range(b * b),
    root: [{ root: b * b }, '=', b],
    vars: { b, e, value: b ** e, sq: b * b },
  }
}

// a + b as one jump on a line that always shows zero
export function negativesPicture({ a, b }) {
  const res = a + b
  const lo = Math.min(a, res, 0) - 1
  const hi = Math.max(a, res, 0) + 1
  const keys = [a, res, 0]
  return {
    eq: [a, '+', ...opd(b), '=', res],
    line: {
      lo,
      hi,
      // a long line names only the key numbers and the fives
      ticks: range(hi - lo + 1).map((i) => {
        const n = lo + i
        return { n, key: keys.includes(n), quiet: hi - lo > 12 && !keys.includes(n) && n % 5 !== 0 }
      }),
      start: a,
      end: res,
      jumps: [{ from: a, to: res, label: b < 0 ? `−${-b}` : `+${b}`, on: true }],
    },
    vars: { a, b, res },
  }
}

// a·x + b = c on a balance, solved in steps: 0 the balance, 1 take b from both
// pans, 2 split what is left into a equal parts, one for each x.
export const EQ_LAST_STEP = 2
export function equationsPicture({ a, x, b }, step) {
  const c = a * x + b
  return {
    left: { boxes: a, weights: step >= 1 ? 0 : b, taken: step >= 1 ? b : 0 },
    // the right pan's weights; from step 2 they are grouped, one group per box
    right: { weights: step >= 1 ? c - b : c, taken: step >= 1 ? b : 0, groups: step >= 2 ? a : 1 },
    eq: [
      [{ x: a }, ...(b ? ['+', b] : []), '=', c],
      [{ x: a }, '=', c - b],
      [{ x: 1 }, '=', x],
    ][step],
    vars: { a, x, b, c, cb: c - b },
  }
}

// the mean of n numbers: their bars, and the level they share out to
export function averagePicture(v) {
  const vals = [v.v1, v.v2, v.v3, v.v4, v.v5].slice(0, v.n)
  const sum = vals.reduce((s, x) => s + x, 0)
  const mean = sum / v.n
  // a mean that does not end in two places is shown as a fraction
  const exact = Math.abs(mean * 100 - Math.round(mean * 100)) < 1e-9
  const g = gcd(sum, v.n)
  return {
    vals,
    mean,
    eq: ['(', ...vals.flatMap((x, i) => (i ? ['+', x] : [x])), ')', ':', v.n, '=', sum, ':', v.n, '=', exact ? mean : { frac: [sum / g, v.n / g] }],
    vars: { n: v.n, sum },
  }
}

export const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25]]

// a right triangle with a square on each side: a² + b² = c²
export function pythagorasPicture({ i }) {
  const [a, b, c] = TRIPLES[i]
  return {
    a,
    b,
    c,
    eq: [{ pow: [a, 2] }, '+', { pow: [b, 2] }, '=', a * a, '+', b * b, '=', c * c, '=', { pow: [c, 2] }],
    vars: { a, b, c, aa: a * a, bb: b * b, cc: c * c },
  }
}

// ---------------------------------------------------------------------------
// Geometry, comparing and the order of operations. The figures go through
// geometry.js's layout(), so the checks measure them the way the game does.
// ---------------------------------------------------------------------------
Object.assign(LIMITS, {
  // any angle in tens (k × 10), and an angle on a straight line in tens
  angles: { k: () => [1, 35], a: () => [2, 16] },
  // two angles of a triangle in tens, and an isosceles base angle in fives
  triangles: { A: () => [2, 14], B: ({ A }) => [2, 16 - A], base: () => [6, 16] },
  // three segments: can they make a triangle?
  sides: { p: () => [1, 10], q: () => [1, 10], r: () => [1, 10] },
  // the five quadrilaterals, one at a time
  quads: { s: () => [0, 4] },
  // a rectangle's sides for its perimeter
  perimeter: { a: () => [1, 12], b: () => [1, 12] },
  // a rectangle counted in unit squares, and a triangle in its rectangle
  area: { a: () => [1, 10], b: () => [1, 8], ta: () => [2, 12], th: () => [1, 8] },
  // two numbers to compare, as tens and ones
  compare: { x: () => [0, 99], y: () => [0, 99] },
  // p + q × r, with or without the brackets
  order: { p: () => [1, 9], q: () => [1, 9], r: () => [2, 9] },
})

Object.assign(DEFAULTS, {
  angles: { k: 13, a: 13 },
  triangles: { A: 5, B: 6, base: 14 },
  sides: { p: 3, q: 4, r: 6 },
  quads: { s: 0 },
  perimeter: { a: 6, b: 4 },
  area: { a: 6, b: 4, ta: 8, th: 5 },
  compare: { x: 47, y: 52 },
  order: { p: 2, q: 3, r: 4 },
})

export function anglesPicture({ k, a }) {
  const deg = k * 10
  const line = a * 10
  return {
    deg,
    angle: { shape: 'angle', deg },
    line: { shape: 'line', angles: [line, 180 - line] },
    cross: { shape: 'cross', shown: line, ask: 'opposite', other: line },
    lineEq: [line, '+', 180 - line, '=', 180],
    vars: { deg, a: line, b: 180 - line },
  }
}

export function trianglesPicture({ A, B, base }) {
  const [a, b] = [A * 10, B * 10]
  const c = 180 - a - b
  const bs = base * 5
  const top = 180 - 2 * bs
  return {
    sum: { shape: 'triangle', angles: { A: a, B: b, C: c } },
    sumEq: [a, '+', b, '+', c, '=', 180],
    iso: { shape: 'triangle', iso: true, angles: { A: bs, B: bs, C: top } },
    isoEq: [bs, '+', bs, '+', top, '=', 180],
    vars: { a, b, c, bs, top },
  }
}

// whether three segments make a triangle: the longest against the other two
export function sidesPicture({ p, q, r }) {
  const [s1, s2, big] = [p, q, r].sort((x, y) => x - y)
  const sum = s1 + s2
  const ok = sum > big
  return {
    bars: { shape: 'bars', sides: [p, q, r] },
    // the triangle itself when there is one, its longest side along the bottom
    tri: ok ? { shape: 'tri3', a: s1, b: s2, c: big } : null,
    eq: [s1, '+', s2, sum > big ? '>' : sum < big ? '<' : '=', big],
    ok,
    vars: { s1, s2, big, sum },
  }
}

// the five quadrilaterals, drawn bare (no numbers), with what makes each one
const QUADS = [
  { name: 'square', fig: { shape: 'rect', a: 5, b: 5, bare: true } },
  { name: 'rect', fig: { shape: 'rect', a: 7, b: 4, bare: true } },
  { name: 'rhombus', fig: { shape: 'rhombus', e: 8, f: 5, bare: true } },
  { name: 'para', fig: { shape: 'para', a: 7, h: 3, o: 2, bare: true } },
  { name: 'trap', fig: { shape: 'trap', a: 9, b: 4, h: 3, o: 2, bare: true } },
]
export const quadsPicture = ({ s }) => QUADS[s]

export function perimeterPicture({ a, b }) {
  return {
    fig: { shape: 'rect', a, b },
    eq: [a, '+', b, '+', a, '+', b, '=', 2, '·', '(', a, '+', b, ')', '=', 2 * (a + b)],
    vars: { a, b, p: 2 * (a + b) },
  }
}

export function areaPicture({ a, b, ta, th }) {
  return {
    cells: range(a * b),
    rectEq: [a, '·', b, '=', a * b],
    triEq: [ta, '·', th, ':', 2, '=', (ta * th) / 2],
    vars: { a, b, ab: a * b, ta, th, half: String((ta * th) / 2).replace('.', ','), whole: ta * th },
  }
}

// a number as tens rods and ones cubes
const place = (n) => ({ n, tens: Math.floor(n / 10), ones: n % 10 })
export function comparePicture({ x, y }) {
  const sign = x < y ? '<' : x > y ? '>' : '='
  const left = place(x)
  const right = place(y)
  // what decides: the tens when they differ, else the ones, else they are equal
  const by = left.tens !== right.tens ? 'tens' : left.ones !== right.ones ? 'ones' : 'same'
  return { left, right, sign, eq: [x, sign, y], by }
}

export function orderPicture({ p, q, r }, brackets) {
  return brackets
    ? { eq: ['(', p, '+', q, ')', '×', r, '=', p + q, '×', r, '=', (p + q) * r], first: 'add' }
    : { eq: [p, '+', q, '×', r, '=', p, '+', q * r, '=', p + q * r], first: 'mul' }
}
