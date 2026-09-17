// Pure task generators for the six games. No Vue in here, so this file runs
// under plain node (see generators.check.js).
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'

// Operations unlocked per level (index = level - 1).
export const OPS = [
  ['+', '−'],
  ['+', '−', '×'],
  ['+', '−', '×', '÷'],
]

const ADD_RANGE = [[2, 10], [5, 100], [20, 200]]
const MUL_RANGE = [[1, 9], [2, 9], [2, 15]]
const NUMBER_MAX = [50, 200, 1000]

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

export function expr(op, level) {
  if (op === '+' || op === '−') {
    const [lo, hi] = ADD_RANGE[level - 1]
    let a = rnd(lo, hi)
    let b = rnd(lo, hi)
    if (op === '+') return make(a, b, op, a + b)
    if (b > a) [a, b] = [b, a] // never a negative result
    return make(a, b, op, a - b)
  }
  // both factors are >= 1, so division is always defined and whole
  const [lo, hi] = MUL_RANGE[level - 1]
  const x = rnd(lo, hi)
  const y = rnd(lo, hi)
  return op === '×' ? make(x, y, op, x * y) : make(x * y, y, op, x)
}

const randomExpr = (level) => {
  const ops = OPS[level - 1]
  return expr(ops[rnd(0, ops.length - 1)], level)
}

export function tilesRound(level) {
  const exprs = []
  const seen = new Set()
  while (exprs.length < 6) {
    const e = randomExpr(level)
    if (seen.has(e.result)) continue
    seen.add(e.result)
    exprs.push(e)
  }
  return { exprs, results: shuffle(exprs.map((e) => e.result)) }
}

export function dominoRound(level) {
  const total = rnd(2, [6, 9, 12][level - 1])
  // a domino half holds 0 to 6 pips
  const split = (sum) => {
    const x = rnd(Math.max(0, sum - 6), Math.min(6, sum))
    return [x, sum - x]
  }
  const [a, b] = split(total)
  const totals = new Set([total])
  while (totals.size < 4) totals.add(rnd(1, 12))
  const options = shuffle([...totals].map((sum) => (sum === total ? [a, b] : split(sum))))
  return { a, b, total, options }
}

export function compareRound(level) {
  const num = (n = rnd(1, 100)) => ({ text: String(n), value: n })
  const ex = () => {
    const e = expr(OPS[1][rnd(0, 2)], 1)
    return { text: e.text, value: e.result }
  }
  const left = level === 1 ? num() : ex()
  let right
  if (level === 1) right = rnd(0, 3) === 0 ? num(left.value) : num()
  else if (level === 2) right = num(Math.max(0, left.value + rnd(-5, 5)))
  else right = ex()
  const answer = left.value < right.value ? '<' : left.value > right.value ? '>' : '='
  return { left, right, answer }
}

export function biggestRound(level) {
  const numbers = distinct(3 + level, 1, NUMBER_MAX[level - 1])
  const want = rnd(0, 1) ? 'max' : 'min'
  return { numbers, want, answer: Math[want](...numbers) }
}

export function ascendingRound(level) {
  const numbers = distinct(5, 1, NUMBER_MAX[level - 1])
  return { numbers, sorted: [...numbers].sort((a, b) => a - b) }
}

export function missingRound(level) {
  const e = randomExpr(level)
  const hide = rnd(0, 1) ? 'a' : 'b'
  return { ...e, hide, answer: e[hide] }
}
