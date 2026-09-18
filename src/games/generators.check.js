import assert from 'node:assert/strict'
import { CLASSES, gameMax, gameOffered } from '../data/classes.js'
import {
  expr, tilesRound, dominoRound, compareRound, biggestRound, ascendingRound, missingRound,
} from './generators.js'

const apply = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b }
const asc = (a, b) => a - b

// every expression is whole, non-negative and inside what the class knows
function checkExpr(e, cfg, where) {
  assert.equal(apply[e.op](e.a, e.b), e.result, where)
  for (const n of [e.a, e.b, e.result]) {
    assert.ok(Number.isInteger(n) && n >= 0, `${where}: ${e.text} is not a whole count`)
  }
  const ceiling = e.op === '×' || e.op === '÷' ? cfg.mulMax : cfg.max
  assert.ok(Math.max(e.a, e.b, e.result) <= ceiling, `${where}: ${e.text} passes ${ceiling}`)
  if (e.op === '÷') assert.equal(e.a % e.b, 0, `${where}: ${e.text} has a remainder`)
}

for (const cfg of CLASSES.filter((c) => c.available)) {
  const at = `class ${cfg.id}`
  for (let i = 0; i < 300; i++) {
    // The five operation pages draw single expressions straight from expr()
    for (const op of cfg.ops) checkExpr(expr(op, cfg), cfg, `${at} ${op}`)

    // Tiles: six pairs, every result unique so each pair is unambiguous
    const tiles = tilesRound(cfg)
    assert.equal(tiles.exprs.length, 6)
    assert.equal(new Set(tiles.exprs.map((e) => e.result)).size, 6)
    assert.deepEqual([...tiles.results].sort(asc), tiles.exprs.map((e) => e.result).sort(asc))
    for (const e of tiles.exprs) checkExpr(e, cfg, `${at} tiles`)

    // Domino: exactly one correct option, halves are real domino halves
    const dom = dominoRound(cfg)
    assert.equal(dom.a + dom.b, dom.total)
    assert.ok(dom.total <= gameMax('domino', cfg), `${at} domino: ${dom.total} passes the sum ceiling`)
    assert.equal(dom.options.length, 4)
    assert.equal(dom.options.filter(([x, y]) => x + y === dom.total).length, 1)
    for (const [x, y] of dom.options) assert.ok(x >= 0 && x <= 6 && y >= 0 && y <= 6)

    // Compare: the stated answer is true and both sides stay in range
    const cmp = compareRound(cfg)
    const truth = cmp.left.value < cmp.right.value ? '<' : cmp.left.value > cmp.right.value ? '>' : '='
    assert.equal(cmp.answer, truth)
    for (const side of [cmp.left, cmp.right]) {
      assert.ok(side.value >= 0 && side.value <= cfg.max, `${at} compare: ${side.text} out of range`)
    }

    // Biggest: distinct numbers in range, answer matches what is asked
    const big = biggestRound(cfg)
    assert.equal(new Set(big.numbers).size, big.numbers.length)
    assert.ok(big.numbers.every((n) => n >= 1 && n <= cfg.max), `${at} biggest: out of range`)
    assert.equal(big.answer, Math[big.want](...big.numbers))

    // Ascending: five distinct numbers in range, sorted is really sorted
    const up = ascendingRound(cfg)
    assert.equal(new Set(up.numbers).size, 5)
    assert.ok(up.numbers.every((n) => n >= 1 && n <= cfg.max), `${at} ascending: out of range`)
    assert.deepEqual(up.sorted, [...up.numbers].sort(asc))

    // Missing: the answer completes the equation
    const mis = missingRound(cfg)
    checkExpr(mis, cfg, `${at} missing`)
    const a = mis.hide === 'a' ? mis.answer : mis.a
    const b = mis.hide === 'b' ? mis.answer : mis.b
    assert.equal(apply[mis.op](a, b), mis.result)
  }

  // Games the class has no operator for are not offered at all
  for (const id of ['multiply', 'divide', 'divide2']) {
    assert.equal(gameOffered(id, cfg), cfg.mulMax > 0, `${at}: ${id} offered wrongly`)
  }
  for (const id of ['addition', 'subtraction', 'missing', 'tiles', 'domino', 'compare']) {
    assert.ok(gameOffered(id, cfg), `${at}: ${id} should be offered`)
  }
}

console.log('generators: all checks passed')
