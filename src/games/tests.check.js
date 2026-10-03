// node src/games/tests.check.js - every class, every section, many draws: one
// '?' slot per question, and the answer is what the slot really holds.
import assert from 'node:assert/strict'
import { CLASSES } from '../data/classes.js'
import { sectionsFor, question, editable, toText, fromText } from './tests.js'

// the '?' anywhere in a token tree
const slots = (x) => (x === '?' ? 1 : x && typeof x === 'object' ? Object.values(x).reduce((n, v) => n + slots(v), 0) : 0)

const calc = (a, op, b) => ({ '+': a + b, '−': a - b, '×': a * b, '÷': a / b })[op]

// true when the question reads right with the answer in its slot: a = b op c
// for the sums, or "left sign right" for compare, whose left may be a sum
function holds(parts, answer) {
  const p = parts.map((x) => (x === '?' ? answer : x))
  if (p.length === 5 && p[3] === '=') return calc(p[0], p[1], p[2]) === p[4]
  const left = p.length === 3 ? p[0] : calc(p[0], p[1], p[2])
  const right = p[p.length - 1]
  return (left < right ? '<' : left > right ? '>' : '=') === p[p.length - 2]
}

for (const cfg of CLASSES) {
  const ids = sectionsFor(cfg).map((s) => s.id)
  assert.ok(ids.includes('addition') && ids.includes('compare'), `class ${cfg.id}: ${ids}`)
  assert.equal(ids.includes('multiply'), cfg.mulMax > 0, `class ${cfg.id} multiply`)
  assert.equal(ids.includes('divide'), ids.includes('divide2'), `class ${cfg.id} division`)
  for (const t of cfg.topics) assert.ok(ids.includes(t), `class ${cfg.id} lacks ${t}`)

  for (const id of ids) {
    for (const level of [1, 2, 3]) {
      const taken = []
      for (let i = 0; i < 200; i++) {
        const q = question(id, cfg, level, taken)
        taken.push(q)
        assert.equal(slots(q.parts), id === 'divide' ? 2 : 1, `${id}: ${JSON.stringify(q.parts)}`)
        assert.ok(q.answer !== undefined && q.answer !== null, `${id} has no answer`)
        if (id === 'divide') {
          // a = quotient * b + rest, the rest below the divisor
          const [a, , b] = q.parts
          const [quot, rest] = q.answer
          assert.ok(a === quot * b + rest && rest >= 0 && rest < b, `divide: ${JSON.stringify(q)}`)
        }
        if (['addition', 'subtraction', 'multiply', 'divide2', 'missing', 'compare'].includes(id)) {
          assert.ok(holds(q.parts, q.answer), `${id}: ${JSON.stringify(q)}`)
        }
      }
    }
  }
}

// a pool big enough gives a section with no repeats
const cfg = CLASSES.find((c) => c.id === 3)
const taken = []
for (let i = 0; i < 12; i++) taken.push(question('addition', cfg, 1, taken))
assert.equal(new Set(taken.map((q) => JSON.stringify(q.parts))).size, 12)

// hand edits: what goes out as text comes back as the same parts
const back = (parts) => assert.deepEqual(fromText(toText({ parts })), parts)
back([34, '+', '?', '=', 62])
back([{ frac: [1, 4] }, '+', { frac: [1, 4] }, '=', { frac: ['?', 4] }])
back([{ frac: [1, 2] }, { t: 'of' }, 6, '=', '?'])
back([{ pow: [2, 3] }, '·', { pow: [2, 2] }, '=', { pow: [2, '?'] }])
back([{ root: 49 }, '=', '?'])
back([{ pct: '?' }, { t: 'of' }, 80, '=', 20])
back([0.25, '=', { pct: '?' }])
back([5, '−', '(', -3, ')', '=', '?'])
back([-3, '+', 4, '=', '?'])
back(['(', '?', '+', 2, ')', '·', 3, '=', 21])
assert.deepEqual(fromText('9 - 3 = ?'), [9, '−', 3, '=', '?']) // a minus between numbers stays an operator
assert.deepEqual(fromText('(-2)·3=?'), ['(', -2, ')', '·', 3, '=', '?'])
assert.ok(!editable({ parts: [{ mean: [1, 2, 3] }, '=', '?'] }))
assert.deepEqual(fromText('34+?=62'), [34, '+', '?', '=', 62])
assert.deepEqual(fromText('9-?=4'), [9, '−', '?', '=', 4])
assert.deepEqual(fromText('2,5 + 1,5 = ?'), [2.5, '+', 1.5, '=', '?'])
assert.deepEqual(fromText('47 ? 52'), [47, '?', 52])
assert.deepEqual(fromText('3/4 of 20 = ?'), [{ frac: [3, 4] }, { t: 'of' }, 20, '=', '?'])
assert.deepEqual(fromText('sqrt 81=?'), [{ root: 81 }, '=', '?'])
assert.deepEqual(fromText('12 : 4 = ?'), [12, '÷', 4, '=', '?'])
assert.equal(fromText('34 + 28 ='), null) // no blank
assert.deepEqual(fromText('17 : 5 = ? r ?'), [17, '÷', 5, '=', '?', { t: 'restShort' }, '?'])
assert.ok(editable({ parts: [34, '+', '?', '=', 62] }))
assert.ok(!editable({ parts: [{ triangle: { a: 3, b: 4, c: '?' } }] }))
// every generated question that is editable survives the trip out and back
for (const cfg of CLASSES) {
  for (const s of sectionsFor(cfg)) {
    for (let i = 0; i < 300; i++) {
      const g = question(s.id, cfg, 1 + (i % 3))
      if (editable(g)) assert.deepEqual(fromText(toText(g)), g.parts, `${s.id}: ${toText(g)}`)
    }
  }
}

console.log('tests.js ok')
