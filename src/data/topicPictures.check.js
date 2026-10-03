// Self-check for the topic pictures. Runs under plain node:
//   node src/data/topicPictures.check.js
// Every pick a kid can make: the parts drawn, the equations and the numbers
// in the sentences must agree.
import assert from 'node:assert/strict'
import { allPicks, settle } from './opPictures.js'
import {
  fractionsPicture, decimalsPicture, percentsPicture, powersPicture, negativesPicture,
  equationsPicture, EQ_LAST_STEP, averagePicture, pythagorasPicture, TRIPLES,
} from './topicPictures.js'
import { holds } from '../games/mathParts.js'

const on = (cells) => cells.filter(Boolean).length
// an x in an equation becomes k × x before it is checked
const fillX = (parts, x) => parts.map((p) => (p && p.x !== undefined ? p.x * x : p))

for (const pick of allPicks('fractions')) {
  const p = fractionsPicture(pick)
  assert.equal(on(p.bar), pick.n)
  assert.equal(p.bar.length, pick.d)
  assert.ok(p.scaled.length <= 24, 'a scaled bar of more than 24 parts')
  // the same share of the whole, drawn and written
  assert.equal(on(p.scaled) * pick.d, pick.n * p.scaled.length)
  assert.ok(holds(p.eq), JSON.stringify(p.eq))
}

for (const pick of allPicks('decimals')) {
  const p = decimalsPicture(pick)
  assert.equal(on(p.grid), pick.h)
  assert.ok(holds(p.eq))
  assert.equal(p.vars.tenths * 10 + p.vars.hundredths, pick.h)
  // the filled cells are whole columns first: column c is full once h > 10c + 9
  for (let col = 0; col < p.vars.tenths; col++) {
    assert.ok([...Array(10).keys()].every((row) => p.grid[row * 10 + col]), `decimals ${pick.h}: column ${col}`)
  }
}

for (const pick of allPicks('percents')) {
  const p = percentsPicture(pick)
  assert.equal(on(p.grid), p.vars.p)
  assert.ok(Number.isInteger(p.vars.part), `percents ${p.vars.p}% of ${p.vars.base}`)
  assert.ok(holds(p.eq) && holds(p.frac))
}

for (const pick of allPicks('powers')) {
  const p = powersPicture(pick)
  assert.ok(p.vars.value <= 1000, `powers ${pick.b}^${pick.e}`)
  assert.ok(holds(p.eq), JSON.stringify(p.eq))
  assert.ok(holds(p.root))
  assert.equal(p.square.length, pick.b * pick.b)
}

for (const pick of allPicks('negatives')) {
  const p = negativesPicture(pick)
  const { a, b } = pick
  assert.ok(a + b >= -10 && a + b <= 10, `negatives ${a} + ${b}`)
  assert.ok(holds(p.eq), JSON.stringify(p.eq))
  const { line } = p
  assert.equal(line.jumps[0].from, a)
  assert.equal(line.jumps[0].to, a + b)
  assert.ok(line.ticks.some((t) => t.n === 0 && t.key), 'zero is always on the line')
  for (const t of line.ticks) assert.ok(!(t.key && t.quiet), 'a key number left unlabelled')
}

for (const pick of allPicks('equations')) {
  for (let step = 0; step <= EQ_LAST_STEP; step++) {
    const p = equationsPicture(pick, step)
    const where = `equations ${JSON.stringify(pick)} step ${step}`
    assert.ok(holds(fillX(p.eq, pick.x)), `${where}: ${JSON.stringify(p.eq)}`)
    // the balance balances: boxes worth x each plus weights, on both sides
    const left = p.left.boxes * pick.x + p.left.weights
    assert.equal(left, p.right.weights, where)
    assert.equal(p.left.taken, p.right.taken, `${where}: taken from one pan only`)
    assert.ok(p.vars.c <= 24, `${where}: ${p.vars.c} weights`)
    if (p.right.groups > 1) assert.equal(p.right.weights % p.right.groups, 0, `${where}: groups do not split evenly`)
  }
}

for (const pick of allPicks('pythagoras')) {
  const p = pythagorasPicture(pick)
  assert.equal(p.a ** 2 + p.b ** 2, p.c ** 2)
  assert.ok(holds(p.eq))
}
assert.equal(TRIPLES.length, 5)

// the mean: every n, and a spread of values (all of them would be 100 000 picks)
for (let n = 2; n <= 5; n++) {
  for (let seed = 0; seed < 400; seed++) {
    const vals = Array.from({ length: 5 }, (_, i) => 1 + ((seed * (i + 3) * 7 + i) % 10))
    const pick = settle('average', { n, v1: vals[0], v2: vals[1], v3: vals[2], v4: vals[3], v5: vals[4] })
    const p = averagePicture(pick)
    assert.equal(p.vals.length, n)
    assert.ok(holds(p.eq), JSON.stringify(p.eq))
    assert.ok(Math.abs(p.mean * n - p.vals.reduce((s, x) => s + x, 0)) < 1e-9)
  }
}

console.log('topicPictures: all checks passed')

// ---- geometry, comparing, the order of operations -------------------------
const { anglesPicture, trianglesPicture, sidesPicture, quadsPicture, perimeterPicture, areaPicture, comparePicture, orderPicture } =
  await import('./topicPictures.js')
const { figureErrors, outline, shoelace, perimeter, quadName } = await import('../games/geoMeasure.js')
const { angleKind } = await import('../games/geometry.js')
const noErrors = (fig, where) => assert.deepEqual(figureErrors(fig), [], `${where}: ${JSON.stringify(fig)}`)

for (const pick of allPicks('angles')) {
  const p = anglesPicture(pick)
  noErrors(p.angle, 'angle')
  noErrors(p.line, 'line')
  noErrors(p.cross, 'cross')
  assert.ok(holds(p.lineEq))
  assert.ok(['acute', 'right', 'obtuse', 'straight', 'reflex'].includes(angleKind(p.deg)))
}
for (const pick of allPicks('triangles')) {
  const p = trianglesPicture(pick)
  noErrors(p.sum, 'triangle')
  noErrors(p.iso, 'isosceles')
  assert.ok(holds(p.sumEq) && holds(p.isoEq))
}
for (const pick of allPicks('sides')) {
  const p = sidesPicture(pick)
  noErrors(p.bars, 'bars')
  assert.ok(holds(p.eq), JSON.stringify(p.eq))
  if (p.ok) noErrors(p.tri, 'tri3')
  assert.equal(p.ok, p.tri !== null)
}
for (const pick of allPicks('quads')) {
  const p = quadsPicture(pick)
  noErrors(p.fig, p.name)
  assert.equal(quadName(outline(p.fig)), p.name, `quads: the ${p.name} drawn is a ${quadName(outline(p.fig))}`)
}
for (const pick of allPicks('perimeter')) {
  const p = perimeterPicture(pick)
  noErrors(p.fig, 'rect')
  assert.ok(holds(p.eq))
  assert.ok(Math.abs(perimeter(outline(p.fig)) - p.vars.p) < 1e-9)
}
for (const pick of allPicks('area')) {
  const p = areaPicture(pick)
  assert.equal(p.cells.length, pick.a * pick.b)
  assert.ok(holds(p.rectEq) && holds(p.triEq))
  assert.ok(Math.abs(shoelace(outline({ shape: 'triH', a: pick.ta, h: pick.th, o: 1 })) - (pick.ta * pick.th) / 2) < 1e-9)
}
for (const pick of allPicks('compare')) {
  const p = comparePicture(pick)
  assert.ok(holds(p.eq), JSON.stringify(p.eq))
  assert.equal(p.left.tens * 10 + p.left.ones, pick.x)
}
for (const pick of allPicks('order')) {
  for (const brackets of [false, true]) assert.ok(holds(orderPicture(pick, brackets).eq))
}

console.log('topicPictures (geometry and the rest): all checks passed')
