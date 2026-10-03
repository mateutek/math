// Self-check for geometry. Runs under plain node:
//   node src/games/geometry.check.js
// Every task is laid out exactly as GeoFigure.vue draws it, then measured:
// each labelled angle and length must be what the picture shows, the '?' must
// measure as the answer, and areas and perimeters are worked out again from
// the drawn corners (the shoelace formula, not the generator's).
import assert from 'node:assert/strict'
import { layout, angleKind, QUAD_NAMES } from './geometry.js'
import { near, ccw, shoelace, perimeter, quadName, figureErrors } from './geoMeasure.js'
import { LEVELS, topicTask, kindsFor } from './topics.js'

const RUNS = 1500

function check(task, where) {
  const fig = task.parts[0].fig
  const L = layout(fig)
  const P = (n) => L.pts[n]
  assert.deepEqual(figureErrors(fig, task.answer), [], `${where}: ${JSON.stringify(fig)}`)

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
assert.equal(quadName([[0, 0], [5, 0], [4, 3], [1, 2]]), null)
assert.deepEqual(figureErrors({ shape: 'triangle', angles: { A: 50, B: 60, C: 70 } }), [])
assert.notDeepEqual(figureErrors({ shape: 'line', angles: [50, 140] }), [], 'a wrong label is caught')
assert.equal(angleKind(90), 'right')

console.log('geometry: all checks passed')
