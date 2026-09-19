// Self-check for the token evaluator. Runs under plain node:
//   node src/games/mathParts.check.js
// The evaluator reads the same token list MathParts.vue draws, so an article
// formula and a topic task are checked by the same arithmetic the kid sees.
import assert from 'node:assert/strict'
import { tokenValue, side, holds, isTriple } from './mathParts.js'

const OF = { t: 'of' }

// values of single tokens
assert.equal(tokenValue(7), 7)
assert.equal(tokenValue({ frac: [3, 4] }), 0.75)
assert.equal(tokenValue({ pow: [2, 5] }), 32)
assert.equal(tokenValue({ root: 49 }), 7)
assert.equal(tokenValue({ pct: 25 }), 0.25)
assert.throws(() => tokenValue({ nonsense: 1 }), /no value/)

// one side: × · : bind tighter than + −, '(' ')' group, and a word token is a
// multiplication ("3/4 z 20", "25% z 80")
assert.equal(side([8, '+', 5]), 13)
assert.equal(side([2, '+', 3, '×', 4]), 14)
assert.equal(side(['(', 2, '+', 3, ')', '×', 4]), 20)
assert.equal(side([20, ':', 4, '×', 2]), 10)
assert.equal(side([13, '−', 3, '−', 2]), 8)
assert.equal(side([2, '·', 2, '·', 2, '·', 2, '·', 2]), 32)
assert.equal(side([{ frac: [3, 4] }, OF, 20]), 15)
assert.equal(side([{ pct: 25 }, OF, 80]), 20)

// whole equations, the way the articles write them
assert.ok(holds([8, '+', 5, '=', 8, '+', 2, '+', 3, '=', 13]))
assert.ok(holds([13, '−', 5, '=', 13, '−', 3, '−', 2, '=', 8]))
assert.ok(holds([3, '×', 4, '=', 4, '+', 4, '+', 4, '=', 12]))
assert.ok(holds([12, ':', 3, '=', 4]))
assert.ok(holds([2, '+', 3, '×', 4, '=', 2, '+', 12, '=', 14]))
assert.ok(holds(['(', 2, '+', 3, ')', '×', 4, '=', 5, '×', 4, '=', 20]))
assert.ok(holds([20, ':', 4, '×', 2, '=', 5, '×', 2, '=', 10]))
assert.ok(holds([{ frac: [1, 5] }, '+', { frac: [2, 5] }, '=', { frac: [3, 5] }]))
assert.ok(holds([{ frac: [3, 10] }, '=', 0.3]))
assert.ok(holds([0.4, '+', 0.3, '=', 0.7]))
assert.ok(holds([{ pct: 1 }, '=', { frac: [1, 100] }]))
assert.ok(holds([{ frac: [1, 2] }, '=', 0.5, '=', { pct: 50 }]))
assert.ok(holds([{ pow: [2, 3] }, '·', { pow: [2, 2] }, '=', { pow: [2, 5] }]))
assert.ok(holds([{ root: 49 }, '=', 7]))
assert.ok(holds([{ pow: [3, 2] }, '+', { pow: [4, 2] }, '=', 9, '+', 16, '=', 25, '=', { pow: [5, 2] }]))

// comparisons stand in for the '='
assert.ok(holds([47, '<', 52]))
assert.ok(holds([54, '>', 51]))
assert.ok(holds([3, '<', 8]))

// a triangle is true when its sides are a Pythagorean triple
assert.ok(isTriple({ a: 3, b: 4, c: 5 }))
assert.ok(!isTriple({ a: 3, b: 4, c: 6 }))
assert.ok(holds([{ triangle: { a: 6, b: 8, c: 10 } }]))
assert.ok(!holds([{ triangle: { a: 6, b: 8, c: 11 } }]))

// and the ones that MUST be false: this is what catches a typo in an article
assert.equal(holds([2, '+', 3, '×', 4, '=', 20]), false)
assert.equal(holds(['(', 2, '+', 3, ')', '×', 4, '=', 14]), false)
assert.equal(holds([20, ':', 4, '×', 2, '=', 20, ':', 8]), false)
assert.equal(holds([8, '+', 5, '=', 8, '+', 3, '=', 13]), false)
assert.equal(holds([{ root: 49 }, '=', 8]), false)
assert.equal(holds([52, '<', 47]), false)
assert.equal(holds([51, '>', 54]), false)

// what it refuses to guess at
assert.throws(() => holds([{ frac: [3, 4] }]), /no left side/)
assert.throws(() => holds(['=', 5]), /no left side/)
assert.throws(() => holds(['(', 2, '+', 3, '=', 5]), /no "\)"/)
assert.throws(() => side([2, '+']), /a missing number/)
assert.throws(() => side([2, 3]), /stray token/)

console.log('mathParts: all checks passed')
