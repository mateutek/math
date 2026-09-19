// Self-check for the topic generators. Runs under plain node:
//   node src/games/topics.check.js
// The evaluator below knows nothing about how a task was made: it fills the
// answer into the '?' and checks that the equation on screen is true.
import assert from 'node:assert/strict'
import { CLASSES, TOPICS, gameOffered } from '../data/classes.js'
import { LEVELS, topicTask, parseAnswer, sameNumber } from './topics.js'

const RUNS = 2000
// topics whose generator exists yet
const BUILT = TOPICS

const isObject = (x) => x !== null && typeof x === 'object'
const children = (x) => (Array.isArray(x) ? x : isObject(x) ? Object.values(x) : [])
const slots = (x) => (x === '?' ? 1 : children(x).reduce((sum, y) => sum + slots(y), 0))
const fill = (x, v) =>
  x === '?' ? v
    : Array.isArray(x) ? x.map((y) => fill(y, v))
      : isObject(x) ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, fill(y, v)]))
        : x

function tokenValue(p) {
  if (typeof p === 'number') return p
  if (p.frac) return p.frac[0] / p.frac[1]
  if (p.pow) return p.pow[0] ** p.pow[1]
  if (p.root !== undefined) return Math.sqrt(p.root)
  if (p.pct !== undefined) return p.pct / 100
  throw new Error(`no value for ${JSON.stringify(p)}`)
}

const APPLY = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '·': (a, b) => a * b,
}

// one side of an equation, left to right; no task has more than one operator a
// side. "of" (3/4 z 20, 25% z 80) is a multiplication.
function side(tokens) {
  let acc = null
  let op = null
  for (const p of tokens) {
    if (typeof p === 'string') op = p
    else if (p.t) op = '×'
    else acc = acc === null ? tokenValue(p) : APPLY[op](acc, tokenValue(p))
  }
  return acc
}

const isTriple = ({ a, b, c }) => a * a + b * b === c * c

function holds(parts) {
  if (parts[0].triangle) return isTriple(parts[0].triangle)
  const eq = parts.indexOf('=')
  assert.ok(eq > 0, `no "=" in ${JSON.stringify(parts)}`)
  return Math.abs(side(parts.slice(0, eq)) - side(parts.slice(eq + 1))) < 1e-9
}

const denominators = (x) =>
  isObject(x) && !Array.isArray(x) && x.frac ? [x.frac[1]] : children(x).flatMap(denominators)

function checkTask(task, where) {
  for (const d of [...denominators(task.parts), ...denominators(task.options ?? [])]) {
    assert.ok(d === '?' || d > 0, `${where}: a zero denominator`)
  }

  if (task.kind === 'number') {
    assert.equal(slots(task.parts), 1, `${where}: exactly one "?" in ${JSON.stringify(task.parts)}`)
    assert.ok(Number.isFinite(task.answer) && task.answer >= 0, `${where}: answer ${task.answer}`)
    assert.ok(
      Math.abs(task.answer * 100 - Math.round(task.answer * 100)) < 1e-9,
      `${where}: ${task.answer} has more than two decimal places`,
    )
    assert.ok(holds(fill(task.parts, task.answer)), `${where}: ${JSON.stringify(task.parts)} is not ${task.answer}`)
    return
  }

  assert.equal(task.kind, 'pick', where)
  assert.ok(task.options.length >= 2 && task.options.length <= 4, `${where}: ${task.options.length} options`)
  assert.ok(Number.isInteger(task.answer) && task.answer >= 0 && task.answer < task.options.length, where)

  if (task.prompt === 'topicPickRight') {
    assert.equal(task.answer, isTriple(task.parts[0].triangle) ? 0 : 1, `${where}: yes/no is wrong`)
    return
  }
  const values = task.options.map((o) => tokenValue(o[0]))
  for (const [i, v] of values.entries()) {
    for (const [j, w] of values.entries()) {
      assert.ok(i === j || Math.abs(v - w) > 1e-9, `${where}: options ${i} and ${j} are equal`)
    }
  }
  if (task.prompt === 'topicPickEqual') {
    const target = tokenValue(task.parts[0])
    const equal = values.filter((v) => Math.abs(v - target) < 1e-9)
    assert.equal(equal.length, 1, `${where}: ${equal.length} options equal the target`)
    assert.ok(Math.abs(values[task.answer] - target) < 1e-9, `${where}: wrong option marked right`)
  } else {
    // "biggest" of three or four, "bigger" of two
    assert.equal(task.prompt, task.options.length === 2 ? 'topicPickBigger' : 'topicPickBiggest', where)
    assert.equal(values[task.answer], Math.max(...values), `${where}: the biggest is not marked right`)
  }
}

// what a level promises, beyond being right (the spec's level table)
const LEVEL_RULES = {
  fractions(task, level) {
    const top = { 1: 6 * 3, 2: 10 * 5, 3: 12 * 6 }[level]
    for (const d of denominators(task.parts)) assert.ok(d === '?' || d <= top, `denominator ${d} past ${top}`)
  },

  // one decimal place below level 3, two at it, in everything shown and asked
  decimals(task, level) {
    const places = level === 3 ? 100 : 10
    const shown = [...task.parts, ...(task.options ?? []).flat(), task.kind === 'number' ? task.answer : 0]
    for (const n of shown.filter((p) => typeof p === 'number')) {
      assert.ok(Math.abs(n * places - Math.round(n * places)) < 1e-9, `${n} has too many places for L${level}`)
    }
  },

  // a typed percent task only uses the level's own percentages
  percents(task, level) {
    if (task.kind !== 'number') return
    // fromFrac (n/d = ?%) is levelled by its denominator, not by the percentage list
    if (isObject(task.parts[0]) && task.parts[0].frac) {
      const denoms = { 1: [2, 4, 10], 2: [2, 4, 5, 10, 20], 3: [4, 5, 20, 25, 50] }[level]
      assert.ok(denoms.includes(task.parts[0].frac[1]), `denominator ${task.parts[0].frac[1]} is not a level ${level} denominator`)
      return
    }
    const allowed = { 1: [10, 25, 50, 100], 2: [10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 75] }[level]
    const shown = task.parts.filter((p) => isObject(p) && p.pct !== undefined && p.pct !== '?').map((p) => p.pct)
    const first = task.parts[0]
    if (isObject(first) && first.pct === '?') shown.push(task.answer)
    for (const p of shown) {
      assert.ok(allowed ? allowed.includes(p) : p % 5 === 0 && p > 0 && p < 100, `${p}% is not a level ${level} percentage`)
    }
  },

  // the easy level is squares only
  powers(task, level) {
    if (level !== 1) return
    const pows = [...task.parts, ...(task.options ?? []).flat()].filter((p) => isObject(p) && p.pow)
    for (const p of pows) assert.equal(p.pow[1], 2, 'level 1 is squares only')
  },

  // below the hard level the unknown is always the hypotenuse
  pythagoras(task, level) {
    if (task.kind === 'number' && level < 3) assert.equal(task.parts[0].triangle.c, '?')
  },
}

for (const topic of BUILT) {
  for (const level of LEVELS) {
    const kinds = new Set()
    for (let i = 0; i < RUNS; i++) {
      const task = topicTask(topic, level)
      checkTask(task, `${topic} L${level}`)
      LEVEL_RULES[topic]?.(task, level)
      kinds.add(task.kind)
    }
    assert.deepEqual([...kinds].sort(), ['number', 'pick'], `${topic} L${level} mixes both answer styles`)
  }
}

assert.throws(() => topicTask('nonsense', 1))
assert.throws(() => topicTask('fractions', 4))

// typed answers: comma or dot, spaces, and nothing else
assert.equal(parseAnswer('0,5'), 0.5)
assert.equal(parseAnswer('0.5'), 0.5)
assert.equal(parseAnswer(' 3 '), 3)
assert.equal(parseAnswer('12,25'), 12.25)
assert.equal(parseAnswer(''), null)
assert.equal(parseAnswer('abc'), null)
assert.equal(parseAnswer('1,2,3'), null)
assert.equal(parseAnswer(7), 7)
assert.ok(sameNumber(0.1 + 0.2, 0.3))
assert.ok(!sameNumber(0.3, 0.31))

// classes: topics pile up one a year from class 4, and only a class that has
// reached a topic is offered its game
for (const cfg of CLASSES) {
  assert.deepEqual(cfg.topics, TOPICS.slice(0, Math.max(0, cfg.id - 3)), `class ${cfg.id} topics`)
  for (const topic of TOPICS) assert.equal(gameOffered(topic, cfg), cfg.topics.includes(topic))
}

console.log('topics: all checks passed')
