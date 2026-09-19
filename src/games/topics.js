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
const GENERATORS = { fractions }

export function topicTask(topic, level) {
  if (!GENERATORS[topic] || !LEVELS.includes(level)) {
    throw new Error(`no topic task for "${topic}" at level ${level}`)
  }
  return GENERATORS[topic](level)
}
