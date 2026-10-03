// Self-check for geometry. Runs under plain node:
//   node src/games/geometry.check.js
// Every task is laid out exactly as GeoFigure.vue draws it, then measured:
// each labelled angle and length must be what the picture shows, the '?' must
// measure as the answer, and areas and perimeters are worked out again from
// the drawn corners (the shoelace formula, not the generator's).
import assert from 'node:assert/strict'
import { layout, angleKind, QUAD_NAMES } from './geometry.js'
import { LEVELS, topicTask, kindsFor } from './topics.js'

const RUNS = 1500
const near = (a, b) => Math.abs(a - b) < 1e-6

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]]
const len = (v) => Math.hypot(v[0], v[1])
const cross = (u, v) => u[0] * v[1] - u[1] * v[0]
// the angle counter-clockwise from ray v->p to ray v->q, 0 to 360
function ccw(v, p, q) {
  const a = Math.atan2(p[1] - v[1], p[0] - v[0])
  const b = Math.atan2(q[1] - v[1], q[0] - v[0])
  return ((((b - a) * 180) / Math.PI) % 360 + 360) % 360
}
const shoelace = (ps) => Math.abs(ps.reduce((s, p, i) => s + cross(p, ps[(i + 1) % ps.length]), 0)) / 2
const perimeter = (ps) => ps.reduce((s, p, i) => s + len(sub(ps[(i + 1) % ps.length], p)), 0)

// what a four-cornered outline is, read off its corners alone
function quadName(ps) {
  const sides = ps.map((p, i) => sub(ps[(i + 1) % 4], p))
  const parallel = [near(cross(sides[0], sides[2]), 0), near(cross(sides[1], sides[3]), 0)].filter(Boolean).length
  const equal = sides.every((s) => near(len(s), len(sides[0])))
  const right = near(sides[0][0] * sides[1][0] + sides[0][1] * sides[1][1], 0)
  if (parallel === 1) return 'trap'
  assert.equal(parallel, 2, 'a quadrilateral with no parallel sides')
  return equal ? (right ? 'square' : 'rhombus') : right ? 'rect' : 'para'
}

function check(task, where) {
  const fig = task.parts[0].fig
  const L = layout(fig)
  const P = (n) => L.pts[n]
  const fillQ = (label) => (label === '?' ? task.answer : label)

  // every labelled angle is the angle drawn, the '?' one is the answer
  for (const arc of L.arcs) {
    const drawn = ccw(P(arc.at), P(arc.from), P(arc.to))
    assert.ok(drawn > 0 && drawn < 360, `${where}: a ${drawn}° arc`)
    if (arc.label !== null) assert.ok(near(drawn, fillQ(arc.label)), `${where}: ${arc.label} drawn as ${drawn}`)
    // nothing so thin a kid cannot see it
    if (fig.shape !== 'angle') assert.ok(drawn >= 20 - 1e-9, `${where}: a ${drawn}° sliver`)
  }
  for (const e of L.edges) assert.ok(near(len(sub(P(e.b), P(e.a))), e.label), `${where}: ${e.label} cm drawn wrong`)
  for (const r of L.rights) assert.ok(near(ccw(P(r.at), P(r.from), P(r.to)), 90), `${where}: a square mark on no right angle`)
  for (const [a, b] of L.ticks) assert.ok(near(len(sub(P(b), P(a))), len(sub(P(L.ticks[0][1]), P(L.ticks[0][0])))), `${where}: marked sides differ`)
  if (L.poly) {
    // counter-clockwise and convex: every corner turns left
    const ps = L.poly.map(P)
    ps.forEach((p, i) => {
      const turn = cross(sub(ps[(i + 1) % ps.length], p), sub(ps[(i + 2) % ps.length], ps[(i + 1) % ps.length]))
      assert.ok(turn > 0, `${where}: the outline is not convex counter-clockwise`)
    })
  }

  if (task.kind === 'number') {
    assert.ok(Number.isInteger(task.answer) && task.answer > 0, `${where}: answer ${task.answer}`)
    const ps = L.poly?.map(P)
    if (task.prompt === 'geoArea') assert.ok(near(shoelace(ps), task.answer), `${where}: area ${shoelace(ps)} is not ${task.answer}`)
    else if (task.prompt === 'geoPerimeter') assert.ok(near(perimeter(ps), task.answer), `${where}: perimeter is not ${task.answer}`)
    else assert.equal(task.prompt, 'geoAngle', where)
    // an angle task hides one angle, the others hide nothing in the figure
    const hidden = L.arcs.filter((a) => a.label === '?').length
    assert.equal(hidden, task.prompt === 'geoAngle' ? 1 : 0, `${where}: ${hidden} hidden angles`)
    assert.equal(task.unit, task.prompt === 'geoAngle' ? '°' : task.prompt === 'geoArea' ? 'cm²' : 'cm', where)
    return
  }

  assert.equal(task.kind, 'pick', where)
  const words = task.options.map((o) => o[0].t)
  assert.equal(new Set(words).size, words.length, `${where}: two tiles say the same`)
  assert.ok(words.length >= 2 && words.length <= 4, where)
  if (task.prompt === 'geoAngleType') {
    const drawn = ccw(P('O'), P('P'), P('Q'))
    assert.equal(words[task.answer], `geo_${angleKind(Math.round(drawn))}`, `${where}: ${drawn}° marked ${words[task.answer]}`)
  } else if (task.prompt === 'geoQuadName') {
    assert.equal(words[task.answer], `geo_${quadName(L.poly.map(P))}`, `${where}: the wrong name is marked right`)
    for (const w of words) assert.ok(QUAD_NAMES.includes(w.slice(4)), w)
  } else {
    assert.equal(task.prompt, 'geoCanTriangle', where)
    const [a, b, c] = [...fig.sides].sort((x, y) => x - y)
    assert.equal(task.answer, a + b > c ? 0 : 1, `${where}: ${fig.sides} answered wrong`)
  }
}

for (let cls = 4; cls <= 8; cls++) {
  for (const level of LEVELS) {
    const where = `geometry class ${cls} L${level}`
    const types = new Set()
    for (let i = 0; i < RUNS; i++) {
      const task = topicTask('geometry', level, cls)
      types.add(task.type)
      check(task, `${where} ${task.type}`)
    }
    assert.deepEqual([...types].sort(), kindsFor('geometry', cls).sort(), `${where} kinds`)
  }
}

// the curriculum's order: angle sums, the isosceles triangle and the other
// areas wait for class 5
assert.deepEqual(kindsFor('geometry', 4).sort(), ['angleType', 'perimeter', 'quadName', 'rectArea'])
assert.ok(kindsFor('geometry', 5).includes('triangleSum') && kindsFor('geometry', 5).includes('area'))

// the measuring itself: a known triangle and a known square
assert.ok(near(ccw([0, 0], [1, 0], [0, 1]), 90))
assert.ok(near(ccw([0, 0], [0, 1], [1, 0]), 270))
assert.ok(near(shoelace([[0, 0], [4, 0], [4, 3], [0, 3]]), 12))
assert.equal(quadName([[0, 0], [2, 0], [2, 2], [0, 2]]), 'square')
assert.equal(quadName([[0, 0], [5, 0], [4, 2], [1, 2]]), 'trap')
assert.equal(angleKind(90), 'right')

console.log('geometry: all checks passed')
