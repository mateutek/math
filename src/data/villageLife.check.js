// Self-check for who walks where in the village. Runs under plain node:
//   node src/data/villageLife.check.js
import assert from 'node:assert/strict'
import { BUILDINGS } from './buildings.js'
import {
  PROJ, PATH_ROW, RIVER_COL, PLOTS, PLOT_CELLS, DECOR_CELLS, cellsOf, groundAt, rotFace, rotOffset,
} from './villageMap.js'
import { CAST, canStand, cast, faceOf, spawn, tick } from './villageLife.js'
import ACTORS from './villageActors.json' with { type: 'json' }

const N = PROJ.GRID

// small seeded generator, so a failure replays
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// facings agree with the map's own turn, at every rotation
for (const step of [[0, 1], [-1, 0], [0, -1], [1, 0]]) {
  for (let r = 0; r < 4; r++) {
    // + 0 turns a -0 from the rotation into 0
    const turn = (d) => d.map((v) => v + 0)
    assert.deepEqual(turn(rotOffset([0, 1], 'NESW'.indexOf(rotFace(faceOf(step), r)))), turn(rotOffset(step, r)))
  }
}

const full = Object.fromEntries(BUILDINGS.map((d) => [d.id, 1]))
const noBridge = { ...full, bridge: 0 } // unbuilt, as the map stores it

// cast size: empty village has only the wood animals; full has 12 villagers + 6 pets
assert.deepEqual(cast({}).map((w) => w.id).sort(), ['bunny', 'fox'])
assert.equal(cast(full).length, 12 + 6)
assert.equal(new Set(Object.values(CAST)).size, 12)
assert.equal(Object.keys(CAST).length, 12)

// every walker has its clips in all four facings; a missing row throws inside
// the animation frame and stops everyone
for (const w of cast(full)) {
  for (const clip of ['walk', w.rest]) {
    for (const F of 'NESW') assert.equal(ACTORS[w.actor]?.[clip]?.[F]?.length, 4, `${w.id} ${w.actor} ${clip} ${F}`)
  }
}

const cheb = (a, b, [x, y]) => Math.max(Math.abs(a - x), Math.abs(b - y))
const nearHome = (a, b, w, tiers) =>
  cellsOf(w.homeId, tiers[w.homeId]).some(([dx, dy]) => cheb(a, b, [PLOTS[w.homeId][0] + dx, PLOTS[w.homeId][1] + dy]) <= w.radius)
const key = (a, b) => `${a},${b}`

// the tower villager, cut off by the river, spawns on its far side
const tower = cast(noBridge).find((w) => w.id === 'tower')
assert.ok(spawn(tower, noBridge, seeded(1)).a > RIVER_COL)

// a yard with its home unbuilt has no allowed cell, so spawn gives null
assert.equal(spawn({ ...tower, ground: 'yard', homeId: 'farm', radius: 3 }, {}, seeded(1)), null)

let dogOnRoad = false
let dogOnGrass = false
for (const [name, tiers] of [['full', full], ['noBridge', noBridge]]) {
  const rand = seeded(7)
  const sides = {} // per road walker: which banks of the river it has stood on
  for (const w of cast(tiers)) {
    const s = spawn(w, tiers, rand)
    assert.ok(canStand(w, s.a, s.b, tiers), `${name} ${w.id} spawn`)
    for (let i = 0; i < 2000 * 30; i++) {
      tick(s, w, tiers, 1 / 30, rand)
      assert.ok(canStand(w, s.a, s.b, tiers), `${name} ${w.id} at ${s.a},${s.b}`)
      if (s.to) assert.ok(canStand(w, s.to[0], s.to[1], tiers), `${name} ${w.id} to ${s.to}`)
      if (w.ground === 'road') {
        if (name === 'noBridge') assert.ok(!(s.a === RIVER_COL && s.b === PATH_ROW), 'swam')
        if (s.a !== RIVER_COL) (sides[w.id] ??= new Set()).add(s.a < RIVER_COL)
      }
      if (w.ground === 'yard') {
        assert.ok(nearHome(s.a, s.b, w, tiers), `${w.id} strayed`)
        assert.ok(!PLOT_CELLS.some(([x, y]) => x === s.a && y === s.b) && !DECOR_CELLS.has(key(s.a, s.b)) && s.a !== RIVER_COL, `${w.id} blocked cell`)
        if (w.id === 'dog' && groundAt(s.a, s.b)[0] !== 'grass_center') dogOnRoad = true
        if (w.id === 'dog' && groundAt(s.a, s.b)[0] === 'grass_center') dogOnGrass = true
      }
      if (w.id === 'fox') {
        assert.ok(Math.min(s.a, s.b, N - 1 - s.a, N - 1 - s.b) < 5 && !DECOR_CELLS.has(key(s.a, s.b)), 'fox')
      }
    }
    // one huge step still ends on an allowed cell
    tick(s, w, tiers, 600, rand)
    assert.ok(canStand(w, s.a, s.b, tiers), `${name} ${w.id} after 600s`)
  }
  const crossers = Object.values(sides).filter((v) => v.size === 2).length
  if (name === 'full') assert.ok(crossers > 0, 'a walker crosses the bridge')
  else assert.equal(crossers, 0, 'nobody crosses without a bridge')
}

// the dog roams: it leaves the road onto grass and uses the road too
assert.ok(dogOnGrass && dogOnRoad, 'dog roams')

// tiers changing under a walker: it keeps to cells that are allowed now
const w = cast(noBridge).find((x) => x.id === 'hut')
const s = spawn(w, noBridge, seeded(3))
tick(s, w, full, 600, seeded(4))
assert.ok(canStand(w, s.a, s.b, full))

// villagers go into built buildings, never stay in longer than the longest
// wait, and never go into one that is not built
{
  const tiers = { ...full, library: 0 }
  const rand = seeded(7)
  let visits = 0
  for (const w of cast(tiers).filter((x) => x.ground === 'road')) {
    const s = spawn(w, tiers, rand)
    let inside = 0
    for (let i = 0; i < 6000; i++) {
      tick(s, w, tiers, 0.1, rand)
      if (!s.door) { inside = 0; continue }
      if (inside === 0) {
        visits++
        assert.notDeepEqual([s.a, s.b], [PLOTS.library[0], PLOTS.library[1] + 1], `${w.id} went into the unbuilt library`)
      }
      inside += 0.1
      assert.ok(inside <= 12.2, `${w.id} stuck inside at ${s.a},${s.b}`)
    }
  }
  assert.ok(visits > 10, `villagers visit buildings (${visits})`)
}

console.log('villageLife ok')
