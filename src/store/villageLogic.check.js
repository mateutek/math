import assert from 'node:assert/strict'
import { BUILDINGS, SHOP_RATE } from '../data/buildings.js'
import {
  fresh, applyReward, applyBuild, applyTrade, nextBuilding, goalFor, touchDay, encode, decode,
  neededMaterial,
} from './villageLogic.js'

// 1. reward adds the right material, ignores unknown kinds and bad amounts
let s = applyReward(fresh(), 'wood', 2)
assert.equal(s.materials.wood, 2)
assert.deepEqual(applyReward(s, 'gold', 1), s)
assert.deepEqual(applyReward(s, 'wood', -1), s)
assert.deepEqual(applyReward(s, 'wood', 1.5), s)

// 2. build deducts cost and adds the building
s = applyReward(fresh(), 'wood', 7)
const built = applyBuild(s, 'hut')
assert.equal(built.materials.wood, 2)
assert.deepEqual(built.buildings, [{ id: 'hut', tier: 1 }])
assert.equal(s.buildings.length, 0, 'input state must not be mutated')

// 3. build refuses when short and leaves state unchanged
const poor = applyReward(fresh(), 'wood', 4)
const snapshot = structuredClone(poor)
assert.equal(applyBuild(poor, 'hut'), null)
assert.deepEqual(poor, snapshot)

// 4. build refuses a building that is out of unlock order
const rich = { ...fresh(), materials: { wood: 9999, stone: 9999, food: 9999, coins: 9999 } }
assert.equal(applyBuild(rich, 'castle'), null)
assert.equal(applyBuild(rich, 'ufo'), null)
assert.equal(nextBuilding(rich).id, 'hut')

// upgrades walk the tiers and stop at the last one
let maxed = rich
for (let i = 0; i < 3; i++) maxed = applyBuild(maxed, 'hut')
assert.equal(maxed.buildings[0].tier, 3)
assert.equal(goalFor(maxed, 'hut'), null)
assert.equal(applyBuild(maxed, 'hut'), null)
assert.equal(nextBuilding(maxed).id, 'well')

// 5. export then import round-trips
assert.deepEqual(decode(encode(built)), built)

// 6. garbage never gets through
const bad = [
  '', 'not base64!!', null, 42,
  btoa('{"v":2}'),
  btoa('[1,2]'),
  btoa(JSON.stringify({ ...fresh(), materials: { wood: -1, stone: 0, food: 0, coins: 0 } })),
  btoa(JSON.stringify({ ...fresh(), materials: { wood: 1 } })),
  btoa(JSON.stringify({ ...fresh(), buildings: [{ id: 'ufo', tier: 1 }] })),
  btoa(JSON.stringify({ ...fresh(), buildings: [{ id: 'hut', tier: 9 }] })),
  btoa(JSON.stringify({ ...fresh(), buildings: [{ id: 'hut', tier: 1 }, { id: 'hut', tier: 2 }] })),
]
for (const str of bad) assert.equal(decode(str), null, `should reject ${str}`)

// 7. shop: one coin buys SHOP_RATE of a material, one way only
const shopper = { ...fresh(), materials: { wood: 0, stone: 0, food: 0, coins: 2 } }
assert.deepEqual(applyTrade(shopper, 'stone').materials, { wood: 0, stone: SHOP_RATE, food: 0, coins: 1 })
assert.equal(applyTrade(shopper, 'coins'), null)
assert.equal(applyTrade(shopper, 'gold'), null)
assert.equal(applyTrade(fresh(), 'wood'), null)
assert.equal(shopper.materials.coins, 2, 'input state must not be mutated')

// day streak: first day, same day, next day, gap
let d = touchDay(fresh(), '2026-09-17')
assert.equal(d.dayStreak, 1)
assert.equal(touchDay(d, '2026-09-17'), d)
d = touchDay(d, '2026-09-18')
assert.equal(d.dayStreak, 2)
d = touchDay(d, '2026-09-25')
assert.equal(d.dayStreak, 1)

// neededMaterial: what the next unbuilt building is shortest of. The first
// building is the hut (5 wood), the third the farm (8 wood, 4 food).
assert.equal(neededMaterial(fresh()), 'wood')
const twoBuilt = { ...fresh(), buildings: [{ id: 'hut', tier: 1 }, { id: 'well', tier: 1 }] }
assert.equal(neededMaterial({ ...twoBuilt, materials: { wood: 8, stone: 0, food: 0, coins: 0 } }), 'food')
assert.equal(neededMaterial({ ...twoBuilt, materials: { wood: 1, stone: 0, food: 3, coins: 0 } }), 'wood')
// nothing missing, and a finished village, both fall back to wood
assert.equal(neededMaterial({ ...twoBuilt, materials: { wood: 99, stone: 99, food: 99, coins: 0 } }), 'wood')
assert.equal(
  neededMaterial({ ...fresh(), buildings: BUILDINGS.map((d) => ({ id: d.id, tier: 1 })) }),
  'wood',
)

console.log('villageLogic: all checks passed')
