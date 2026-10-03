// Pure task generators for the topic games of classes 4 to 8. No Vue in here,
// so this file runs under plain node (see topics.check.js).
//
// A task is plain data. `parts` is what the kid reads, as a list of tokens that
// MathParts.vue draws: numbers, the operator strings '=' '+' '−' '×' '·' '÷', the
// slot '?', brackets, and { t } { frac } { pow } { root } { pct } { triangle }
// { mean } { x }. A '?' may also sit inside a frac, pow, pct, triangle or mean.
// A task with an { x } has no '?': its prompt asks for x.
//   { kind: 'number', parts, answer }                 one '?', typed
//   { kind: 'pick', prompt, parts, options, answer }  answer indexes options
// Every task also carries `type`, the name of the kind that made it.
// Decimals are built as whole hundredths and divided by 100 at the last moment,
// so no task ever carries a 0.30000000000000004.
//
// The class decides which kinds a topic has (each kind names the class that
// meets it first, after the curriculum) and, with the level, how big the
// numbers get. `year` is how many years the class has had the topic: 0 in the
// class that meets it. See docs/superpowers/specs/2026-10-03-topics-by-class-design.md.
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'
import { TOPICS, FROM } from '../data/classes.js'
import { shuffle } from './generators.js'

export { TOPICS }
export const LEVELS = [1, 2, 3]

const one = (list) => list[rnd(0, list.length - 1)]
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
const lcm = (a, b) => (a * b) / gcd(a, b)
const OF = { t: 'of' }

// a typed answer: comma or dot, spaces around it; null when it is not a number
export function parseAnswer(text) {
  const s = String(text ?? '').trim().replace(',', '.').replace(/^−/, '-')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null
}

// equal to two decimal places, the most any answer has
export const sameNumber = (a, b) => Math.round(a * 100) === Math.round(b * 100)

// How many wrong answers end a task. A pick of N tiles gets N - 1: after that
// the one tile left would be a free win. A typed answer keeps the usual three.
export const triesFor = (task) => (task.kind === 'pick' ? task.options.length - 1 : 3)

const number = (parts, answer) => ({ kind: 'number', parts, answer })

// `right` and every one of `wrongs` is { parts, value }, all values different
function pick(prompt, parts, right, wrongs) {
  const options = shuffle([right, ...wrongs])
  return { kind: 'pick', prompt, parts, options: options.map((o) => o.parts), answer: options.indexOf(right) }
}

// `count` results of make() whose values differ from each other and from `taken`
function distinct(count, make, taken = []) {
  const out = []
  // ponytail: rejection sampling. Every caller draws from a pool several times
  // `count`; topics.check.js proves it by running each one thousands of times.
  while (out.length < count) {
    const o = make()
    if (![...taken, ...out].some((p) => Math.abs(p.value - o.value) < 1e-9)) out.push(o)
  }
  return out
}

const biggest = (options) => options.reduce((p, q) => (q.value > p.value ? q : p))

// ---------------------------------------------------------------------------
// Fractions, from class 4
// ---------------------------------------------------------------------------
const FRAC_MAX = { 1: 6, 2: 10, 3: 12 } // the largest denominator in lowest terms
const FRAC_TIMES = { 1: 3, 2: 5, 3: 6 } // the most an equal fraction is scaled by

// the largest denominator in lowest terms grows by one a year
export const fracMax = (level, year) => FRAC_MAX[level] + year
// the largest denominator any fraction task shows
export const fracTop = (level, year) => fracMax(level, year) * FRAC_TIMES[level]

const fracOpt = (n, d) => ({ parts: [{ frac: [n, d] }], value: n / d })

// a proper fraction in lowest terms
function properFrac(maxD) {
  for (;;) {
    const d = rnd(2, maxD)
    const n = rnd(1, d - 1)
    if (gcd(n, d) === 1) return [n, d]
  }
}

const FRACTIONS = {
  // expand or reduce; the unknown is always a numerator
  equal: [4, (level, year) => {
    const [n, d] = properFrac(fracMax(level, year))
    const k = rnd(2, FRAC_TIMES[level])
    return rnd(0, 1)
      ? number([{ frac: [n, d] }, '=', { frac: ['?', d * k] }], n * k)
      : number([{ frac: [n * k, d * k] }, '=', { frac: ['?', d] }], n)
  }],

  // one denominator, and the sum stays a proper fraction
  same: [4, (level, year) => {
    const d = rnd(3, fracMax(level, year))
    const a = rnd(1, d - 2)
    const b = rnd(1, d - 1 - a)
    return rnd(0, 1)
      ? number([{ frac: [a, d] }, '+', { frac: [b, d] }, '=', { frac: ['?', d] }], a + b)
      : number([{ frac: [a + b, d] }, '−', { frac: [b, d] }, '=', { frac: ['?', d] }], a)
  }],

  pickEqual: [4, (level, year) => {
    const maxD = fracMax(level, year)
    const [n, d] = properFrac(maxD)
    const k = rnd(2, FRAC_TIMES[level])
    const right = fracOpt(n * k, d * k)
    const wrongs = distinct(3, () => {
      const [x, y] = properFrac(maxD)
      const j = rnd(1, FRAC_TIMES[level])
      return fracOpt(x * j, y * j)
    }, [right])
    return pick('topicPickEqual', [{ frac: [n, d] }], right, wrongs)
  }],

  // One shared denominator, so only the numerators are compared. Any
  // denominators once the class has met common denominators (class 5), at
  // level 3. Three numerators need d >= 4.
  pickBiggest: [4, (level, year) => {
    const maxD = fracMax(level, year)
    let options
    if (level < 3 || year === 0) {
      const d = rnd(4, maxD)
      options = distinct(3, () => fracOpt(rnd(1, d - 1), d))
    } else {
      options = distinct(3, () => fracOpt(...properFrac(maxD)))
    }
    const right = biggest(options)
    return pick('topicPickBiggest', [], right, options.filter((o) => o !== right))
  }],

  // a fraction of a number it divides: 3/4 z 20
  of: [5, (level, year) => {
    const [n, d] = properFrac(fracMax(level, year))
    const m = rnd(2, level === 1 ? 5 : 10) // from 2: a whole of one denominator is no task
    return number([{ frac: [n, d] }, OF, d * m, '=', '?'], n * m)
  }],

  // Two denominators: in class 5 one divides the other (1/4 + 3/8), from class
  // 6 any pair. The answer is over their common denominator and may be
  // improper.
  unlike: [5, (level, year) => {
    const maxD = fracMax(level, year)
    for (;;) {
      const b = rnd(2, maxD)
      const d = rnd(2, maxD)
      const l = lcm(b, d)
      if (b === d || l > fracTop(level, year) || (year < 2 && l !== Math.max(b, d))) continue
      const a = rnd(1, b - 1)
      const c = rnd(1, d - 1)
      return number([{ frac: [a, b] }, '+', { frac: [c, d] }, '=', { frac: ['?', l] }], (a * l) / b + (c * l) / d)
    }
  }],

  // a fraction times a fraction, unreduced: 2/3 · 4/5 = ?/15
  times: [6, (level, year) => {
    for (;;) {
      const [a, b] = properFrac(fracMax(level, year))
      const [c, d] = properFrac(fracMax(level, year))
      if (b * d <= fracTop(level, year)) {
        return number([{ frac: [a, b] }, '·', { frac: [c, d] }, '=', { frac: ['?', b * d] }], a * c)
      }
    }
  }],
}

// ---------------------------------------------------------------------------
// Decimals, from class 5. Everything is counted in hundredths until it is shown.
// ---------------------------------------------------------------------------
const dec = (hundredths) => hundredths / 100
const decOpt = (h) => ({ parts: [dec(h)], value: dec(h) })

// An operand, in hundredths: tenths below 1, tenths below 10, hundredths below
// 10. Later classes get one place more in front: level 1 from the second year,
// the others from the third.
function decOperand(level, year) {
  const up = year >= (level === 1 ? 1 : 2) ? 10 : 1
  if (level === 1) return rnd(1, 9 * up) * 10
  if (level === 2) return rnd(1, 99 * up) * 10
  return rnd(1, 999 * up)
}

// denominators that land on a level's number of decimal places
const DEC_DENOMS = { 1: [10], 2: [2, 5, 10], 3: [4, 20, 25, 50, 100] }

const DECIMALS = {
  add: [5, (level, year) => {
    const a = decOperand(level, year)
    const b = decOperand(level, year)
    return number([dec(a), '+', dec(b), '=', '?'], dec(a + b))
  }],

  sub: [5, (level, year) => {
    const x = decOperand(level, year)
    const y = decOperand(level, year)
    const [hi, lo] = x > y ? [x, y] : [y, x]
    return number([dec(hi), '−', dec(lo), '=', '?'], dec(hi - lo))
  }],

  times: [5, (level, year) => {
    const a = decOperand(level, year)
    const k = rnd(2, 9)
    return number([dec(a), '×', k, '=', '?'], dec(a * k))
  }],

  fromFrac: [5, (level) => {
    const d = one(DEC_DENOMS[level])
    const n = rnd(1, d - 1)
    return number([{ frac: [n, d] }, '=', '?'], dec((n * 100) / d))
  }],

  // Level 1 compares tenths from anywhere below 1. Above it the three sit
  // close to one shared number, in tenths at level 2 and hundredths at level
  // 3, so the places have to be read, not just the first digit.
  pickBiggest: [5, (level) => {
    let options
    if (level === 1) {
      options = distinct(3, () => decOpt(rnd(1, 9) * 10))
    } else {
      const step = level === 2 ? 10 : 1
      const base = (level === 2 ? rnd(10, 89) : rnd(10, 98)) * 10
      options = distinct(3, () => decOpt(base + rnd(-9, 9) * step))
    }
    const right = biggest(options)
    return pick('topicPickBiggest', [], right, options.filter((o) => o !== right))
  }],

  // times or divided by 10 or 100; a division is built from its answer
  shift: [6, (level, year) => {
    const k = one([10, 100])
    const a = decOperand(level, year)
    return rnd(0, 1)
      ? number([dec(a), '×', k, '=', '?'], dec(a * k))
      : number([dec(a * k), '÷', k, '=', '?'], dec(a))
  }],

  // divided by a digit, built from its answer so it always comes out
  divide: [6, (level, year) => {
    const q = decOperand(level, year)
    const k = rnd(2, 9)
    return number([dec(q * k), '÷', k, '=', '?'], dec(q))
  }],

  // tenths times tenths: hundredths
  decTimes: [7, (level) => {
    const a = level === 1 ? rnd(1, 9) : rnd(11, 99)
    const b = level === 3 ? rnd(11, 99) : rnd(1, 9)
    return number([dec(a * 10), '×', dec(b * 10), '=', '?'], dec(a * b))
  }],
}

// ---------------------------------------------------------------------------
// Percents, from class 6
// ---------------------------------------------------------------------------
const PCTS = {
  1: [10, 25, 50, 100],
  2: [10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 75],
  3: Array.from({ length: 19 }, (_, i) => (i + 1) * 5), // 5, 10 ... 95
}
// denominators whose fractions are whole percentages
const PCT_DENOMS = { 1: [2, 4, 10], 2: [2, 4, 5, 10, 20], 3: [4, 5, 20, 25, 50] }

const pctOpt = (p) => ({ parts: [{ pct: p }], value: p / 100 })

// p% and a base that makes p% of it a whole number; bases grow every year
function pctOfBase(level, year) {
  const p = one(PCTS[level])
  const base = (100 / gcd(p, 100)) * rnd(1, 10 * (year + 1))
  return [p, base, (p * base) / 100]
}

const PERCENTS = {
  of: [6, (level, year) => {
    const [p, base, part] = pctOfBase(level, year)
    return number([{ pct: p }, OF, base, '=', '?'], part)
  }],

  fromFrac: [6, (level) => {
    const d = one(PCT_DENOMS[level])
    const n = rnd(1, d - 1)
    return number([{ frac: [n, d] }, '=', { pct: '?' }], (n * 100) / d)
  }],

  // A decimal, and which percentage it is. The wrong ones are the slips kids
  // make: a place off, the complement, a near miss.
  pickEqual: [6, (level) => {
    const p = one(PCTS[level])
    const slips = [p / 10, p * 10, 100 - p, p + 5, p + 10, p * 2]
    const wrongs = shuffle([...new Set(slips.filter((q) => Number.isInteger(q) && q > 0 && q !== p))])
      .slice(0, 3)
      .map(pctOpt)
    return pick('topicPickEqual', [p / 100], pctOpt(p), wrongs)
  }],

  // what percent of the base the part is
  which: [7, (level, year) => {
    const [p, base, part] = pctOfBase(level, year)
    return number([{ pct: '?' }, OF, base, '=', part], p)
  }],

  // the whole, from a part and its percent
  whole: [7, (level, year) => {
    const [p, base, part] = pctOfBase(level, year)
    return number([{ pct: p }, OF, '?', '=', part], base)
  }],
}

// ---------------------------------------------------------------------------
// Powers, from class 4: squares and cubes there, roots and the rules in 7
// ---------------------------------------------------------------------------
const powOpt = (b, e) => ({ parts: [{ pow: [b, e] }], value: b ** e })
const power = (b, e) => number([{ pow: [b, e] }, '=', '?'], b ** e)

// the biggest base that gets squared
const squareTop = (level, year) => ({ 1: 10, 2: 12, 3: 15 })[level] + year

const POWERS = {
  square: [4, (level, year) => power(rnd(1, squareTop(level, year)), 2)],
  cube: [4, (level, year) => power(rnd(1, 2 + level + Math.min(year, 3)), 3)],

  // Three squares, until class 5; from there above level 1 a power against
  // its mirror, 2^5 or 5^2, skipping the pairs that tie (2^4 and 4^2, or a = b).
  pickBiggest: [4, (level, year) => {
    let options
    if (level === 1 || year === 0) {
      options = distinct(3, () => powOpt(rnd(1, 10 + year), 2))
    } else {
      const hi = level === 2 ? 5 : 6
      do {
        const a = rnd(2, hi)
        const b = rnd(2, hi)
        options = [powOpt(a, b), powOpt(b, a)]
      } while (options[0].value === options[1].value)
    }
    const right = biggest(options)
    return pick(options.length === 2 ? 'topicPickBigger' : 'topicPickBiggest', [], right, options.filter((o) => o !== right))
  }],

  pow2: [5, (level, year) => power(2, rnd(2, Math.min(10, 4 + level + year)))],
  pow10: [5, (level) => power(10, rnd(2, 3 + level))],

  sumSquares: [5, (level) => {
    const a = rnd(1, 5 + level * 2)
    const b = rnd(1, 5 + level * 2)
    return number([{ pow: [a, 2] }, '+', { pow: [b, 2] }, '=', '?'], a * a + b * b)
  }],

  // a decimal squared, in tenths: 0,3² at level 1, up to 2,9² at level 3
  decSquare: [6, (level) => {
    const t = level === 1 ? rnd(1, 9) : rnd(11, level === 2 ? 19 : 29)
    return number([{ pow: [t / 10, 2] }, '=', '?'], dec(t * t))
  }],

  root: [7, (level, year) => {
    const b = rnd(2, squareTop(level, year))
    return number([{ root: b * b }, '=', '?'], b)
  }],

  // same base: the exponents add
  rule: [7, (level) => {
    const b = rnd(2, 9)
    const m = rnd(2, 3 + level)
    const n = rnd(2, 3 + level)
    return number([{ pow: [b, m] }, '·', { pow: [b, n] }, '=', { pow: [b, '?'] }], m + n)
  }],

  // same base: the exponents subtract
  ruleDiv: [7, (level) => {
    const b = rnd(2, 9)
    const n = rnd(1, 3 + level)
    const d = rnd(1, 3 + level)
    return number([{ pow: [b, n + d] }, '÷', { pow: [b, n] }, '=', { pow: [b, '?'] }], d)
  }],
}

// ---------------------------------------------------------------------------
// Negative numbers, from class 5
// ---------------------------------------------------------------------------
// a number after an operator: a negative one goes in brackets, 5 − (−3)
const opd = (n) => (n < 0 ? ['(', n, ')'] : [n])
// the reach of the numbers, both ways from zero
const negRange = (level, year) => ({ 1: 10, 2: 20, 3: 50 })[level] * (year + 1)

// two numbers in ±r, at least one of them below zero
function negPair(r) {
  for (;;) {
    const a = rnd(-r, r)
    const b = rnd(-r, r)
    if (a < 0 || b < 0) return [a, b]
  }
}

// a factor for × and ÷: never 0 or ±1, which are no task
const factor = (level) => rnd(2, { 1: 5, 2: 10, 3: 12 }[level]) * one([1, -1])

const NEGATIVES = {
  add: [5, (level, year) => {
    const [a, b] = negPair(negRange(level, year))
    return number([a, '+', ...opd(b), '=', '?'], a + b)
  }],

  sub: [5, (level, year) => {
    const [a, b] = negPair(negRange(level, year))
    return number([a, '−', ...opd(b), '=', '?'], a - b)
  }],

  pickBiggest: [5, (level, year) => {
    const r = negRange(level, year)
    let options
    do options = distinct(3, () => decOpt(rnd(-r, r) * 100))
    while (!options.some((o) => o.value < 0))
    const right = biggest(options)
    return pick('topicPickBiggest', [], right, options.filter((o) => o !== right))
  }],

  // the signs of a product; a division is built from its answer
  times: [6, (level) => {
    const a = factor(level)
    const b = factor(level)
    return rnd(0, 1)
      ? number([a, '×', ...opd(b), '=', '?'], a * b)
      : number([a * b, '÷', ...opd(b), '=', '?'], a)
  }],

  // the order of operations, with signs: −3 + 4 × (−2), (5 − 8) × (−2)
  order: [7, (level, year) => {
    const [a, b] = negPair(negRange(level, year) / (level === 1 ? 1 : 2))
    const c = factor(level)
    return rnd(0, 1)
      ? number([a, '+', ...opd(b), '×', ...opd(c), '=', '?'], a + b * c)
      : number(['(', a, '−', ...opd(b), ')', '×', ...opd(c), '=', '?'], (a - b) * c)
  }],
}

// ---------------------------------------------------------------------------
// Equations, from class 6. Class 6 writes the unknown as the '?' slot, so the
// kid fills it in; class 7 meets x on both sides, { x: k } is kx.
// ---------------------------------------------------------------------------
const eqRange = (level, year) => ({ 1: 10, 2: 20, 3: 50 })[level] * (year + 1)
// + 5 or − 5 after a term
const signed = (n) => (n < 0 ? ['−', -n] : ['+', n])

// an equation with the '?' as the unknown, `x` its value (a whole number > 0)
function slotEquation(level, year, x) {
  const a = rnd(2, level === 1 ? 5 : 9)
  const b = rnd(1, eqRange(level, year))
  return one([
    () => [a, '·', '?', '+', b, '=', a * x + b],
    () => [a, '·', '?', '−', b, '=', a * x - b],
    () => ['(', '?', '+', b, ')', '·', a, '=', (x + b) * a],
    () => ['?', '÷', a, '+', b, '=', x / a + b],
  ])()
}

// a whole x > 0 for slotEquation that keeps every side whole and above zero
function slotTask(level, year) {
  for (;;) {
    const x = rnd(1, eqRange(level, year))
    const parts = slotEquation(level, year, x)
    const nums = parts.filter((p) => typeof p === 'number')
    if (nums.every((n) => Number.isInteger(n) && n > 0)) return [parts, x]
  }
}

// ax + b = cx + d, with x whole and maybe below zero
function xEquation(level, year) {
  const r = eqRange(level, year) / 2
  for (;;) {
    const x = rnd(-r, r)
    const a = rnd(1, 9)
    const c = rnd(1, 9)
    const b = rnd(-r, r)
    const d = a * x + b - c * x
    if (a !== c && b !== 0 && d !== 0) {
      return [[{ x: a }, ...signed(b), '=', { x: c }, ...signed(d)], x]
    }
  }
}

// answers a kid would slip into: off by one or two, the wrong sign
function eqWrongs(x, right) {
  return distinct(3, () => decOpt((x + one([-2, -1, 1, 2, -2 * x, 10])) * 100), [right])
}

const EQUATIONS = {
  // one step: ? + 7 = 12, 3 · ? = 21, ? ÷ 4 = 5, 20 − ? = 8
  oneStep: [6, (level, year) => {
    const x = rnd(1, eqRange(level, year))
    const a = rnd(2, level === 1 ? 9 : eqRange(level, year))
    return one([
      () => number(['?', '+', a, '=', x + a], x),
      () => number(['?', '−', a, '=', x], x + a),
      () => number([a, '·', '?', '=', a * x], x),
      () => number(['?', '÷', a, '=', x], x * a),
      () => number([x + a, '−', '?', '=', a], x),
    ])()
  }],

  // two steps: 3 · ? + 4 = 19, (? + 2) · 3 = 21
  twoStep: [6, (level, year) => number(...slotTask(level, year))],

  pickSolves: [6, (level, year) => {
    const [parts, x] = slotTask(level, year)
    const right = decOpt(x * 100)
    return pick('topicPickSolves', parts, right, eqWrongs(x, right))
  }],

  // x on both sides: 5x − 3 = 2x + 9
  bothSides: [7, (level, year) => {
    const [parts, x] = xEquation(level, year)
    return { ...number(parts, x), prompt: 'topicSolveX' }
  }],

  // brackets: 3 · (x − 2) = 12
  brackets: [7, (level, year) => {
    const r = eqRange(level, year) / 2
    const a = rnd(2, 9)
    let b, x
    do {
      b = rnd(-r, r)
      x = rnd(-r, r)
    } while (b === 0)
    return { ...number([a, '·', '(', { x: 1 }, ...signed(b), ')', '=', a * (x + b)], x), prompt: 'topicSolveX' }
  }],

  pickX: [7, (level, year) => {
    const [parts, x] = xEquation(level, year)
    const right = decOpt(x * 100)
    return pick('topicSolveX', parts, right, eqWrongs(x, right))
  }],
}

// ---------------------------------------------------------------------------
// The average, from class 6. { mean: [4, 7, 10] } is their arithmetic mean.
// ---------------------------------------------------------------------------
const meanTop = (level, year) => ({ 1: 10, 2: 50, 3: 100 })[level] * (year + 1)

// n numbers from 1 to `top` whose mean is whole
function wholeMean(n, top) {
  for (;;) {
    const m = rnd(1, top)
    const vals = Array.from({ length: n - 1 }, () => rnd(1, top))
    const last = n * m - vals.reduce((s, v) => s + v, 0)
    if (last >= 1 && last <= top) return [shuffle([...vals, last]), m]
  }
}

const AVERAGE = {
  mean: [6, (level, year) => {
    const [vals, m] = wholeMean(level === 1 ? 3 : rnd(3, 5), meanTop(level, year))
    return number([{ mean: vals }, '=', '?'], m)
  }],

  // one set, and its mean among near misses. Three means side by side would
  // not fit a phone's row of tiles.
  pickEqual: [6, (level, year) => {
    const [vals, m] = wholeMean(3, meanTop(level, year))
    const right = decOpt(m * 100)
    const wrongs = distinct(3, () => decOpt((m + rnd(1, 3) * (m > 3 ? one([1, -1]) : 1)) * 100), [right])
    return pick('topicPickEqual', [{ mean: vals }], right, wrongs)
  }],

  // the number the mean is missing
  missing: [7, (level, year) => {
    const [vals, m] = wholeMean(level === 1 ? 3 : rnd(3, 5), meanTop(level, year))
    const i = rnd(0, vals.length - 1)
    const shown = vals.map((v, j) => (j === i ? '?' : v))
    return number([{ mean: shown }, '=', m], vals[i])
  }],

  // two or four numbers: a mean of halves or quarters, 7,5 or 6,25
  part: [7, (level, year) => {
    const n = one([2, 4])
    const vals = Array.from({ length: n }, () => rnd(1, meanTop(level, year)))
    return number([{ mean: vals }, '=', '?'], vals.reduce((s, v) => s + v, 0) / n)
  }],
}

// ---------------------------------------------------------------------------
// Pythagoras, class 8. Whole-number triples only, so every answer is whole.
// ---------------------------------------------------------------------------
const EASY_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13]]
const MID_TRIPLES = [...EASY_TRIPLES, [9, 12, 15], [12, 16, 20], [10, 24, 26], [8, 15, 17]]
const TRIPLES = { 1: EASY_TRIPLES, 2: MID_TRIPLES, 3: [...MID_TRIPLES, [15, 20, 25], [7, 24, 25], [9, 40, 41]] }

function triple(level) {
  const [a, b, c] = one(TRIPLES[level])
  return rnd(0, 1) ? [b, a, c] : [a, b, c]
}

const PYTHAGORAS = {
  // the hard level may hide a leg
  side: [8, (level) => {
    const [a, b, c] = triple(level)
    const hide = level === 3 ? one(['a', 'b', 'c']) : 'c'
    const sides = { a, b, c }
    return number([{ triangle: { ...sides, [hide]: '?' } }], sides[hide])
  }],

  // Right-angled or not: a true triple, or one whose hypotenuse is one off,
  // which no whole-number triangle with those legs can be. "tak" always comes
  // first: a yes/no pair reads wrong shuffled, so this does not go through pick().
  right: [8, (level) => {
    const [a, b, c] = triple(level)
    const real = rnd(0, 1) === 1
    return {
      kind: 'pick',
      prompt: 'topicPickRight',
      parts: [{ triangle: { a, b, c: real ? c : c + one([-1, 1]) } }],
      options: [[{ t: 'yes' }], [{ t: 'no' }]],
      answer: real ? 0 : 1,
    }
  }],
}

// ---------------------------------------------------------------------------
const KINDS = {
  fractions: FRACTIONS,
  decimals: DECIMALS,
  negatives: NEGATIVES,
  percents: PERCENTS,
  equations: EQUATIONS,
  average: AVERAGE,
  powers: POWERS,
  pythagoras: PYTHAGORAS,
}

// the names of the kinds a class has in a topic
export const kindsFor = (topic, cls) =>
  Object.entries(KINDS[topic] ?? {}).filter(([, [from]]) => from <= cls).map(([type]) => type)

export function topicTask(topic, level, cls) {
  if (!KINDS[topic] || !LEVELS.includes(level) || !(cls >= FROM[topic] && cls <= 8)) {
    throw new Error(`no topic task for "${topic}" at level ${level} in class ${cls}`)
  }
  const type = one(kindsFor(topic, cls))
  return { ...KINDS[topic][type][1](level, cls - FROM[topic]), type }
}
