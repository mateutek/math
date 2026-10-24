// Self-check for the village map geometry. Runs under plain node:
//   node src/data/villageMap.check.js
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { BUILDINGS } from './buildings.js'
import SPRITES from './villageSprites.json' with { type: 'json' }
import {
  PROJ, SCALE, HALF, LIFT, GROUND_DY, CONNECTS, PLOTS, DECOR, TILES, DOORS, SPURS, PATH_COL, PATH_ROW, doorCell, LOOPS,
  allSpriteFiles, artBox, cellX, cellY, groundAt, mapItems, rotCell, rotFace, rotOffset,
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

// 2. the ground plan: a full river column, a full road column, one crossing,
//    and a road row broken where it meets the river. Garden paths are left out
//    here and checked on their own below.
const onPath = new Set(SPURS.flatMap((s) => s.cells.map((c) => c.join(','))))
const joins = [...new Set(SPURS.map((s) => s.cells.at(-1).join(',')))].map((k) => k.split(',').map(Number))
const counts = {}
for (const [a, b] of cells) {
  if (onPath.has(`${a},${b}`)) continue
  const key = groundAt(a, b).join('_')
  counts[key] = (counts[key] ?? 0) + 1
}
assert.deepEqual(counts, {
  grass_center_N: N * N - (3 * N - 2) - (onPath.size - joins.length),
  grass_river_E: N,
  grass_path_E: N - 1 - joins.filter(([a]) => a === PATH_COL).length,
  grass_path_N: N - 2 - joins.filter(([, b]) => b === PATH_ROW).length,
  grass_pathCrossing_N: 1,
})
// every door has a path: from the cell before it, over grass, to a road
assert.deepEqual(SPURS.map((s) => s.id), DOORS)
for (const { id, cells: trail } of SPURS) {
  assert.deepEqual(trail[0], doorCell(id), `${id} path starts at its door`)
  const [ja, jb] = trail.at(-1)
  assert.ok((ja === PATH_COL) !== (jb === PATH_ROW), `${id} path meets a road, not the crossing`)
  // the door cell's piece opens into the building
  const [da, db] = trail[0]
  const [name, facing] = groundAt(da, db)
  const inward = SPURS.find((s) => s.id === id).in
  assert.ok(CONNECTS[name].some((d) => rotOffset(d, 'NESW'.indexOf(facing)).join() === inward.join()), `${id} path reaches the door`)
  for (const c of trail) assert.ok(groundAt(...c)[0].startsWith('grass_path'), `${id} path at ${c}`)
}

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
// N-1 along the river, N-1 down the road column, N-3 across the road row: the
// row loses two because the road is broken at the river, where the bridge is
// plus one per garden path step
assert.equal(base.size, 3 * N - 5 + SPURS.reduce((n, s) => n + s.cells.length - 1, 0), 'connected road and river joints')
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
  assert.equal(buildings.length, BUILDINGS.length - 1)
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
// and nothing is ever drawn outside the canvas, however tall the render is
for (let r = 0; r < 4; r++) {
  for (let tier = 1; tier <= 3; tier++) {
    const { ground, objects } = mapItems(r, Object.fromEntries(BUILDINGS.map((d) => [d.id, tier])), null)
    for (const s of [...ground, ...objects.filter((o) => o.id)]) {
      assert.ok(
        s.x + PROJ.ORIGIN_X >= 0 && s.x + s.w + PROJ.ORIGIN_X <= PROJ.CANVAS_W &&
          s.y + PROJ.ORIGIN_Y >= 0 && s.y + s.h + PROJ.ORIGIN_Y <= PROJ.CANVAS_H,
        `${s.file} is clipped by the canvas at rotation ${r}`,
      )
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
// every building has a plot but the roads, which pave the ground instead
assert.deepEqual(BUILDINGS.filter((d) => !PLOTS[d.id]).map((d) => d.id), ['roads'])
// every ground piece the plan uses has a tile to draw it
for (const c of cells) assert.ok(TILES[groundAt(c[0], c[1])[0]], `tile for ${c}`)

// 6. the projection still agrees with the design board's own formula
assert.equal(SCALE, 48 / 232)
assert.ok(Math.abs(HALF - 26.4828) < 0.001)
assert.ok(Math.abs(LIFT - 22.7586) < 0.001)
assert.equal(cellX(2, 5), (2 - 5) * 24)
assert.equal(cellY(2, 5), (2 + 5) * 12)
assert.equal(spriteX(2, 5), (2 - 5) * 24 - HALF)
assert.equal(spriteY(2, 5, 2), (2 + 5) * 12 - HALF - 2 * LIFT)

// 7. a designer sprite lands its anchor on the cell's ground centre: a ground
//    block is exactly one cell wide, centred under that point, and at least a
//    cell deep (its earth sides hang below)
const tile = artBox('tile-grass', 1, 'N', 2, 5)
const [, , tileAx, tileAy] = SPRITES['tile-grass_t1'].N
assert.equal(tile.w, PROJ.TILE_W)
assert.ok(tile.h >= PROJ.TILE_H)
assert.equal(tile.x, cellX(2, 5) - tileAx * SCALE)
assert.equal(tile.x, cellX(2, 5) - PROJ.TILE_W / 2)
assert.ok(Math.abs(tile.y + tileAy * SCALE - (cellY(2, 5) + GROUND_DY)) < 1e-9)

// 8. every sprite the data can ask for is actually in public/village, and the
//    manifest is the designer's own numbers (stale means: npm run sprites)
const dir = join(dirname(fileURLToPath(import.meta.url)), '../../public/village')
for (const [key, meta] of Object.entries(SPRITES)) {
  const { footprint, views } = JSON.parse(readFileSync(join(dir, 'buildings', `${key}.json`)))
  assert.deepEqual(meta.footprint, footprint, `${key} footprint`)
  for (const f of 'NESW') {
    assert.deepEqual(meta[f], [views[f].w, views[f].h, ...views[f].anchor], `${key} ${f} is stale`)
  }
}
const missing = allSpriteFiles().filter((f) => !existsSync(join(dir, f)))
assert.deepEqual(missing, [], 'sprite files present in public/village')
// the mill's blades and the flags: drawn right after their building, and their
// files are in that list
for (const [id, [part, clip]] of Object.entries(LOOPS)) {
  for (let r = 0; r < 4; r++) {
    for (let t = 1; t <= 3; t++) {
      const keys = mapItems(r, { [id]: t }).objects.map((o) => o.key)
      assert.equal(keys[keys.indexOf(id) + 1], `${id}.${part}`, `${part} follow the ${id} at r${r} t${t}`)
      const file = `actors/${id}_t${t}_${part}_${clip}_${'NESW'[r]}`
      assert.ok(allSpriteFiles().includes(file + '.webp') && allSpriteFiles().includes(file + '.png'), file)
    }
  }
}
// the wood is generated: it must exist, stay on the land and never double up
assert.ok(DECOR.length > N, 'the land has trees')
assert.equal(new Set(DECOR.map((d) => `${d[0]},${d[1]}`)).size, DECOR.length)
for (const [a, b] of DECOR) assert.equal(groundAt(a, b)[0], 'grass_center', `decor on ${a},${b}`)

console.log('villageMap.check.js: ok')
