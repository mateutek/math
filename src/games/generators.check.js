import assert from 'node:assert/strict'
import {
  tilesRound, dominoRound, compareRound, biggestRound, ascendingRound, missingRound,
} from './generators.js'

const apply = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b }
const asc = (a, b) => a - b

for (const level of [1, 2, 3]) {
  for (let i = 0; i < 300; i++) {
    // Tiles: six pairs, every result unique so each pair is unambiguous
    const tiles = tilesRound(level)
    assert.equal(tiles.exprs.length, 6)
    assert.equal(new Set(tiles.exprs.map((e) => e.result)).size, 6)
    assert.deepEqual([...tiles.results].sort(asc), tiles.exprs.map((e) => e.result).sort(asc))
    for (const e of tiles.exprs) {
      assert.equal(apply[e.op](e.a, e.b), e.result)
      assert.ok(Number.isInteger(e.result) && e.result >= 0)
    }

    // Domino: exactly one correct option, halves are real domino halves
    const dom = dominoRound(level)
    assert.equal(dom.a + dom.b, dom.total)
    assert.equal(dom.options.length, 4)
    assert.equal(dom.options.filter(([x, y]) => x + y === dom.total).length, 1)
    for (const [x, y] of dom.options) assert.ok(x >= 0 && x <= 6 && y >= 0 && y <= 6)

    // Compare: the stated answer is true
    const cmp = compareRound(level)
    const truth = cmp.left.value < cmp.right.value ? '<' : cmp.left.value > cmp.right.value ? '>' : '='
    assert.equal(cmp.answer, truth)

    // Biggest: distinct numbers, answer matches what is asked
    const big = biggestRound(level)
    assert.equal(new Set(big.numbers).size, big.numbers.length)
    assert.equal(big.answer, Math[big.want](...big.numbers))

    // Ascending: five distinct numbers, sorted is really sorted
    const up = ascendingRound(level)
    assert.equal(new Set(up.numbers).size, 5)
    assert.deepEqual(up.sorted, [...up.numbers].sort(asc))

    // Missing: division is whole, and the answer completes the equation
    const mis = missingRound(level)
    if (mis.op === '÷') assert.equal(mis.a % mis.b, 0)
    const a = mis.hide === 'a' ? mis.answer : mis.a
    const b = mis.hide === 'b' ? mis.answer : mis.b
    assert.equal(apply[mis.op](a, b), mis.result)
  }
}

console.log('generators: all checks passed')
