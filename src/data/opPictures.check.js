// Self-check for the operation pictures. Runs under plain node:
//   node src/data/opPictures.check.js
// Every number a kid can pick, every step: the dots, the jumps and the
// equations must all tell the same story.
import assert from 'node:assert/strict'
import { settle, rangeOf, allPicks, addPicture, subPicture, barsPicture, mulPicture, divPicture, KIDS } from './opPictures.js'
import { holds } from '../games/mathParts.js'

const count = (list, kind) => list.filter((x) => x === kind).length

// a line's jumps chain from start to its end, inside the axis
function checkLine(line, where) {
  const on = line.jumps.filter((j) => j.on)
  let at = line.start
  for (const j of on) {
    assert.equal(j.from, at, `${where}: a jump starts at ${j.from}, not ${at}`)
    at = j.to
  }
  assert.equal(at, line.end, `${where}: the jumps end at ${at}, the dot at ${line.end}`)
  for (const j of line.jumps) {
    assert.ok(j.from >= line.lo && j.to <= line.hi && j.to >= line.lo && j.from <= line.hi, `${where}: a jump off the axis`)
    assert.equal(j.label, `${j.to > j.from ? '+' : '−'}${Math.abs(j.to - j.from)}`, `${where}: jump label ${j.label}`)
  }
  for (const t of line.ticks) assert.ok(t.n >= line.lo && t.n <= line.hi, `${where}: tick ${t.n} off the axis`)
}

for (const pick of allPicks('add')) {
  const { a, b } = pick
  assert.ok(a + b >= 11 && a + b <= 18, `add ${a} + ${b} does not cross ten`)
  for (const step of [0, 1, 2]) {
    const p = addPicture(pick, step)
    const where = `add ${a} + ${b} step ${step}`
    checkLine(p.line, where)
    assert.equal(count(p.cells, 'start'), a, where)
    assert.equal(count(p.cells, 'added'), [0, 10 - a, b][step], where)
    if (step) assert.ok(holds(p.eq), `${where}: ${p.eq.join(' ')}`)
  }
  // the bracket holds the split: its two parts add up to b
  assert.deepEqual(addPicture(pick, 2).eq.slice(2, 7), ['(', 10 - a, '+', b - (10 - a), ')'])
  // the whole sum: the first frame full, the rest in the second
  const done = addPicture(pick, 2)
  assert.ok(done.cells.slice(0, 10).every((c) => c !== 'empty'), `add ${a} + ${b}: the first frame is not full`)
  assert.equal(done.cells.length - count(done.cells, 'empty'), a + b)
}

for (const pick of allPicks('sub')) {
  const { m, s } = pick
  assert.ok(m - s >= 2 && m - s <= 9, `sub ${m} − ${s} does not cross ten`)
  for (const step of [0, 1, 2]) {
    const p = subPicture(pick, step)
    const where = `sub ${m} − ${s} step ${step}`
    checkLine(p.line, where)
    assert.equal(count(p.cells, 'start') + count(p.cells, 'gone'), m, where)
    assert.equal(count(p.cells, 'gone'), [0, m - 10, s][step], where)
    if (step) assert.ok(holds(p.eq), `${where}: ${p.eq.join(' ')}`)
  }
  assert.deepEqual(subPicture(pick, 2).eq.slice(2, 7), ['(', m - 10, '+', s - (m - 10), ')'])
  // after step 1 exactly ten are left, the first frame
  assert.equal(count(subPicture(pick, 1).cells, 'start'), 10)
}

for (const pick of allPicks('bars')) {
  const p = barsPicture(pick)
  assert.equal(count(p.ola, 'same') + count(p.ola, 'more'), pick.o)
  assert.equal(count(p.tomek, 'same'), pick.t)
  assert.equal(count(p.ola, 'more'), pick.o - pick.t)
  assert.ok(holds(p.eq) && pick.o - pick.t >= 1)
}

for (const pick of allPicks('mul')) {
  for (const turned of [false, true]) {
    const p = mulPicture(pick, turned)
    const where = `mul ${pick.r} × ${pick.c}${turned ? ' turned' : ''}`
    assert.equal(p.dots.length, pick.r * pick.c, where)
    assert.equal(p.rows * p.cols, pick.r * pick.c, where)
    assert.ok(holds(p.eq), where)
    checkLine(p.line, where)
  }
  const p = mulPicture(pick, false)
  assert.equal(p.groups.reduce((s, g) => s + g, 0), pick.r * pick.c)
  if (pick.r <= 5) assert.ok(holds([...p.sum, '=', pick.r * pick.c]), `mul sum ${p.sum.join(' ')}`)
}

for (const pick of allPicks('div')) {
  const { d, q, r } = pick
  assert.ok(r >= 1 && r < d && d <= KIDS.length, `div ${d} ${q} ${r}`)
  for (let round = 0; round <= q; round++) {
    const p = divPicture(pick, round)
    const where = `div ${d * q} : ${d} round ${round}`
    assert.equal(p.pool + p.kids.reduce((s, k) => s + k, 0), d * q, `${where}: sweets lost`)
    assert.equal(p.kids.length, d)
    if (p.done) assert.ok(holds(p.eq), where)
  }
  const p = divPicture(pick, 0)
  assert.equal(p.bags.length * d, p.n, 'the bags hold every sweet')
  // the remainder sum: total = d × q + r, and r is what does not fill a bag
  const [total, , divisor, , quotient, , rest] = p.restEq
  assert.equal(total, divisor * quotient + rest)
  assert.ok(rest < divisor)
}

// settling: out-of-range numbers come back in range, and a change to an
// earlier number pulls a later one back into its new range
assert.deepEqual(settle('add', { a: 99, b: -4 }), { a: 9, b: 2 })
assert.deepEqual(settle('add', { a: 2, b: 5 }), { a: 2, b: 9 })
assert.deepEqual(settle('sub', { m: 18, s: 5 }), { m: 18, s: 9 })
assert.deepEqual(settle('div', { d: 2, q: 3, r: 4 }), { d: 2, q: 3, r: 1 })
assert.deepEqual(rangeOf('add', { a: 3 }, 'b'), [8, 9])
assert.deepEqual(settle('mul'), { r: 3, c: 4 })

console.log('opPictures: all checks passed')
