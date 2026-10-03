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
