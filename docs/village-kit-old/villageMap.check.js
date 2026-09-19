// Self-check for the village map geometry. Runs under plain node:
//   node src/data/villageMap.check.js
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { BUILDINGS } from './buildings.js'
import {
  PROJ, SCALE, HALF, LIFT, BUILDING_ART, CONNECTS, PLOTS, DECOR,
  allSpriteFiles, cellX, cellY, fitArt, groundAt, mapItems, rotCell, rotFace, rotOffset,
  spriteX, spriteY,
} from './villageMap.js'

const N = PROJ.GRID
const cells = []
for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) cells.push([a, b])

// 1. four quarter turns are the identity, for cells, offsets and facings
for (const c of cells) assert.deepEqual(rotCell(c, 4), c, `cell ${c}`)
for (const d of [[0, 0], [1, 0], [0, -1], [2, 1], [-1, -2]]) {
  assert.deepEqual(rotOffset(d, 4), d, `offset ${d}`)
}
for (const f of ['N', 'E', 'S', 'W']) assert.equal(rotFace(f, 4), f)
// and one turn is a bijection, so no cell is ever lost or doubled
const landed = new Set(cells.map((c) => rotCell(c, 1).join(',')))
assert.equal(landed.size, cells.length)

// 2. the ground plan is the board's: 110 grass, 12 river, 11 path_E, 10 path_N,
//    1 crossing, and the road broken where it meets the river
const counts = {}
for (const [a, b] of cells) {
  const key = groundAt(a, b).join('_')
  counts[key] = (counts[key] ?? 0) + 1
}
assert.deepEqual(counts, {
  grass_center_N: 110,
  grass_river_E: 12,
  grass_path_E: 11,
  grass_path_N: 10,
  grass_pathCrossing_N: 1,
})

// 3. rotating the map keeps every road and river joint connected. Two
//    neighbouring tiles are joined when each one's piece points at the other.
const FACES = 'NESW'
const joints = (r) => {
  const at = new Map()
  for (const c of cells) {
    const [name, facing] = groundAt(c[0], c[1])
    const [ra, rb] = rotCell(c, r)
    at.set(`${ra},${rb}`, [name, rotFace(facing, r)])
  }
  const out = new Set()
  for (const [key, [name, facing]] of at) {
    if (!CONNECTS[name]) continue
    const [a, b] = key.split(',').map(Number)
    for (const d of CONNECTS[name]) {
      const [dx, dy] = rotOffset(d, FACES.indexOf(facing))
      const other = at.get(`${a + dx},${b + dy}`)
      if (!other || !CONNECTS[other[0]]) continue
      const back = CONNECTS[other[0]].some((e) => {
        const [ex, ey] = rotOffset(e, FACES.indexOf(other[1]))
        return ex === -dx && ey === -dy
      })
      if (back) out.add([key, `${a + dx},${b + dy}`].sort().join('|'))
    }
  }
  return out
}
const base = joints(0)
// 11 along the river, 11 down the road column, 9 across the road row: the row
// loses two because the board breaks the road at the river, where the bridge is
assert.equal(base.size, 31, 'connected road and river joints on the board')
for (let r = 1; r < 4; r++) {
  const turned = joints(r)
  assert.equal(turned.size, base.size, `joint count at rotation ${r}`)
  for (const j of base) {
    const moved = j
      .split('|')
      .map((k) => rotCell(k.split(',').map(Number), r).join(','))
      .sort()
      .join('|')
    assert.ok(turned.has(moved), `joint ${j} survives rotation ${r}`)
  }
}

// 4. the draw list is sorted back to front, and stably
const allTiers = Object.fromEntries(BUILDINGS.map((d) => [d.id, 3]))
for (let r = 0; r < 4; r++) {
  const { ground, objects, buildings } = mapItems(r, allTiers, null)
  assert.equal(ground.length, N * N)
  // strictly increasing on (depth, level, insertion index), so the order is
  // total and stable however the data is authored
  const key = (s) => [s.a + s.b, s.level, s.i]
  const before = (p, q) => {
    const x = key(p)
    const y = key(q)
    return x[0] !== y[0] ? x[0] < y[0] : x[1] !== y[1] ? x[1] < y[1] : x[2] < y[2]
  }
  for (const list of [ground, objects]) {
    for (let i = 1; i < list.length; i++) {
      assert.ok(before(list[i - 1], list[i]), `draw order at ${i} of rotation ${r}`)
    }
  }
  assert.equal(buildings.length, BUILDINGS.length)
}

// 5. every building fits the grid at every tier and every rotation, and no two
//    buildings ever want the same cell
for (let r = 0; r < 4; r++) {
  for (let tier = 1; tier <= 3; tier++) {
    const taken = new Map()
    const { buildings } = mapItems(r, Object.fromEntries(BUILDINGS.map((d) => [d.id, tier])), null)
    for (const b of buildings) {
      for (const [a, y] of b.cells) {
        assert.ok(a >= 0 && a < N && y >= 0 && y < N, `${b.id} cell ${a},${y} r${r} t${tier}`)
        assert.ok(!taken.has(`${a},${y}`), `${b.id} clashes with ${taken.get(`${a},${y}`)}`)
        taken.set(`${a},${y}`, b.id)
      }
    }
  }
}
// nothing is ever built on the road or on a decoration, and only the bridge
// stands on the river
const decorCells = new Set(DECOR.map((d) => `${d[0]},${d[1]}`))
for (let r = 0; r < 4; r++) {
  for (let tier = 1; tier <= 3; tier++) {
    const { buildings } = mapItems(r, Object.fromEntries(BUILDINGS.map((d) => [d.id, tier])), null)
    for (const b of buildings) {
      for (const cell of b.cells) {
        // ask the base map, so the comparison is rotation independent
        const [ba, bb] = rotCell(cell, 4 - (r % 4))
        const piece = groundAt(ba, bb)[0]
        assert.ok(
          piece === 'grass_center' || (piece === 'grass_river' && b.id === 'bridge'),
          `${b.id} t${tier} stands on ${piece} at ${ba},${bb}`,
        )
        assert.ok(!decorCells.has(`${ba},${bb}`), `${b.id} t${tier} stands on decor ${ba},${bb}`)
      }
    }
  }
}

// the ghost of an unbuilt plot sits on its anchor, which is on the board's cell
for (const [id, cell] of Object.entries(PLOTS)) {
  assert.ok(BUILDINGS.some((d) => d.id === id), `${id} is a real building`)
  assert.ok(cell[0] >= 0 && cell[0] < N && cell[1] >= 0 && cell[1] < N)
}
assert.equal(Object.keys(PLOTS).length, BUILDINGS.length)
assert.equal(Object.keys(BUILDING_ART).length, BUILDINGS.length)

// 6. the projection still agrees with the design board's own formula
assert.equal(SCALE, 48 / 232)
assert.ok(Math.abs(HALF - 26.4828) < 0.001)
assert.ok(Math.abs(LIFT - 22.7586) < 0.001)
assert.equal(cellX(2, 5), (2 - 5) * 24)
assert.equal(cellY(2, 5), (2 + 5) * 12)
assert.equal(spriteX(2, 5), (2 - 5) * 24 - HALF)
assert.equal(spriteY(2, 5, 2), (2 + 5) * 12 - HALF - 2 * LIFT)

// 7. the goal-card thumbnail reproduces the design's own crop: the board draws
//    one structure_high sprite at left -3.7 top -39.7 sized 79.4 x 109.2 in a
//    72 x 69 box
const [thumb] = fitArt([[0, 0, 1, 'structure_high', 'N']], 72, 69)
for (const [got, want] of [
  [thumb.left, -3.7], [thumb.top, -39.7], [thumb.width, 79.4], [thumb.height, 109.2],
]) {
  assert.ok(Math.abs(got - want) < 0.1, `goal-card crop ${got} vs ${want}`)
}

// 8. every sprite the data can ask for is actually in public/village
const dir = join(dirname(fileURLToPath(import.meta.url)), '../../public/village')
const missing = allSpriteFiles().filter((f) => !existsSync(join(dir, f)))
assert.deepEqual(missing, [], 'sprite files present in public/village')
assert.ok(DECOR.length === 23, 'the board draws 23 decorations')

console.log('villageMap.check.js: ok')
