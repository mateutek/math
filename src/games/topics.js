// Pure task generators for the topic games of classes 4 to 8. No Vue in here,
// so this file runs under plain node (see topics.check.js).
//
// A task is plain data. `parts` is what the kid reads, as a list of tokens that
// MathParts.vue draws: numbers, the operator strings '=' '+' '−' '×' '·', the
// slot '?', and { t } { frac } { pow } { root } { pct } { triangle }. A '?' may
// also sit inside a frac, pow, pct or triangle.
//   { kind: 'number', parts, answer }                 one '?', typed
//   { kind: 'pick', prompt, parts, options, answer }  answer indexes options
// Decimals are built as whole hundredths and divided by 100 at the last moment,
// so no task ever carries a 0.30000000000000004.
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'
import { TOPICS } from '../data/classes.js'
import { shuffle } from './generators.js'

export { TOPICS }
export const LEVELS = [1, 2, 3]

const one = (list) => list[rnd(0, list.length - 1)]
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
const OF = { t: 'of' }

// a typed answer: comma or dot, spaces around it; null when it is not a number
export function parseAnswer(text) {
  const s = String(text ?? '').trim().replace(',', '.')
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : null
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
// Class 4: fractions
// ---------------------------------------------------------------------------
const FRAC_MAX = { 1: 6, 2: 10, 3: 12 } // the largest denominator in lowest terms
const FRAC_TIMES = { 1: 3, 2: 5, 3: 6 } // the most an equal fraction is scaled by

const fracOpt = (n, d) => ({ parts: [{ frac: [n, d] }], value: n / d })

// a proper fraction in lowest terms
function properFrac(maxD) {
  for (;;) {
    const d = rnd(2, maxD)
    const n = rnd(1, d - 1)
    if (gcd(n, d) === 1) return [n, d]
  }
}

function fractions(level) {
  const maxD = FRAC_MAX[level]
  const kind = one(['equal', 'same', 'of', 'pickEqual', 'pickBiggest'])

  if (kind === 'equal') {
    // expand or reduce; the unknown is always a numerator
    const [n, d] = properFrac(maxD)
    const k = rnd(2, FRAC_TIMES[level])
    return rnd(0, 1)
      ? number([{ frac: [n, d] }, '=', { frac: ['?', d * k] }], n * k)
      : number([{ frac: [n * k, d * k] }, '=', { frac: ['?', d] }], n)
  }

  if (kind === 'same') {
    // one denominator, and the sum stays a proper fraction
    const d = rnd(3, maxD)
    const a = rnd(1, d - 2)
    const b = rnd(1, d - 1 - a)
    return rnd(0, 1)
      ? number([{ frac: [a, d] }, '+', { frac: [b, d] }, '=', { frac: ['?', d] }], a + b)
      : number([{ frac: [a + b, d] }, '−', { frac: [b, d] }, '=', { frac: ['?', d] }], a)
  }

  if (kind === 'of') {
    // a fraction of a number it divides: 3/4 z 20
    const [n, d] = properFrac(maxD)
    const m = rnd(2, level === 1 ? 5 : 10) // from 2: a whole of one denominator is no task
    return number([{ frac: [n, d] }, OF, d * m, '=', '?'], n * m)
  }

  if (kind === 'pickEqual') {
    const [n, d] = properFrac(maxD)
    const k = rnd(2, FRAC_TIMES[level])
    const right = fracOpt(n * k, d * k)
    const wrongs = distinct(3, () => {
      const [x, y] = properFrac(maxD)
      const j = rnd(1, FRAC_TIMES[level])
      return fracOpt(x * j, y * j)
    }, [right])
    return pick('topicPickEqual', [{ frac: [n, d] }], right, wrongs)
  }

  // pickBiggest. One shared denominator below level 3, so only the numerators
  // are compared; any denominators at level 3. Three numerators need d >= 4.
  let options
  if (level < 3) {
    const d = rnd(4, maxD)
    options = distinct(3, () => fracOpt(rnd(1, d - 1), d))
  } else {
    options = distinct(3, () => fracOpt(...properFrac(maxD)))
  }
  const right = biggest(options)
  return pick('topicPickBiggest', [], right, options.filter((o) => o !== right))
}

// ---------------------------------------------------------------------------
// Class 5: decimals. Everything is counted in hundredths until it is shown.
// ---------------------------------------------------------------------------
const dec = (hundredths) => hundredths / 100
const decOpt = (h) => ({ parts: [dec(h)], value: dec(h) })

// an operand, in hundredths: tenths below 1, tenths below 10, hundredths below 10
function decOperand(level) {
  if (level === 1) return rnd(1, 9) * 10
  if (level === 2) return rnd(1, 99) * 10
  return rnd(1, 999)
}

// denominators that land on a level's number of decimal places
const DEC_DENOMS = { 1: [10], 2: [2, 5, 10], 3: [4, 20, 25, 50, 100] }

function decimals(level) {
  const kind = one(['add', 'sub', 'times', 'fromFrac', 'pickBiggest'])

  if (kind === 'add') {
    const a = decOperand(level)
    const b = decOperand(level)
    return number([dec(a), '+', dec(b), '=', '?'], dec(a + b))
  }

  if (kind === 'sub') {
    const x = decOperand(level)
    const y = decOperand(level)
    const [hi, lo] = x > y ? [x, y] : [y, x]
    return number([dec(hi), '−', dec(lo), '=', '?'], dec(hi - lo))
  }

  if (kind === 'times') {
    const a = decOperand(level)
    const k = rnd(2, 9)
    return number([dec(a), '×', k, '=', '?'], dec(a * k))
  }

  if (kind === 'fromFrac') {
    const d = one(DEC_DENOMS[level])
    const n = rnd(1, d - 1)
    return number([{ frac: [n, d] }, '=', '?'], dec((n * 100) / d))
  }

  // pickBiggest. Level 1 compares tenths from anywhere below 1. Above it the
  // three sit close to one shared number, in tenths at level 2 and hundredths
  // at level 3, so the places have to be read, not just the first digit.
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
}

// ---------------------------------------------------------------------------
// Class 6: percents
// ---------------------------------------------------------------------------
const PCTS = {
  1: [10, 25, 50, 100],
  2: [10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 75],
  3: Array.from({ length: 19 }, (_, i) => (i + 1) * 5), // 5, 10 ... 95
}
// denominators whose fractions are whole percentages
const PCT_DENOMS = { 1: [2, 4, 10], 2: [2, 4, 5, 10, 20], 3: [4, 5, 20, 25, 50] }

const pctOpt = (p) => ({ parts: [{ pct: p }], value: p / 100 })

function percents(level) {
  const kind = one(['of', 'which', 'fromFrac', 'pickEqual'])
  const p = one(PCTS[level])

  if (kind === 'of' || kind === 'which') {
    // the base is a multiple of whatever makes p% of it a whole number
    const base = (100 / gcd(p, 100)) * rnd(1, 10)
    const part = (p * base) / 100
    return kind === 'of'
      ? number([{ pct: p }, OF, base, '=', '?'], part)
      : number([{ pct: '?' }, OF, base, '=', part], p)
  }

  if (kind === 'fromFrac') {
    const d = one(PCT_DENOMS[level])
    const n = rnd(1, d - 1)
    return number([{ frac: [n, d] }, '=', { pct: '?' }], (n * 100) / d)
  }

  // pickEqual: a decimal, and which percentage it is. The wrong ones are the
  // slips kids make: a place off, the complement, a near miss.
  const slips = [p / 10, p * 10, 100 - p, p + 5, p + 10, p * 2]
  const wrongs = shuffle([...new Set(slips.filter((q) => Number.isInteger(q) && q > 0 && q !== p))])
    .slice(0, 3)
    .map(pctOpt)
  return pick('topicPickEqual', [p / 100], pctOpt(p), wrongs)
}

// ---------------------------------------------------------------------------
// Class 7: powers and roots
// ---------------------------------------------------------------------------
const POWER_KINDS = {
  1: ['square', 'pickBiggest'],
  2: ['square', 'cube', 'root', 'sumSquares', 'pickBiggest'],
  3: ['pow2', 'pow10', 'root', 'sumSquares', 'rule', 'pickBiggest'],
}

const powOpt = (b, e) => ({ parts: [{ pow: [b, e] }], value: b ** e })
const power = (b, e) => number([{ pow: [b, e] }, '=', '?'], b ** e)

function powers(level) {
  const kind = one(POWER_KINDS[level])
  const top = level === 1 ? 10 : 15 // the biggest base that gets squared

  if (kind === 'square') return power(rnd(1, top), 2)
  if (kind === 'cube') return power(rnd(1, 5), 3)
  if (kind === 'pow2') return power(2, rnd(2, 10))
  if (kind === 'pow10') return power(10, rnd(2, 6))

  if (kind === 'root') {
    const b = rnd(2, top)
    return number([{ root: b * b }, '=', '?'], b)
  }

  if (kind === 'sumSquares') {
    const a = rnd(1, 10)
    const b = rnd(1, 10)
    return number([{ pow: [a, 2] }, '+', { pow: [b, 2] }, '=', '?'], a * a + b * b)
  }

  if (kind === 'rule') {
    // same base: the exponents add
    const b = rnd(2, 9)
    const m = rnd(2, 5)
    const n = rnd(2, 5)
    return number([{ pow: [b, m] }, '·', { pow: [b, n] }, '=', { pow: [b, '?'] }], m + n)
  }

  // pickBiggest. Three squares on the easy level; above it a power against its
  // mirror, 2^5 or 5^2, skipping the pairs that tie (2^4 and 4^2, or a = b).
  let options
  if (level === 1) {
    options = distinct(3, () => powOpt(rnd(1, 10), 2))
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
}

// ---------------------------------------------------------------------------
// Class 8: Pythagoras. Whole-number triples only, so every answer is whole.
// ---------------------------------------------------------------------------
const EASY_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13]]
const MID_TRIPLES = [...EASY_TRIPLES, [9, 12, 15], [12, 16, 20], [10, 24, 26], [8, 15, 17]]
const TRIPLES = { 1: EASY_TRIPLES, 2: MID_TRIPLES, 3: [...MID_TRIPLES, [15, 20, 25], [7, 24, 25], [9, 40, 41]] }

function pythagoras(level) {
  let [a, b, c] = one(TRIPLES[level])
  if (rnd(0, 1)) [a, b] = [b, a]

  // two in three tasks ask for a side; the hard level may hide a leg
  if (rnd(0, 2)) {
    const hide = level === 3 ? one(['a', 'b', 'c']) : 'c'
    const sides = { a, b, c }
    return number([{ triangle: { ...sides, [hide]: '?' } }], sides[hide])
  }

  // Right-angled or not: a true triple, or one whose hypotenuse is one off,
  // which no whole-number triangle with those legs can be. "tak" always comes
  // first: a yes/no pair reads wrong shuffled, so this does not go through pick().
  const real = rnd(0, 1) === 1
  return {
    kind: 'pick',
    prompt: 'topicPickRight',
    parts: [{ triangle: { a, b, c: real ? c : c + one([-1, 1]) } }],
    options: [[{ t: 'yes' }], [{ t: 'no' }]],
    answer: real ? 0 : 1,
  }
}

// ---------------------------------------------------------------------------
const GENERATORS = { fractions, decimals, percents, powers, pythagoras }

export function topicTask(topic, level) {
  if (!GENERATORS[topic] || !LEVELS.includes(level)) {
    throw new Error(`no topic task for "${topic}" at level ${level}`)
  }
  return GENERATORS[topic](level)
}
