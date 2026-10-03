// Pure task generators for the six games. No Vue in here, so this file runs
// under plain node (see generators.check.js). Every one takes a class config
// from src/data/classes.js and stays inside the numbers that class knows.
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function distinct(count, min, max) {
  const set = new Set()
  while (set.size < count) set.add(rnd(min, max))
  return [...set]
}

const make = (a, b, op, result) => ({
  a, b, op, result,
  text: `${a} ${op} ${b}`,
  material: op === '+' || op === '−' ? 'wood' : 'stone',
})

// A times table never runs past ten times ten, whatever the class ceiling is.
const TABLE = 10

export function expr(op, cfg) {
  if (op === '+' || op === '−') {
    // built from the two parts, so the sum never passes the class ceiling and
    // the difference is never negative
    const a = rnd(1, cfg.max - 1)
    const b = rnd(1, cfg.max - a)
    return op === '+' ? make(a, b, op, a + b) : make(a + b, b, op, a)
  }
  // both factors are >= 1, so division is always defined and whole
  const x = rnd(1, Math.min(TABLE, cfg.mulMax))
  const y = rnd(1, Math.min(TABLE, Math.floor(cfg.mulMax / x)))
  return op === '×' ? make(x, y, op, x * y) : make(x * y, y, op, x)
}

// Division with a remainder (the `divide` game and its test section). Does not
// go through expr(): a divisor out of the times table and a dividend inside the
// class ceiling.
export function remainderExpr(cfg) {
  const b = rnd(2, 10)
  const a = rnd(b + 1, cfg.mulMax)
  return { a, b, result: Math.floor(a / b), rest: a % b }
}

const randomExpr = (cfg) => expr(cfg.ops[rnd(0, cfg.ops.length - 1)], cfg)

export function tilesRound(cfg) {
  const exprs = []
  const seen = new Set()
  while (exprs.length < 6) {
    const e = randomExpr(cfg)
    if (seen.has(e.result)) continue
    seen.add(e.result)
    exprs.push(e)
  }
  return { exprs, results: shuffle(exprs.map((e) => e.result)) }
}

const one = (list) => list[rnd(0, list.length - 1)]

// a domino half holds 0 to 6 pips
const split = (sum) => {
  const x = rnd(Math.max(0, sum - 6), Math.min(6, sum))
  return [x, sum - x]
}

// From class 3 the bone's pips are the result of a calculation the class
// knows, never the numbers on screen: 47 − 39, 3 × 4, 36 ÷ 4, and from class 4
// 6 × 7 − 35. Each returns the tokens or null when `total` does not suit it.
const DOMINO_SUMS = {
  '−': (total) => {
    const a = rnd(total + 10, 99)
    return [a, '−', a - total]
  },
  '×': (total) => {
    const pairs = [2, 3, 4, 5, 6].filter((x) => total % x === 0 && total / x >= 2)
    if (!pairs.length) return null
    const x = one(pairs)
    return [x, '×', total / x]
  },
  '÷': (total, cfg) => {
    const d = rnd(2, Math.min(9, Math.floor(cfg.mulMax / total)))
    return d >= 2 ? [total * d, '÷', d] : null
  },
  mix: (total) => {
    const x = rnd(3, 9)
    const y = rnd(3, 9)
    return x * y - total > 0 ? [x, '×', y, '−', x * y - total] : null
  },
}

export function dominoRound(cfg) {
  const total = rnd(2, cfg.dominoMax)
  let left
  if (cfg.id < 3) {
    // the youngest read the two halves straight off: 3 + 4 is the 3|4 bone
    const [a, b] = split(total)
    left = [a, '+', b]
  } else {
    const kinds = ['−', '×', '÷', ...(cfg.id >= 4 ? ['mix', 'mix'] : [])]
    while (!left) left = DOMINO_SUMS[one(kinds)](total, cfg)
  }
  // Above class 2 the wrong bones are near misses, so the pips must be
  // counted, not glanced at; below it any total will do.
  const totals = new Set([total])
  while (totals.size < 4) {
    const t = cfg.id < 3 ? rnd(1, cfg.dominoMax) : total + one([-3, -2, -1, 1, 2, 3])
    if (t >= 1 && t <= cfg.dominoMax) totals.add(t)
  }
  const options = shuffle([...totals].map((sum) => (cfg.id < 3 && sum === total ? [left[0], left[2]] : split(sum))))
  return { left, total, options }
}

export function compareRound(cfg) {
  const num = (n = rnd(0, cfg.max)) => ({ text: String(n), value: n })
  // once a class multiplies, one side is worth making a small sum instead
  let left = num()
  if (cfg.mulMax) {
    const e = randomExpr(cfg)
    left = { text: e.text, value: e.result }
  }
  const near = Math.min(cfg.max, Math.max(0, left.value + rnd(-5, 5)))
  const right = num(rnd(0, 3) === 0 ? left.value : near)
  const answer = left.value < right.value ? '<' : left.value > right.value ? '>' : '='
  return { left, right, answer }
}

// Every number on the board is the same length, so the answer has to be read
// rather than spotted: among 348 and 501, a 47 is the shortest tile, not the
// smallest number worked out. Picks one digit band wide enough to hold `count`
// distinct numbers (1 to 9, 10 to 99, ...) and draws the whole set from it.
function sameWidth(count, max) {
  const bands = []
  for (let lo = 1; lo <= max; lo *= 10) {
    const hi = Math.min(max, lo * 10 - 1)
    if (hi - lo + 1 >= count) bands.push([lo, hi])
  }
  // no band that wide (a tiny ceiling): the whole range, digits mixed
  if (!bands.length) return distinct(count, 1, max)
  return distinct(count, ...bands[rnd(0, bands.length - 1)])
}

export function biggestRound(cfg) {
  const numbers = sameWidth(cfg.max <= 10 ? 4 : 5, cfg.max)
  const want = rnd(0, 1) ? 'max' : 'min'
  return { numbers, want, answer: Math[want](...numbers) }
}

export function ascendingRound(cfg) {
  const numbers = distinct(5, 1, cfg.max)
  return { numbers, sorted: [...numbers].sort((a, b) => a - b) }
}

export function missingRound(cfg) {
  const e = randomExpr(cfg)
  const hide = rnd(0, 1) ? 'a' : 'b'
  return { ...e, hide, answer: e[hide] }
}
