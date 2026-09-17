# Math Village Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six new math games, a localStorage-only village-building reward loop with a coin shop and an export/import save string, and a navigation that works as a phone app and as a two-column desktop page.

**Architecture:** Pure state logic (`villageLogic.js`) and pure task generators (`generators.js`) are plain ES modules checked with `node` and `assert`. A thin reactive store (`village.js`) wraps the logic and persists one `village` localStorage key. The six new games share one composable (`useRound`) and one shell component (`GameCard`). The village widgets (`NextGoal`, `ShopCard`, `BuildingList`, `RewardsCard`) are small components reused by the village page and by the desktop side column. The five existing operation pages are not refactored, they only gain reward and back-arrow lines.

**Tech Stack:** Vue 3 `<script setup>`, vue-router 4, @vueuse/core (`useClipboard`), reka-ui Sheet (already in `src/components/ui/sheet`), lucide-vue-next, Vite 6, plain CSS in `src/assets/design/kid.css`. Node 24 for checks.

**Spec:** `docs/superpowers/specs/2026-09-17-math-village-design.md`

**Visual reference:** the Claude Design canvas "Math Village redesign" (phone row and desktop row). The CSS in this plan implements it. Building art on the canvas and in `IsoBuilding.vue` is placeholder and will be swapped later, so keep all building drawing inside that one component.

## Global Constraints

- All code, art and text are original. No matzoo.pl images, texts or scripts.
- Persistence is localStorage only, plus the export string. No backend, no ads.
- No new dependencies.
- Existing URLs (`/dodawanie/1`, `/odejmowanie/1`, `/mnozenie/1`, `/dzielenie/1`, `/dzielenie2/1`) keep working.
- Every user-visible string goes through `t()` with a PL and an EN entry.
- NEVER use the em dash character anywhere: code, comments, docs, commit messages, UI strings. Use a hyphen.
- No emoji in the UI. Material icons are the drawn SVGs in `MaterialIcon.vue`; other icons come from lucide-vue-next.
- Subtraction is displayed with the minus sign `−` (U+2212), multiplication `×`, division `÷`, matching the existing pages.
- Use `npm run`, not yarn, for scripts.
- Do not refactor the five existing operation pages beyond the lines named in Task 8.
- Tap targets are at least 44px. Animations are disabled under `prefers-reduced-motion`.
- Breakpoints: below 768px is the phone layout (fixed bottom tabs). From 768px the tabs move into the header. From 1024px the page is a 1120px two-column layout (main column plus a 340px side column).
- Commit messages follow the repo style: one imperative sentence, no prefix (example: `Add PL/EN language switch`).

## File Structure

| File | Responsibility |
|---|---|
| `src/data/buildings.js` | Static building list, material keys, shop rate. No logic beyond cost tiers. |
| `src/store/villageLogic.js` | Pure functions on plain state objects. No Vue, no localStorage. |
| `src/store/villageLogic.check.js` | Node self-check for the logic. |
| `src/store/village.js` | Reactive wrapper, localStorage persistence, public actions. |
| `src/games/generators.js` | Pure task generators for the six games. |
| `src/games/generators.check.js` | Node self-check for the generators. |
| `src/composables/useRound.js` | Shared round state for the new games. |
| `src/components/GameCard.vue` | Shared card shell: back arrow, score, timer, stars, level pills, strikes, New button. |
| `src/pages/games/*.vue` | One file per game, only the game-specific board. |
| `src/components/MaterialIcon.vue` | The four drawn material icons. |
| `src/components/IsoBuilding.vue` | Draws one building as SVG from id and tier. Placeholder art, swappable. |
| `src/components/NextGoal.vue` | Goal card: building, one bar per material, Build button or link to the village. |
| `src/components/ShopCard.vue` | Trades 1 coin for `SHOP_RATE` of a material. |
| `src/components/BuildingList.vue` | All 12 buildings with built / next / locked state. Desktop only. |
| `src/components/RewardsCard.vue` | What the current game pays. Desktop side column only. |
| `src/pages/Village.vue` | Isometric map plus the village side column. |
| `src/data/games.js` | Game list grouped for the Play grid. |
| `src/pages/Play.vue` | Game grid. |
| `src/components/SettingsSheet.vue` | Language, timer, export, import, reset. |

---

### Task 1: Village logic and building data

**Files:**
- Create: `src/data/buildings.js`
- Create: `src/store/villageLogic.js`
- Test: `src/store/villageLogic.check.js`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildings.js`: `MATERIALS: string[]` = `['wood','stone','food','coins']`, `SHOP_RATE: number` = `2`, `BUILDINGS: {id: string, plot: [col, row], cost: Record<string,number>[]}[]` (array order is unlock order, `cost[tier-1]`).
  - `villageLogic.js`: `fresh(): State`, `validate(raw): State|null`, `applyReward(state, kind, amount): State`, `canAfford(state, cost): boolean`, `goalFor(state, id): {id, tier, cost}|null`, `nextBuilding(state): {id, tier, cost}|null`, `applyBuild(state, id): State|null`, `applyTrade(state, kind): State|null`, `touchDay(state, today: 'YYYY-MM-DD'): State`, `encode(state): string`, `decode(str): State|null`.
  - `State` = `{ v: 1, materials: {wood, stone, food, coins}, buildings: {id, tier}[], bestStreak: Record<string,number>, lastPlayed: string, dayStreak: number }`.
  - All functions return new objects and never mutate their input.

- [ ] **Step 1: Write the failing check**

Create `src/store/villageLogic.check.js`:

```js
import assert from 'node:assert/strict'
import { SHOP_RATE } from '../data/buildings.js'
import {
  fresh, applyReward, applyBuild, applyTrade, nextBuilding, goalFor, touchDay, encode, decode,
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

console.log('villageLogic: all checks passed')
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node src/store/villageLogic.check.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Create the building data**

Create `src/data/buildings.js`:

```js
export const MATERIALS = ['wood', 'stone', 'food', 'coins']

// One coin buys this many units of any material in the shop.
export const SHOP_RATE = 2

const scale = (cost, f) =>
  Object.fromEntries(
    Object.entries(cost)
      .filter(([k]) => k !== 'coins')
      .map(([k, n]) => [k, n * f]),
  )

// Tier 1 is the base cost. Tiers 2 and 3 cost 2x and 4x the materials plus
// coins, so upgrades reward accuracy (coins come from streaks only).
const tiers = (base, coins) => [
  base,
  { ...scale(base, 2), coins: (base.coins ?? 0) + coins },
  { ...scale(base, 4), coins: (base.coins ?? 0) + coins * 2 },
]

// Array order is the unlock order. plot is [col, row] on the 6x6 map.
// Row 3 is the path and [4,0] [5,0] [5,1] are the pond, so no plot sits there.
// Every number here is a tuning knob: retune after watching a real kid play.
export const BUILDINGS = [
  { id: 'hut', plot: [1, 1], cost: tiers({ wood: 5 }, 2) },
  { id: 'well', plot: [2, 2], cost: tiers({ wood: 8 }, 3) },
  { id: 'farm', plot: [0, 4], cost: tiers({ wood: 8, food: 4 }, 4) },
  { id: 'bakery', plot: [3, 1], cost: tiers({ wood: 10, food: 6 }, 5) },
  { id: 'school', plot: [4, 2], cost: tiers({ wood: 12, stone: 6, food: 4 }, 6) },
  { id: 'mill', plot: [1, 5], cost: tiers({ wood: 14, stone: 10, food: 6 }, 7) },
  { id: 'market', plot: [3, 4], cost: tiers({ wood: 16, stone: 12, food: 14 }, 8) },
  { id: 'library', plot: [0, 2], cost: tiers({ wood: 24, stone: 20, food: 14 }, 9) },
  { id: 'tower', plot: [5, 5], cost: tiers({ wood: 20, stone: 45, food: 15 }, 10) },
  { id: 'bridge', plot: [4, 1], cost: tiers({ wood: 50, stone: 40, food: 20 }, 11) },
  { id: 'townhall', plot: [2, 0], cost: tiers({ wood: 50, stone: 50, food: 30 }, 12) },
  { id: 'castle', plot: [4, 4], cost: tiers({ wood: 50, stone: 60, food: 40, coins: 20 }, 13) },
]
```

- [ ] **Step 4: Write the logic**

Create `src/store/villageLogic.js`:

```js
// Pure village rules. No Vue and no localStorage in here, so this file runs
// under plain node (see villageLogic.check.js). Every function returns a new
// state object and never mutates its input.
import { BUILDINGS, MATERIALS, SHOP_RATE } from '../data/buildings.js'

export const fresh = () => ({
  v: 1,
  materials: { wood: 0, stone: 0, food: 0, coins: 0 },
  buildings: [],
  bestStreak: {},
  lastPlayed: '',
  dayStreak: 0,
})

const isCount = (n) => Number.isInteger(n) && n >= 0

// Single gate for anything that did not come from this module: the
// localStorage load and the import string. Returns a rebuilt state so unknown
// keys never reach the store, or null.
export function validate(raw) {
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return null
  const m = raw.materials
  if (!m || typeof m !== 'object' || !MATERIALS.every((k) => isCount(m[k]))) return null
  if (!Array.isArray(raw.buildings)) return null
  const seen = new Set()
  for (const b of raw.buildings) {
    const def = BUILDINGS.find((d) => d.id === b?.id)
    if (!def || seen.has(b.id)) return null
    if (!Number.isInteger(b.tier) || b.tier < 1 || b.tier > def.cost.length) return null
    seen.add(b.id)
  }
  const best = raw.bestStreak ?? {}
  if (typeof best !== 'object' || !Object.values(best).every(isCount)) return null
  return {
    v: 1,
    materials: Object.fromEntries(MATERIALS.map((k) => [k, m[k]])),
    buildings: raw.buildings.map(({ id, tier }) => ({ id, tier })),
    bestStreak: { ...best },
    lastPlayed: /^\d{4}-\d{2}-\d{2}$/.test(raw.lastPlayed) ? raw.lastPlayed : '',
    dayStreak: isCount(raw.dayStreak) ? raw.dayStreak : 0,
  }
}

export function applyReward(state, kind, amount) {
  if (!MATERIALS.includes(kind) || !isCount(amount) || amount === 0) return state
  return { ...state, materials: { ...state.materials, [kind]: state.materials[kind] + amount } }
}

export const canAfford = (state, cost) =>
  Object.entries(cost).every(([k, n]) => state.materials[k] >= n)

const nextUnbuilt = (state) =>
  BUILDINGS.find((d) => !state.buildings.some((b) => b.id === d.id))

// What building `id` would cost right now: tier 1 if it is the next unbuilt
// one, the next tier if it is already built, null otherwise.
export function goalFor(state, id) {
  const def = BUILDINGS.find((d) => d.id === id)
  if (!def) return null
  const built = state.buildings.find((b) => b.id === id)
  const tier = (built?.tier ?? 0) + 1
  if (tier > def.cost.length) return null
  if (!built && nextUnbuilt(state)?.id !== id) return null
  return { id, tier, cost: def.cost[tier - 1] }
}

export function nextBuilding(state) {
  const def = nextUnbuilt(state)
  return def ? goalFor(state, def.id) : null
}

export function applyBuild(state, id) {
  const goal = goalFor(state, id)
  if (!goal || !canAfford(state, goal.cost)) return null
  const materials = { ...state.materials }
  for (const [k, n] of Object.entries(goal.cost)) materials[k] -= n
  const buildings =
    goal.tier === 1
      ? [...state.buildings, { id, tier: 1 }]
      : state.buildings.map((b) => (b.id === id ? { ...b, tier: goal.tier } : b))
  return { ...state, materials, buildings }
}

// Shop: one coin buys SHOP_RATE of a material. One way only, so coins stay a
// reward for accuracy and cannot be farmed from easy tasks.
export function applyTrade(state, kind) {
  if (kind === 'coins' || !MATERIALS.includes(kind) || state.materials.coins < 1) return null
  return {
    ...state,
    materials: {
      ...state.materials,
      coins: state.materials.coins - 1,
      [kind]: state.materials[kind] + SHOP_RATE,
    },
  }
}

export function touchDay(state, today) {
  if (state.lastPlayed === today) return state
  const y = new Date(today)
  y.setUTCDate(y.getUTCDate() - 1)
  const consecutive = state.lastPlayed === y.toISOString().slice(0, 10)
  return { ...state, lastPlayed: today, dayStreak: consecutive ? state.dayStreak + 1 : 1 }
}

// State is ASCII only (ids, numbers, dates), so plain btoa is safe.
export const encode = (state) => btoa(JSON.stringify(state))

export function decode(str) {
  try {
    return validate(JSON.parse(atob(str.trim())))
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run the check to verify it passes**

Run: `node src/store/villageLogic.check.js`
Expected: `villageLogic: all checks passed`

- [ ] **Step 6: Add the check script**

In `package.json`, inside `"scripts"`, add a comma after the `"lint": "eslint ."` line and then:

```json
    "check": "node src/store/villageLogic.check.js"
```

Run: `npm run check`
Expected: `villageLogic: all checks passed`

- [ ] **Step 7: Commit**

```bash
git add src/data/buildings.js src/store/villageLogic.js src/store/villageLogic.check.js package.json
git commit -m "Add village rules and building data with a node self-check"
```

---

### Task 2: Reactive village store

**Files:**
- Create: `src/store/village.js`

**Interfaces:**
- Consumes: everything from `villageLogic.js` (Task 1).
- Produces (all from `@/store/village`):
  - `default`: reactive `State`.
  - `reward(kind: string, amount = 1): void`
  - `recordStreak(game: string, n: number): void`
  - `build(id: string): boolean` (false when refused)
  - `trade(kind: string): boolean` (false when refused)
  - `exportSave(): string`
  - `checkSave(str: string): boolean` (valid without applying)
  - `importSave(str: string): boolean`
  - `reset(): void`
  - `next`: `ComputedRef<{id, tier, cost}|null>` (next unbuilt building)
  - `affordable`: `ComputedRef<boolean>` (next building is affordable)

- [ ] **Step 1: Write the store**

Create `src/store/village.js`:

```js
import { reactive, computed, watch } from 'vue'
import * as logic from './villageLogic.js'

const KEY = 'village'

function load() {
  try {
    return logic.validate(JSON.parse(localStorage.getItem(KEY))) ?? logic.fresh()
  } catch {
    return logic.fresh()
  }
}

const village = reactive(load())

watch(village, (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // storage full or blocked: keep playing in memory
  }
})

const set = (state) => Object.assign(village, state)

// applies a logic result that may be null (refused); reports whether it took
function commit(result) {
  if (!result) return false
  set(result)
  return true
}

// Local calendar date as YYYY-MM-DD (the sv locale formats dates that way).
const today = () => new Date().toLocaleDateString('sv')

export function reward(kind, amount = 1) {
  set(logic.touchDay(logic.applyReward(village, kind, amount), today()))
}

export function recordStreak(game, n) {
  if (n > (village.bestStreak[game] ?? 0)) village.bestStreak[game] = n
}

export const build = (id) => commit(logic.applyBuild(village, id))
export const trade = (kind) => commit(logic.applyTrade(village, kind))
export const importSave = (str) => commit(logic.decode(str))

export const exportSave = () => logic.encode(village)
export const checkSave = (str) => logic.decode(str) !== null
export const reset = () => set(logic.fresh())

export const next = computed(() => logic.nextBuilding(village))
export const affordable = computed(
  () => !!next.value && logic.canAfford(village, next.value.cost),
)

export default village
```

- [ ] **Step 2: Verify it builds and lints**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors. (Nothing imports the store yet; this only proves the file is valid.)

- [ ] **Step 3: Commit**

```bash
git add src/store/village.js
git commit -m "Add reactive village store persisted to localStorage"
```

---

### Task 3: Game task generators

**Files:**
- Create: `src/games/generators.js`
- Test: `src/games/generators.check.js`
- Modify: `package.json` (extend the `check` script)

**Interfaces:**
- Consumes: `randomIntFromInterval(min, max)` from `src/helpers/helpers.js` (both bounds inclusive).
- Produces (all take `level` 1, 2 or 3):
  - `OPS: string[][]` = ops allowed per level.
  - `expr(op, level): { a, b, op, result, text, material }` where `material` is `'wood'` for `+` and `−`, `'stone'` for `×` and `÷`.
  - `tilesRound(level): { exprs: Expr[6], results: number[6] }` (results unique, shuffled)
  - `dominoRound(level): { a, b, total, options: [number, number][4] }` (exactly one option sums to `total`)
  - `compareRound(level): { left: {text, value}, right: {text, value}, answer: '<'|'='|'>' }`
  - `biggestRound(level): { numbers: number[], want: 'max'|'min', answer: number }`
  - `ascendingRound(level): { numbers: number[5], sorted: number[5] }`
  - `missingRound(level): Expr & { hide: 'a'|'b', answer: number }`

- [ ] **Step 1: Write the failing check**

Create `src/games/generators.check.js`:

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node src/games/generators.check.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `generators.js`.

- [ ] **Step 3: Write the generators**

Create `src/games/generators.js`:

```js
// Pure task generators for the six games. No Vue in here, so this file runs
// under plain node (see generators.check.js).
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'

// Operations unlocked per level (index = level - 1).
export const OPS = [
  ['+', '−'],
  ['+', '−', '×'],
  ['+', '−', '×', '÷'],
]

const ADD_RANGE = [[2, 10], [5, 100], [20, 200]]
const MUL_RANGE = [[1, 9], [2, 9], [2, 15]]
const NUMBER_MAX = [50, 200, 1000]

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function distinct(count, min, max) {
  const set = new Set()
  while (set.size < count) set.add(rnd(min, max))
  return [...set]
}

const make = (a, b, op, result) => ({
  a, b, op, result,
  text: `${a} ${op} ${b}`,
  material: op === '+' || op === '−' ? 'wood' : 'stone',
})

export function expr(op, level) {
  if (op === '+' || op === '−') {
    const [lo, hi] = ADD_RANGE[level - 1]
    let a = rnd(lo, hi)
    let b = rnd(lo, hi)
    if (op === '+') return make(a, b, op, a + b)
    if (b > a) [a, b] = [b, a] // never a negative result
    return make(a, b, op, a - b)
  }
  // both factors are >= 1, so division is always defined and whole
  const [lo, hi] = MUL_RANGE[level - 1]
  const x = rnd(lo, hi)
  const y = rnd(lo, hi)
  return op === '×' ? make(x, y, op, x * y) : make(x * y, y, op, x)
}

const randomExpr = (level) => {
  const ops = OPS[level - 1]
  return expr(ops[rnd(0, ops.length - 1)], level)
}

export function tilesRound(level) {
  const exprs = []
  const seen = new Set()
  while (exprs.length < 6) {
    const e = randomExpr(level)
    if (seen.has(e.result)) continue
    seen.add(e.result)
    exprs.push(e)
  }
  return { exprs, results: shuffle(exprs.map((e) => e.result)) }
}

export function dominoRound(level) {
  const total = rnd(2, [6, 9, 12][level - 1])
  // a domino half holds 0 to 6 pips
  const split = (sum) => {
    const x = rnd(Math.max(0, sum - 6), Math.min(6, sum))
    return [x, sum - x]
  }
  const [a, b] = split(total)
  const totals = new Set([total])
  while (totals.size < 4) totals.add(rnd(1, 12))
  const options = shuffle([...totals].map((sum) => (sum === total ? [a, b] : split(sum))))
  return { a, b, total, options }
}

export function compareRound(level) {
  const num = (n = rnd(1, 100)) => ({ text: String(n), value: n })
  const ex = () => {
    const e = expr(OPS[1][rnd(0, 2)], 1)
    return { text: e.text, value: e.result }
  }
  const left = level === 1 ? num() : ex()
  let right
  if (level === 1) right = rnd(0, 3) === 0 ? num(left.value) : num()
  else if (level === 2) right = num(Math.max(0, left.value + rnd(-5, 5)))
  else right = ex()
  const answer = left.value < right.value ? '<' : left.value > right.value ? '>' : '='
  return { left, right, answer }
}

export function biggestRound(level) {
  const numbers = distinct(3 + level, 1, NUMBER_MAX[level - 1])
  const want = rnd(0, 1) ? 'max' : 'min'
  return { numbers, want, answer: Math[want](...numbers) }
}

export function ascendingRound(level) {
  const numbers = distinct(5, 1, NUMBER_MAX[level - 1])
  return { numbers, sorted: [...numbers].sort((a, b) => a - b) }
}

export function missingRound(level) {
  const e = randomExpr(level)
  const hide = rnd(0, 1) ? 'a' : 'b'
  return { ...e, hide, answer: e[hide] }
}
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `node src/games/generators.check.js`
Expected: `generators: all checks passed`

- [ ] **Step 5: Extend the check script**

In `package.json` change the `check` script to:

```json
    "check": "node src/store/villageLogic.check.js && node src/games/generators.check.js"
```

Run: `npm run check`
Expected: both "all checks passed" lines.

- [ ] **Step 6: Commit**

```bash
git add src/games/generators.js src/games/generators.check.js package.json
git commit -m "Add task generators for the six new games with a node self-check"
```

---

### Task 4: Shared round state, game shell, strings and game styles

**Files:**
- Create: `src/composables/useRound.js`
- Create: `src/components/GameCard.vue`
- Modify: `src/i18n.js` (both language objects)
- Modify: `src/assets/design/kid.css` (append)

**Interfaces:**
- Consumes: `reward`, `recordStreak` from `@/store/village` (Task 2).
- Produces:
  - `useRound(game: string, next: (level: number) => number|void)` returns a `reactive` object with: `level` (1 to 3, from `route.params.level`), `score`, `total`, `streak`, `strikes`, `flash` (`''|'green'|'red'`), `cheer`, `timerKey`, and methods `newTask()`, `correct(material: string, flawless = false)`, `wrong()`. `next` is called synchronously once during `useRound()` and on every level change, so declare the refs it writes to BEFORE calling `useRound`. If `next` returns a number, `total` grows by that much (Tiles returns 6), otherwise by 1.
  - Call order on a correct answer is `round.correct(material)` then `round.newTask()`.
  - After 3 strikes `wrong()` is a no-op; the page shows the answer and the kid presses New.
  - `<GameCard :round base color :ranges :timed>` with a default slot for the board and an `action` slot next to the New button. `base` is the route without the level (example `/gry/domino`), `ranges` is 3 short labels for the level pills, `timed` enables the timer ring.
  - Every i18n key listed in Step 3 is available to every later task.

- [ ] **Step 1: Write the composable**

Create `src/composables/useRound.js`:

```js
import { ref, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { reward, recordStreak } from '@/store/village'

// Round state shared by the new games. `next(level)` builds a fresh task and
// runs once right away, so the caller must declare its task refs first.
export function useRound(game, next) {
  const route = useRoute()
  const level = computed(() => Math.min(3, Math.max(1, Number(route.params.level) || 1)))

  const score = ref(0)
  const total = ref(0)
  const streak = ref(0)
  const strikes = ref(0)
  const flash = ref('')
  const cheer = ref(0)
  const timerKey = ref(0)
  let flashTimeout = null

  function newTask() {
    strikes.value = 0
    if (flash.value === 'red') flash.value = ''
    timerKey.value += 1
    total.value += next(level.value) ?? 1
  }

  function correct(material, flawless = false) {
    score.value += 1
    streak.value += 1
    cheer.value += 1
    flash.value = 'green'
    reward(material, level.value)
    if (streak.value % 5 === 0) reward('coins', 1)
    if (flawless || streak.value % 10 === 0) reward('coins', 3)
    recordStreak(game, streak.value)
    clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => {
      flash.value = ''
    }, 1000)
  }

  function wrong() {
    if (strikes.value >= 3) return
    flash.value = 'red'
    streak.value = 0
    strikes.value += 1
    if (strikes.value < 3) timerKey.value += 1
  }

  watch(
    level,
    () => {
      score.value = 0
      total.value = 0
      streak.value = 0
      newTask()
    },
    { immediate: true },
  )

  return reactive({ level, score, total, streak, strikes, flash, cheer, timerKey, newTask, correct, wrong })
}
```

- [ ] **Step 2: Write the shell component**

Create `src/components/GameCard.vue`:

```vue
<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import StarRow from '@/components/StarRow.vue'
import Celebration from '@/components/Celebration.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import TimerRing from '@/components/TimerRing.vue'
import settings from '@/store/settings'
import { t } from '@/i18n'

defineProps({
  round: { type: Object, required: true },
  base: { type: String, required: true },
  color: { type: String, default: 'var(--k-brand)' },
  ranges: { type: Array, default: () => ['', '', ''] },
  timed: { type: Boolean, default: false },
})

const timerDurations = [30, 20, 15]
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: round.flash === 'green', wrong: round.flash === 'red' }"
    :style="{ borderColor: color, borderWidth: '2px', '--k-display-op': color }"
  >
    <Celebration v-if="round.flash === 'green'" :key="round.cheer" />

    <div class="kid-status">
      <RouterLink to="/graj" class="kid-back" :aria-label="t('back')">
        <ArrowLeft :size="20" />
      </RouterLink>
      <div class="kid-score">
        <span class="num">{{ round.score }} / {{ round.total }}</span>
        <span class="cap">{{ t('points') }}</span>
      </div>
      <div v-if="timed && settings.timerEnabled && round.strikes < 3" class="kid-timer-slot">
        <TimerRing
          :key="round.timerKey"
          :duration="timerDurations[round.level - 1]"
          @timeout="round.wrong()"
        />
      </div>
      <StarRow :streak="round.streak" :just-won="round.flash === 'green'" />
    </div>

    <div class="kid-levels">
      <RouterLink
        v-for="n in 3"
        :key="n"
        class="kid-pill"
        :class="{ active: round.level === n }"
        :to="`${base}/${n}`"
      >
        <span class="pl">{{ t('level') }} {{ n }}</span>
        <span class="rg">{{ ranges[n - 1] }}</span>
      </RouterLink>
    </div>

    <slot />

    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="round.strikes" />
    </div>

    <div class="kid-actions">
      <button class="kid-btn kid-btn-ghost" @click="round.newTask()">
        <RefreshCw :size="18" /> {{ t('newBtn') }}
      </button>
      <slot name="action" />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Add every new string**

In `src/i18n.js`, inside the `pl` object after the `divide2: 'Bez reszty',` line, add:

```js
    back: 'Wróć',
    wood: 'Drewno',
    stone: 'Kamień',
    food: 'Jedzenie',
    coins: 'Monety',
    village: 'Wioska',
    play: 'Graj',
    settings: 'Ustawienia',
    settingsDesc: 'Język, zegar i zapis gry',
    language: 'Język',
    missing: 'Brakująca liczba',
    tiles: 'Kafelki',
    domino: 'Domino',
    compare: 'Porównaj',
    biggest: 'Największa',
    ascending: 'Rosnąco',
    playTitle: 'W co dziś gramy?',
    grpOps: 'Działania',
    grpGames: 'Gry',
    grpNumbers: 'Liczby',
    needed: 'potrzebne',
    best: 'Rekord',
    tilesPrompt: 'Dopasuj wynik do działania',
    dominoPrompt: 'Wybierz kostkę z takim dodawaniem',
    comparePrompt: 'Który znak pasuje?',
    pickMax: 'Wybierz największą liczbę',
    pickMin: 'Wybierz najmniejszą liczbę',
    ascendingPrompt: 'Klikaj liczby od najmniejszej',
    missingPrompt: 'Jaka liczba się ukryła?',
    yourVillage: 'Twoja wioska',
    nextGoal: 'Następny cel',
    build: 'Buduj',
    upgrade: 'Ulepsz',
    tier: 'Poziom',
    tierShort: 'poz.',
    now: 'teraz',
    buildings: 'Budynki',
    villageDone: 'Wioska gotowa! Kliknij budynek, aby go ulepszyć.',
    maxTier: 'Najwyższy poziom',
    tapToUpgrade: 'Kliknij zbudowany budynek, aby go ulepszyć.',
    emptyVillage: 'Rozwiązuj zadania, aby zbierać drewno.',
    dayStreak: 'dni z rzędu',
    goalShort: 'Brakuje materiałów.',
    goalPlay: 'Zagraj',
    goalOrTrade: 'albo wymień monety.',
    readyToBuild: 'Masz wszystko! Buduj',
    seeVillage: 'Zobacz wioskę',
    shop: 'Sklep',
    trade: 'Wymień',
    rewardTitle: 'Za dobrą odpowiedź',
    rewardLevel: 'Tyle sztuk, ile wynosi poziom (1-3).',
    rewardCoins: 'Seria 5 odpowiedzi daje monetę.',
    exportSave: 'Zapis gry',
    copy: 'Kopiuj',
    copied: 'Skopiowano!',
    importSave: 'Wczytaj zapis',
    load: 'Wczytaj',
    importPlaceholder: 'Wklej zapis tutaj',
    importError: 'Ten zapis jest nieprawidłowy',
    confirmImport: 'Zastąpić obecną wioskę?',
    resetVillage: 'Wyczyść wioskę',
    confirmReset: 'Na pewno usunąć całą wioskę?',
    b_hut: 'Chatka',
    b_well: 'Studnia',
    b_farm: 'Farma',
    b_bakery: 'Piekarnia',
    b_school: 'Szkoła',
    b_mill: 'Młyn',
    b_market: 'Targ',
    b_library: 'Biblioteka',
    b_tower: 'Wieża',
    b_bridge: 'Most',
    b_townhall: 'Ratusz',
    b_castle: 'Zamek',
```

Inside the `en` object after the `divide2: 'No remainder',` line, add:

```js
    back: 'Back',
    wood: 'Wood',
    stone: 'Stone',
    food: 'Food',
    coins: 'Coins',
    village: 'Village',
    play: 'Play',
    settings: 'Settings',
    settingsDesc: 'Language, timer and saved game',
    language: 'Language',
    missing: 'Missing number',
    tiles: 'Tiles',
    domino: 'Domino',
    compare: 'Compare',
    biggest: 'Biggest',
    ascending: 'Ascending',
    playTitle: 'What shall we play today?',
    grpOps: 'Operations',
    grpGames: 'Games',
    grpNumbers: 'Numbers',
    needed: 'needed',
    best: 'Best',
    tilesPrompt: 'Match each result to its operation',
    dominoPrompt: 'Pick the domino that shows this addition',
    comparePrompt: 'Which sign fits?',
    pickMax: 'Pick the biggest number',
    pickMin: 'Pick the smallest number',
    ascendingPrompt: 'Tap the numbers from smallest to biggest',
    missingPrompt: 'Which number is hiding?',
    yourVillage: 'Your village',
    nextGoal: 'Next goal',
    build: 'Build',
    upgrade: 'Upgrade',
    tier: 'Tier',
    tierShort: 'tier',
    now: 'now',
    buildings: 'Buildings',
    villageDone: 'Village complete! Tap a building to upgrade it.',
    maxTier: 'Highest tier',
    tapToUpgrade: 'Click a finished building to upgrade it.',
    emptyVillage: 'Solve tasks to collect wood.',
    dayStreak: 'days in a row',
    goalShort: 'Not enough materials.',
    goalPlay: 'Play',
    goalOrTrade: 'or trade coins.',
    readyToBuild: 'You have it all! Build',
    seeVillage: 'See the village',
    shop: 'Shop',
    trade: 'Trade',
    rewardTitle: 'For a correct answer',
    rewardLevel: 'As many as the level number (1-3).',
    rewardCoins: 'A streak of 5 answers gives a coin.',
    exportSave: 'Saved game',
    copy: 'Copy',
    copied: 'Copied!',
    importSave: 'Load a save',
    load: 'Load',
    importPlaceholder: 'Paste a save here',
    importError: 'This save is not valid',
    confirmImport: 'Replace your current village?',
    resetVillage: 'Clear village',
    confirmReset: 'Really delete the whole village?',
    b_hut: 'Hut',
    b_well: 'Well',
    b_farm: 'Farm',
    b_bakery: 'Bakery',
    b_school: 'School',
    b_mill: 'Mill',
    b_market: 'Market',
    b_library: 'Library',
    b_tower: 'Tower',
    b_bridge: 'Bridge',
    b_townhall: 'Town hall',
    b_castle: 'Castle',
```

- [ ] **Step 4: Add the game styles**

Append to the end of `src/assets/design/kid.css`:

```css
/* ============================================================================
   NEW GAMES - shared board pieces used by src/pages/games/*.vue
   ============================================================================ */
.kid-back {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 44px; height: 44px; margin: -8px 0 -8px -8px; border-radius: 999px;
  color: var(--muted-foreground); transition: background .15s ease, color .15s ease;
}
.kid-back:hover { background: var(--k-brand-soft); color: var(--k-brand-deep); }
.kid-prompt { margin: 0; text-align: center; font-weight: 700; font-size: 15px; color: var(--muted-foreground); }
.kid-eq.sm { font-size: clamp(22px, 6.5vw, 36px); flex-wrap: wrap; }
.kid-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.kid-tiles.two { grid-template-columns: repeat(2, 1fr); }
@media (min-width: 1024px) { .kid-tiles.six { grid-template-columns: repeat(6, 1fr); } }
.kid-tile {
  min-height: 60px; padding: 6px; border-radius: var(--k-btn-radius);
  border: 2px solid var(--k-card-border); background: var(--k-card); color: var(--foreground);
  font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 700; font-size: 20px;
  cursor: pointer; transition: transform .12s ease, background .15s ease, border-color .15s ease, opacity .15s ease;
}
@media (min-width: 1024px) { .kid-tile { min-height: 76px; font-size: 26px; } }
.kid-tile.res { background: var(--k-page); }
.kid-tile:hover:not(:disabled) { transform: translateY(-2px); }
.kid-tile:disabled { cursor: default; }
.kid-tile.on { border-color: var(--k-display-op); background: color-mix(in srgb, var(--k-display-op) 14%, #fff); }
.kid-tile.done { opacity: .35; }
.kid-tile.reveal { border-color: var(--k-wrong); color: var(--k-wrong); }
.kid-domino { display: flex; align-items: center; justify-content: center; padding: 10px; }
.kid-domino .bone { display: flex; border: 2px solid var(--foreground); border-radius: 10px; background: #fbfaf6; }
.kid-domino .half {
  display: grid; grid-template-columns: repeat(3, 9px); grid-template-rows: repeat(3, 9px);
  gap: 4px; padding: 8px;
}
.kid-domino .half + .half { border-left: 2px solid var(--foreground); }
.kid-domino i { border-radius: 999px; }
.kid-domino i.pip { background: var(--foreground); }
.kid-trail { min-height: 24px; margin: 0; text-align: center; font-family: var(--font-mono); font-weight: 700; font-size: 16px; color: var(--muted-foreground); }
.kid-trail.reveal { color: var(--k-wrong); }
```

- [ ] **Step 5: Verify**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/composables/useRound.js src/components/GameCard.vue src/i18n.js src/assets/design/kid.css
git commit -m "Add shared round state, game card shell and strings for the new games"
```

---

### Task 5: Choice games (Domino, Compare, Biggest)

**Files:**
- Create: `src/pages/games/Domino.vue`
- Create: `src/pages/games/Compare.vue`
- Create: `src/pages/games/Biggest.vue`
- Modify: `src/router/index.js`

**Interfaces:**
- Consumes: `useRound(game, next)` and `<GameCard>` (Task 4), `dominoRound`, `compareRound`, `biggestRound` (Task 3), `t` from `@/i18n`.
- Produces: routes `/gry/domino/:level?`, `/gry/porownaj/:level?`, `/gry/najwieksza/:level?`.

- [ ] **Step 1: Write Domino**

Create `src/pages/games/Domino.vue`:

```vue
<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { dominoRound } from '@/games/generators'
import { t } from '@/i18n'

// which of the 9 cells in a 3x3 half hold a pip, per number
const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]]

const task = ref(null)
const round = useRound('domino', (level) => {
  task.value = dominoRound(level)
})

const isAnswer = (o) => o[0] + o[1] === task.value.total

function pick(o) {
  if (round.strikes === 3) return
  if (!isAnswer(o)) return round.wrong()
  round.correct('wood')
  round.newTask()
}
</script>

<template>
  <GameCard :round="round" base="/gry/domino" color="var(--k-op-add)" :ranges="['2-6', '2-9', '2-12']" timed>
    <p class="kid-prompt">{{ t('dominoPrompt') }}</p>
    <div class="kid-eq">
      <span>{{ task.a }}</span><span class="op">+</span><span>{{ task.b }}</span>
    </div>
    <div class="kid-tiles two">
      <button
        v-for="(o, i) in task.options"
        :key="i"
        class="kid-tile kid-domino"
        :class="{ reveal: round.strikes === 3 && isAnswer(o) }"
        :aria-label="`${o[0]} | ${o[1]}`"
        :disabled="round.strikes === 3"
        @click="pick(o)"
      >
        <span class="bone">
          <span v-for="(n, h) in o" :key="h" class="half">
            <i v-for="c in 9" :key="c" :class="{ pip: PIPS[n].includes(c - 1) }" />
          </span>
        </span>
      </button>
    </div>
  </GameCard>
</template>
```

- [ ] **Step 2: Write Compare**

Create `src/pages/games/Compare.vue`:

```vue
<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { compareRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const round = useRound('compare', (level) => {
  task.value = compareRound(level)
})

function pick(sign) {
  if (round.strikes === 3) return
  if (sign !== task.value.answer) return round.wrong()
  round.correct('food')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/porownaj"
    color="var(--k-op-div2)"
    :ranges="['7 ? 9', '3 + 4 ? 9', '3 + 4 ? 2 × 5']"
    timed
  >
    <p class="kid-prompt">{{ t('comparePrompt') }}</p>
    <div class="kid-eq sm">
      <span>{{ task.left.text }}</span>
      <span class="ans" :class="{ reveal: round.strikes === 3 }">
        {{ round.strikes === 3 ? task.answer : '?' }}
      </span>
      <span>{{ task.right.text }}</span>
    </div>
    <div class="kid-tiles">
      <button
        v-for="sign in ['<', '=', '>']"
        :key="sign"
        class="kid-tile"
        :disabled="round.strikes === 3"
        @click="pick(sign)"
      >
        {{ sign }}
      </button>
    </div>
  </GameCard>
</template>
```

- [ ] **Step 3: Write Biggest**

Create `src/pages/games/Biggest.vue`:

```vue
<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { biggestRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const round = useRound('biggest', (level) => {
  task.value = biggestRound(level)
})

function pick(n) {
  if (round.strikes === 3) return
  if (n !== task.value.answer) return round.wrong()
  round.correct('food')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/najwieksza"
    color="var(--k-op-div2)"
    :ranges="['1-50', '1-200', '1-1000']"
    timed
  >
    <p class="kid-prompt">{{ t(task.want === 'max' ? 'pickMax' : 'pickMin') }}</p>
    <div class="kid-tiles">
      <button
        v-for="n in task.numbers"
        :key="n"
        class="kid-tile"
        :class="{ reveal: round.strikes === 3 && n === task.answer }"
        :disabled="round.strikes === 3"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
  </GameCard>
</template>
```

- [ ] **Step 4: Add the routes**

In `src/router/index.js`, inside the `routes` array after the `multiply` route object, add:

```js
  {
    path: '/gry/domino/:level?',
    name: 'domino',
    component: () => import('@/pages/games/Domino.vue'),
  },
  {
    path: '/gry/porownaj/:level?',
    name: 'compare',
    component: () => import('@/pages/games/Compare.vue'),
  },
  {
    path: '/gry/najwieksza/:level?',
    name: 'biggest',
    component: () => import('@/pages/games/Biggest.vue'),
  },
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run lint && npm run dev`, then open each URL:

- `/gry/domino/1`: equation on top, four dominoes with dots. The right domino flashes green and a new task appears; the score goes to `1 / 2`. A wrong domino shakes the card and adds a strike. After three strikes the right domino is outlined red and everything is disabled until New is pressed.
- `/gry/porownaj/2`: left side is an expression, right side a number. Same correct, wrong and reveal behaviour; on reveal the `?` becomes the sign.
- `/gry/najwieksza/3`: six numbers, prompt alternates between biggest and smallest.
- In DevTools, Application, Local Storage: a `village` key appears after the first correct answer, `materials.wood` grows by the level number in Domino and `materials.food` in the other two. Five correct in a row adds 1 coin.
- Level pills switch level and reset the score.

- [ ] **Step 6: Commit**

```bash
git add src/pages/games/Domino.vue src/pages/games/Compare.vue src/pages/games/Biggest.vue src/router/index.js
git commit -m "Add Domino, Compare and Biggest games"
```

---

### Task 6: Tiles, Ascending and Missing games

**Files:**
- Create: `src/pages/games/Tiles.vue`
- Create: `src/pages/games/Ascending.vue`
- Create: `src/pages/games/Missing.vue`
- Modify: `src/router/index.js`

**Interfaces:**
- Consumes: `useRound(game, next)` and `<GameCard>` with its `action` slot (Task 4), `tilesRound`, `ascendingRound`, `missingRound` (Task 3), CSS classes `.kid-tiles.six` and `.kid-tile.res` (Task 4).
- Produces: routes `/gry/kafelki/:level?`, `/gry/rosnaco/:level?`, `/gry/brakujaca/:level?`.

- [ ] **Step 1: Write Tiles**

Create `src/pages/games/Tiles.vue`:

```vue
<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { tilesRound } from '@/games/generators'
import { t } from '@/i18n'

const exprs = ref([])
const results = ref([])
const picked = ref(null)
const done = ref(new Set())
const clean = ref(true)

const round = useRound('tiles', (level) => {
  const board = tilesRound(level)
  exprs.value = board.exprs
  results.value = board.results
  picked.value = null
  done.value = new Set()
  clean.value = true
  return board.exprs.length // one point per pair
})

function pickResult(value) {
  const e = picked.value
  if (!e || round.strikes === 3) return
  picked.value = null
  if (e.result !== value) {
    clean.value = false
    return round.wrong()
  }
  // results are unique within a board, so the value identifies the pair
  done.value = new Set(done.value).add(value)
  const last = done.value.size === exprs.value.length
  round.correct(e.material, last && clean.value)
  if (last) round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/kafelki"
    color="var(--k-op-mul)"
    :ranges="['+ −', '+ − ×', '+ − × ÷']"
  >
    <p class="kid-prompt">{{ t('tilesPrompt') }}</p>
    <div class="kid-tiles">
      <button
        v-for="e in exprs"
        :key="e.text"
        class="kid-tile"
        :class="{ on: picked === e, done: done.has(e.result) }"
        :aria-pressed="picked === e"
        :disabled="done.has(e.result) || round.strikes === 3"
        @click="picked = e"
      >
        {{ e.text }}
      </button>
    </div>
    <div class="kid-tiles six">
      <button
        v-for="r in results"
        :key="r"
        class="kid-tile res"
        :class="{ done: done.has(r) }"
        :disabled="done.has(r) || !picked || round.strikes === 3"
        @click="pickResult(r)"
      >
        {{ r }}
      </button>
    </div>
  </GameCard>
</template>
```

- [ ] **Step 2: Write Ascending**

Create `src/pages/games/Ascending.vue`:

```vue
<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { ascendingRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const done = ref([])

const round = useRound('ascending', (level) => {
  task.value = ascendingRound(level)
  done.value = []
})

function pick(n) {
  if (round.strikes === 3) return
  if (n !== task.value.sorted[done.value.length]) return round.wrong()
  done.value = [...done.value, n]
  if (done.value.length === task.value.sorted.length) {
    round.correct('food')
    round.newTask()
  }
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/rosnaco"
    color="var(--k-op-div2)"
    :ranges="['1-50', '1-200', '1-1000']"
    timed
  >
    <p class="kid-prompt">{{ t('ascendingPrompt') }}</p>
    <div class="kid-tiles">
      <button
        v-for="n in task.numbers"
        :key="n"
        class="kid-tile"
        :class="{ done: done.includes(n) }"
        :disabled="done.includes(n) || round.strikes === 3"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
    <p class="kid-trail" :class="{ reveal: round.strikes === 3 }">
      {{ (round.strikes === 3 ? task.sorted : done).join(' < ') }}
    </p>
  </GameCard>
</template>
```

- [ ] **Step 3: Write Missing**

Create `src/pages/games/Missing.vue`:

```vue
<script setup>
import { ref, nextTick } from 'vue'
import { Check } from 'lucide-vue-next'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { missingRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const answer = ref('')
const answerInput = ref(null)

const focusAnswer = () => nextTick(() => answerInput.value?.focus())

const round = useRound('missing', (level) => {
  task.value = missingRound(level)
  answer.value = ''
  focusAnswer()
})

// the hidden operand shows "?" until three strikes reveal it
const shown = (side) =>
  task.value.hide !== side ? task.value[side] : round.strikes === 3 ? task.value.answer : '?'

function check() {
  if (answer.value === '' || round.strikes === 3) return
  if (parseInt(answer.value) === task.value.answer) {
    round.correct(task.value.material)
    round.newTask()
  } else {
    round.wrong()
    focusAnswer()
  }
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/brakujaca"
    color="var(--k-brand)"
    :ranges="['+ −', '+ − ×', '+ − × ÷']"
    timed
  >
    <p class="kid-prompt">{{ t('missingPrompt') }}</p>
    <div class="kid-eq sm">
      <span :class="{ ans: task.hide === 'a', reveal: task.hide === 'a' && round.strikes === 3 }">{{ shown('a') }}</span>
      <span class="op">{{ task.op }}</span>
      <span :class="{ ans: task.hide === 'b', reveal: task.hide === 'b' && round.strikes === 3 }">{{ shown('b') }}</span>
      <span>=</span>
      <span>{{ task.result }}</span>
    </div>
    <div class="kid-field">
      <label class="kid-field-label" for="missing-answer">{{ t('answer') }}</label>
      <input
        id="missing-answer"
        ref="answerInput"
        v-model="answer"
        class="kid-input"
        type="number"
        inputmode="numeric"
        placeholder="?"
        :disabled="round.strikes === 3"
        @keyup.enter="check"
      />
    </div>
    <template #action>
      <button class="kid-btn kid-btn-primary" :disabled="round.strikes === 3" @click="check">
        <Check :size="20" /> {{ t('check') }}
      </button>
    </template>
  </GameCard>
</template>
```

- [ ] **Step 4: Add the routes**

In `src/router/index.js`, after the `biggest` route object added in Task 5, add:

```js
  {
    path: '/gry/kafelki/:level?',
    name: 'tiles',
    component: () => import('@/pages/games/Tiles.vue'),
  },
  {
    path: '/gry/rosnaco/:level?',
    name: 'ascending',
    component: () => import('@/pages/games/Ascending.vue'),
  },
  {
    path: '/gry/brakujaca/:level?',
    name: 'missing',
    component: () => import('@/pages/games/Missing.vue'),
  },
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run lint && npm run dev`, then:

- `/gry/kafelki/1`: six operation tiles, six result tiles on a tinted ground. Result tiles are disabled until an operation is selected. A right pair fades both tiles and scores one point; the score reads `n / 6`. Clearing a board with no mistakes adds 3 coins to `village.materials.coins` in localStorage. Level 1 shows only `+` and `−`. No timer ring even with the timer switched on.
- `/gry/rosnaco/2`: tapping in the right order fades tiles and builds `12 < 40 < 97` under the board. A wrong tap is a strike and does not advance. Three strikes show the full sorted list in red.
- `/gry/brakujaca/3`: one operand is `?`. Enter submits. Empty input does nothing. `+` and `−` pay wood, `×` and `÷` pay stone. Three strikes reveal the operand in red and disable the input.

- [ ] **Step 6: Commit**

```bash
git add src/pages/games/Tiles.vue src/pages/games/Ascending.vue src/pages/games/Missing.vue src/router/index.js
git commit -m "Add Tiles, Ascending and Missing number games"
```

---

### Task 7: Village page and village widgets

**Files:**
- Create: `src/components/MaterialIcon.vue`
- Create: `src/components/IsoBuilding.vue`
- Create: `src/components/NextGoal.vue`
- Create: `src/components/ShopCard.vue`
- Create: `src/components/BuildingList.vue`
- Create: `src/pages/Village.vue`
- Modify: `src/router/index.js` (root route)
- Delete: `src/pages/Home.vue`
- Modify: `src/assets/design/kid.css` (append)

**Interfaces:**
- Consumes: `village` (default), `build`, `trade`, `next` from `@/store/village` (Task 2); `goalFor`, `canAfford` from `@/store/villageLogic` (Task 1); `BUILDINGS`, `MATERIALS`, `SHOP_RATE` from `@/data/buildings` (Task 1); i18n keys from Task 4.
- Produces:
  - `<MaterialIcon kind="wood|stone|food|coins" :size="18" />`: an inline `<svg aria-hidden="true">`.
  - `<IsoBuilding :id :tier :ghost :next :selected>`: an SVG `<g>` whose origin is the top corner of a 96x48 iso tile. Must be placed inside an `<svg>`.
  - `<NextGoal :building-id :can-build @built>`: `buildingId` (String or null) is a built building picked for upgrade, null means the next unbuilt one. `canBuild` true shows a real Build button (village page); false shows links to the village (side column on other pages). Emits `built` after a successful build.
  - `<ShopCard />`, `<BuildingList />`: no props.
  - CSS classes `.kid-cols`, `.kid-col-main`, `.kid-col-side`, `.kid-desktop-only`, `.kid-panel`, `.kid-badge`, `.kid-h1`: the two-column layout and panel look reused by Tasks 8 and 9.
  - Route `/` renders `Village.vue`.

Isometric math used throughout: a tile is a 96x48 diamond. Grid `[col, row]` maps to screen `x = (col - row) * 48`, `y = (col + row) * 24`. Relative to that origin the tile corners are top `(0,0)`, right `(48,24)`, bottom `(0,48)`, left `(-48,24)`, and the tile centre is `(0,24)`.

- [ ] **Step 1: Write the material icons**

Create `src/components/MaterialIcon.vue`:

```vue
<script setup>
defineProps({
  kind: { type: String, required: true },
  size: { type: Number, default: 18 },
})

// darker than the material itself so the stroke reads on white
const STROKE = { wood: '#9a5a26', stone: '#5f6878', food: '#8a6a00', coins: '#a66a00' }
</script>

<template>
  <svg
    class="kid-mat-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="STROKE[kind]"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'wood'">
      <ellipse cx="6" cy="12" rx="3" ry="5" />
      <path d="M6 7h11c1.7 0 3 2.2 3 5s-1.3 5-3 5H6" />
      <path d="M12 11h4" />
    </template>
    <template v-else-if="kind === 'stone'">
      <path d="M4 17l2-7 5-4 6 2 3 6-2 4H6z" />
      <path d="M11 6l1 6 8 2" />
    </template>
    <template v-else-if="kind === 'food'">
      <path d="M12 21V6" />
      <path d="M12 10c-3 0-4-2-4-4 3 0 4 2 4 4z" />
      <path d="M12 10c3 0 4-2 4-4-3 0-4 2-4 4z" />
      <path d="M12 16c-3 0-4-2-4-4 3 0 4 2 4 4z" />
      <path d="M12 16c3 0 4-2 4-4-3 0-4 2-4 4z" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </template>
  </svg>
</template>
```

- [ ] **Step 2: Write the building renderer**

Create `src/components/IsoBuilding.vue`:

```vue
<script setup>
import { computed } from 'vue'

// PLACEHOLDER ART. Real building assets will replace this file later; keep
// every building drawing in here so the swap touches nothing else.
// a = half-width of the footprint, h = wall height, flat = flat roof.
const LOOK = {
  hut: { wall: '#f4c98a', roof: '#c2553d', a: 24, h: 22 },
  well: { wall: '#b8bcc6', roof: '#7cc6f2', a: 13, h: 10, flat: true },
  farm: { wall: '#a97142', roof: '#e8c84a', a: 34, h: 6, flat: true },
  bakery: { wall: '#f7e1b5', roof: '#a8552f', a: 26, h: 26 },
  school: { wall: '#f2a65a', roof: '#7a4a8c', a: 30, h: 30 },
  mill: { wall: '#e9e2d0', roof: '#8a5a3c', a: 20, h: 44 },
  market: { wall: '#f6d365', roof: '#e2574c', a: 32, h: 16 },
  library: { wall: '#c9d6ea', roof: '#3f5f8a', a: 30, h: 34 },
  tower: { wall: '#c4c8d0', roof: '#9aa0ab', a: 15, h: 64, flat: true },
  bridge: { wall: '#9a6b43', roof: '#c89b6a', a: 32, h: 8, flat: true },
  townhall: { wall: '#f3eee2', roof: '#2f6bed', a: 34, h: 38 },
  castle: { wall: '#bfc4cd', roof: '#8e95a3', a: 38, h: 46, flat: true },
}

const props = defineProps({
  id: { type: String, required: true },
  tier: { type: Number, default: 1 },
  ghost: { type: Boolean, default: false },
  next: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

const g = computed(() => {
  const look = LOOK[props.id]
  const k = 1 + 0.12 * (Math.max(props.tier, 1) - 1) // each tier is 12% bigger
  const a = look.a * k
  const h = look.h * k
  const cy = 24
  const L = [-a, cy]
  const R = [a, cy]
  const F = [0, cy + a / 2]
  const B = [0, cy - a / 2]
  const up = ([x, y]) => [x, y - h]
  const apex = [0, cy - h - a * 0.9]
  const pts = (...p) => p.map((q) => q.join(',')).join(' ')
  // point on the right / left wall: u along the wall (0..1), v pixels up
  const onRight = (u, v) => [u * a, cy + a / 2 - (u * a) / 2 - v]
  const onLeft = (u, v) => [-a + u * a, cy + (u * a) / 2 - v]
  const peak = look.flat ? [0, cy - h] : apex
  const tall = look.h >= 16
  return {
    look,
    left: pts(L, F, up(F), up(L)),
    right: pts(F, R, up(R), up(F)),
    top: pts(up(L), up(F), up(R), up(B)),
    roofBack: pts(up(L), up(B), up(R), apex),
    roofLeft: pts(up(L), up(F), apex),
    roofRight: pts(up(F), up(R), apex),
    door: tall && pts(onRight(0.38, 0), onRight(0.62, 0), onRight(0.62, h * 0.55), onRight(0.38, h * 0.55)),
    window: tall && props.tier >= 2 && pts(onLeft(0.3, h * 0.45), onLeft(0.6, h * 0.45), onLeft(0.6, h * 0.8), onLeft(0.3, h * 0.8)),
    peak,
    flag: props.tier >= 3 && pts([peak[0], peak[1] - 18], [peak[0] + 12, peak[1] - 14], [peak[0], peak[1] - 10]),
    smoke: !look.flat && [a * 0.45, cy - h - a * 0.4],
  }
})
</script>

<template>
  <g class="iso-b" :class="{ ghost, next, built: !ghost, sel: selected }">
    <polygon :points="g.left" :fill="g.look.wall" />
    <polygon :points="g.left" class="shade" />
    <polygon :points="g.right" :fill="g.look.wall" />
    <polygon v-if="g.look.flat" :points="g.top" :fill="g.look.roof" />
    <template v-else>
      <polygon :points="g.roofBack" :fill="g.look.roof" />
      <polygon :points="g.roofBack" class="shade2" />
      <polygon :points="g.roofLeft" :fill="g.look.roof" />
      <polygon :points="g.roofLeft" class="shade" />
      <polygon :points="g.roofRight" :fill="g.look.roof" />
    </template>
    <template v-if="!ghost">
      <polygon v-if="g.door" :points="g.door" fill="#6b4226" />
      <polygon v-if="g.window" :points="g.window" fill="#bfe3ff" />
      <template v-if="g.flag">
        <line :x1="g.peak[0]" :y1="g.peak[1]" :x2="g.peak[0]" :y2="g.peak[1] - 18" stroke="#5b4636" stroke-width="1.5" />
        <polygon :points="g.flag" fill="#e2574c" class="iso-flag" />
      </template>
      <circle v-if="g.smoke" :cx="g.smoke[0]" :cy="g.smoke[1]" r="4" class="iso-smoke" />
    </template>
  </g>
</template>
```

- [ ] **Step 3: Write the goal card**

Create `src/components/NextGoal.vue`:

```vue
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Flame } from 'lucide-vue-next'
import MaterialIcon from '@/components/MaterialIcon.vue'
import IsoBuilding from '@/components/IsoBuilding.vue'
import village, { build, next } from '@/store/village'
import { goalFor, canAfford } from '@/store/villageLogic'
import { t } from '@/i18n'

const props = defineProps({
  // a built building picked for upgrade; null means the next unbuilt one
  buildingId: { type: String, default: null },
  // village page shows a real Build button, other pages link to the village
  canBuild: { type: Boolean, default: false },
})
const emit = defineEmits(['built'])

const goal = computed(() => (props.buildingId ? goalFor(village, props.buildingId) : next.value))
const affordable = computed(() => !!goal.value && canAfford(village, goal.value.cost))
const bars = computed(() =>
  Object.entries(goal.value?.cost ?? {}).map(([kind, need]) => {
    const have = Math.min(village.materials[kind], need)
    return { kind, need, have, pct: (have / need) * 100, full: have === need }
  }),
)

function onBuild() {
  if (build(goal.value.id)) emit('built')
}
</script>

<template>
  <section class="kid-panel kid-goal" :aria-label="t('nextGoal')">
    <span class="kid-eyebrow">{{ t('nextGoal') }}</span>
    <template v-if="goal">
      <div class="kid-goal-head">
        <svg class="art" viewBox="-48 -76 96 128" aria-hidden="true">
          <IsoBuilding :id="goal.id" :tier="goal.tier" ghost next />
        </svg>
        <div>
          <h2>{{ t('b_' + goal.id) }}</h2>
          <span class="sub">{{ t('tier') }} {{ goal.tier }}</span>
        </div>
        <span v-if="village.dayStreak > 1" class="kid-fire">
          <Flame :size="15" /> {{ village.dayStreak }} {{ t('dayStreak') }}
        </span>
      </div>

      <div
        v-for="b in bars"
        :key="b.kind"
        class="kid-bar"
        role="img"
        :aria-label="`${t(b.kind)}: ${b.have}/${b.need}`"
      >
        <MaterialIcon :kind="b.kind" />
        <div class="track"><div class="fill" :class="{ full: b.full }" :style="{ width: b.pct + '%' }"></div></div>
        <span class="n">{{ b.have }}/{{ b.need }}</span>
      </div>

      <button v-if="canBuild" class="kid-btn kid-btn-primary" :disabled="!affordable" @click="onBuild">
        {{ t(goal.tier === 1 ? 'build' : 'upgrade') }}
      </button>
      <RouterLink v-else-if="affordable" to="/" class="kid-btn kid-btn-primary">{{ t('readyToBuild') }}</RouterLink>

      <p v-if="!affordable" class="kid-goal-hint">
        {{ t('goalShort') }} <RouterLink to="/graj">{{ t('goalPlay') }}</RouterLink> {{ t('goalOrTrade') }}
      </p>
      <RouterLink v-if="!canBuild && !affordable" to="/" class="kid-btn kid-btn-ghost">{{ t('seeVillage') }}</RouterLink>
    </template>
    <p v-else class="kid-prompt">{{ t(buildingId ? 'maxTier' : 'villageDone') }}</p>
  </section>
</template>
```

- [ ] **Step 4: Write the shop**

Create `src/components/ShopCard.vue`:

```vue
<script setup>
import { ArrowRight } from 'lucide-vue-next'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { trade, next } from '@/store/village'
import { MATERIALS, SHOP_RATE } from '@/data/buildings'
import { t } from '@/i18n'

// Fixed row order on purpose: rows that re-sort while a kid taps the same
// button twice would move the button out from under the finger.
const goods = MATERIALS.filter((k) => k !== 'coins')

// the next building still lacks this material
const needed = (kind) => (next.value?.cost[kind] ?? 0) > village.materials[kind]
</script>

<template>
  <section class="kid-panel kid-shop" :aria-label="t('shop')">
    <div class="kid-shop-head">
      <h2>{{ t('shop') }}</h2>
      <span class="purse" role="img" :aria-label="`${t('coins')}: ${village.materials.coins}`">
        <MaterialIcon kind="coins" :size="16" /> {{ village.materials.coins }}
      </span>
    </div>
    <div v-for="kind in goods" :key="kind" class="kid-shop-row">
      <span class="rate" aria-hidden="true">
        <MaterialIcon kind="coins" />1
        <ArrowRight :size="16" class="arrow" />
        <MaterialIcon :kind="kind" />{{ SHOP_RATE }}
      </span>
      <span class="name">{{ t(kind) }}</span>
      <span v-if="needed(kind)" class="kid-badge">{{ t('needed') }}</span>
      <button
        class="kid-btn kid-shop-btn"
        :class="needed(kind) ? 'kid-btn-primary' : 'kid-btn-ghost'"
        :disabled="village.materials.coins < 1"
        :aria-label="`${t('trade')}: 1 ${t('coins')}, ${SHOP_RATE} ${t(kind)}`"
        @click="trade(kind)"
      >
        {{ t('trade') }}
      </button>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Write the building list**

Create `src/components/BuildingList.vue`:

```vue
<script setup>
import { computed } from 'vue'
import village, { next } from '@/store/village'
import { BUILDINGS } from '@/data/buildings'
import { t } from '@/i18n'

const rows = computed(() =>
  BUILDINGS.map((def) => ({
    id: def.id,
    tier: village.buildings.find((b) => b.id === def.id)?.tier ?? 0,
    isNext: next.value?.id === def.id,
  })),
)
</script>

<template>
  <section class="kid-panel kid-blist kid-desktop-only" :aria-label="t('buildings')">
    <h2>{{ t('buildings') }}</h2>
    <ul>
      <li v-for="r in rows" :key="r.id" :class="{ built: r.tier > 0, next: r.isNext }">
        <span class="dot" aria-hidden="true"></span>
        {{ t('b_' + r.id) }}
        <span v-if="r.tier" class="tag">{{ t('tierShort') }} {{ r.tier }}</span>
        <span v-else-if="r.isNext" class="tag">{{ t('now') }}</span>
      </li>
    </ul>
  </section>
</template>
```

- [ ] **Step 6: Write the village page**

Create `src/pages/Village.vue`:

```vue
<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import IsoBuilding from '@/components/IsoBuilding.vue'
import NextGoal from '@/components/NextGoal.vue'
import ShopCard from '@/components/ShopCard.vue'
import BuildingList from '@/components/BuildingList.vue'
import Celebration from '@/components/Celebration.vue'
import village, { next } from '@/store/village'
import { BUILDINGS } from '@/data/buildings'
import { t } from '@/i18n'

const SIZE = 6
const PATH_ROW = 3
const POND = ['4,0', '5,0', '5,1']
const FILL = { grass: '#a5d98a', grass2: '#9ad07e', path: '#ead9ac', pond: '#86c8ee' }

const place = ([col, row]) => `translate(${(col - row) * 48} ${(col + row) * 24})`

// ground tiles, already in back-to-front order (row by row, col by col)
const ground = []
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const kind = POND.includes(`${col},${row}`)
      ? 'pond'
      : row === PATH_ROW
        ? 'path'
        : (col + row) % 2
          ? 'grass2'
          : 'grass'
    ground.push({ key: `${col},${row}`, at: place([col, row]), fill: FILL[kind] })
  }
}

const selected = ref(null)
const cheer = ref(0)

// back-to-front so nearer buildings overlap farther ones
const plots = computed(() =>
  BUILDINGS.map((def) => ({
    ...def,
    tier: village.buildings.find((b) => b.id === def.id)?.tier ?? 0,
  })).sort((p, q) => p.plot[0] + p.plot[1] - (q.plot[0] + q.plot[1])),
)

function select(plot) {
  if (!plot.tier) return
  selected.value = selected.value === plot.id ? null : plot.id
}
</script>

<template>
  <div class="kid-cols">
    <div class="kid-col-main kid-village">
      <Celebration v-if="cheer" :key="cheer" />

      <div class="kid-village-head">
        <h1 class="kid-h1">{{ t('yourVillage') }}</h1>
        <span class="count">{{ village.buildings.length }} / {{ BUILDINGS.length }}</span>
      </div>

      <svg class="kid-map" viewBox="-296 -52 592 360" role="img" :aria-label="t('yourVillage')">
        <!-- earth edge under the front two sides of the map -->
        <polygon points="-288,144 0,288 0,302 -288,158" fill="#b58a5a" />
        <polygon points="0,288 288,144 288,158 0,302" fill="#9c7448" />
        <g v-for="tile in ground" :key="tile.key" :transform="tile.at">
          <polygon points="0,0 48,24 0,48 -48,24" :fill="tile.fill" />
        </g>
        <g
          v-for="p in plots"
          :key="p.id"
          :transform="place(p.plot)"
          :role="p.tier ? 'button' : undefined"
          :tabindex="p.tier ? 0 : undefined"
          :aria-label="t('b_' + p.id)"
          :aria-pressed="p.tier ? selected === p.id : undefined"
          @click="select(p)"
          @keyup.enter="select(p)"
        >
          <IsoBuilding
            :id="p.id"
            :tier="p.tier"
            :ghost="!p.tier"
            :next="next?.id === p.id"
            :selected="selected === p.id"
          />
        </g>
      </svg>

      <p class="kid-village-hint">
        <template v-if="village.buildings.length">{{ t('tapToUpgrade') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>

      <BuildingList />
    </div>

    <aside class="kid-col-side">
      <NextGoal :building-id="selected" can-build @built="cheer += 1" />
      <ShopCard />
    </aside>
  </div>
</template>
```

- [ ] **Step 7: Point the root route at the village**

In `src/router/index.js`:

Replace the line `import Home from '@/pages/Home.vue'` with:

```js
import Village from '@/pages/Village.vue'
```

Replace the whole first route object (the one with `path: '/'`, `redirect`, `name: 'Home'`, `component: Home`) with:

```js
  {
    path: '/',
    name: 'village',
    component: Village,
  },
```

Then delete the now unused page:

```bash
git rm src/pages/Home.vue
```

- [ ] **Step 8: Add the village styles**

Append to the end of `src/assets/design/kid.css`:

```css
/* ============================================================================
   TWO-COLUMN LAYOUT - phone: stacked. From 1024px: main column + 340px side.
   ============================================================================ */
.kid-cols { display: flex; flex-direction: column; gap: 16px; }
.kid-col-main, .kid-col-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.kid-desktop-only { display: none; }
@media (min-width: 1024px) {
  .kid-cols { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 40px; align-items: start; }
  .kid-col-side { gap: 20px; position: sticky; top: 92px; }
  .kid-desktop-only { display: flex; }
}
.kid-h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
@media (min-width: 1024px) { .kid-h1 { font-size: 30px; letter-spacing: -0.03em; } }
.kid-panel {
  padding: 18px; display: flex; flex-direction: column; gap: 12px;
  background: var(--k-card); border: 1px solid var(--k-card-border); border-radius: var(--k-card-radius);
}
.kid-panel h2 { margin: 0; font-size: 16px; font-weight: 800; }
@media (min-width: 1024px) { .kid-panel { padding: 22px; } }
.kid-badge { padding: 3px 9px; border-radius: 999px; background: var(--k-accent); color: #3b2600; font-size: 11px; font-weight: 800; white-space: nowrap; }

/* ============================================================================
   VILLAGE - iso map (src/pages/Village.vue, src/components/IsoBuilding.vue)
   ============================================================================ */
.kid-village { position: relative; }
.kid-village-head { display: flex; align-items: baseline; gap: 12px; }
.kid-village-head .count { font-family: var(--font-mono); font-weight: 700; font-size: 14px; color: var(--muted-foreground); }
.kid-village-hint { margin: 0; font-size: 14px; color: var(--muted-foreground); }
.kid-map { display: block; width: 100%; height: auto; }
.iso-b .shade { fill: #000; opacity: .14; }
.iso-b .shade2 { fill: #000; opacity: .28; }
.iso-b.built { cursor: pointer; }
.iso-b.sel polygon { stroke: var(--k-brand); stroke-width: 2; }
.iso-b.ghost polygon {
  fill: transparent; stroke: var(--muted-foreground); stroke-width: 1.5;
  stroke-dasharray: 4 4; opacity: .4;
}
.iso-b.ghost.next polygon { fill: color-mix(in srgb, var(--k-brand-soft) 70%, transparent); stroke: var(--k-brand); stroke-width: 2; opacity: 1; }
.iso-b.ghost.next { animation: iso-pulse 1.6s ease-in-out infinite; }
.iso-smoke { fill: #fff; opacity: 0; animation: iso-smoke 3s ease-out infinite; }
.iso-flag { transform-box: fill-box; transform-origin: left center; animation: iso-flag 1.2s ease-in-out infinite alternate; }
@keyframes iso-pulse { 50% { opacity: .35; } }
@keyframes iso-smoke { 0% { opacity: 0; transform: translateY(0); } 30% { opacity: .85; } 100% { opacity: 0; transform: translateY(-22px); } }
@keyframes iso-flag { from { transform: scaleX(1); } to { transform: scaleX(.7); } }

/* ============================================================================
   GOAL CARD, SHOP, BUILDING LIST
   ============================================================================ */
.kid-goal { box-shadow: var(--k-card-shadow); }
.kid-eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--k-brand-deep); }
.kid-goal-head { display: flex; align-items: center; gap: 12px; }
.kid-goal-head .art { width: 64px; height: 84px; flex: none; }
.kid-goal-head .art .iso-b { animation: none; }
.kid-goal-head h2 { font-size: 20px; letter-spacing: -0.02em; }
.kid-goal-head .sub { font-size: 13px; font-weight: 600; color: var(--muted-foreground); }
.kid-fire { margin-left: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: #8a5200; white-space: nowrap; }
.kid-bar { display: grid; grid-template-columns: 22px minmax(0, 1fr) 48px; align-items: center; gap: 8px; }
.kid-bar .track { height: 12px; border-radius: 999px; background: #efece4; overflow: hidden; }
.kid-bar .fill { height: 100%; border-radius: 999px; background: var(--k-brand); transition: width .4s ease; }
.kid-bar .fill.full { background: #15803d; }
.kid-bar .n { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 700; text-align: right; }
/* .kid-btn-primary carries flex: 1 for the game action row; in these column
   and row layouts that would collapse or stretch the button, so pin it */
.kid-goal .kid-btn, .kid-shop .kid-btn { flex: none; text-decoration: none; }
.kid-goal-hint { margin: 0; text-align: center; font-size: 14px; font-weight: 600; color: var(--muted-foreground); }
.kid-goal-hint a { font-weight: 700; color: var(--k-brand-deep); }

.kid-shop-head { display: flex; align-items: center; gap: 8px; }
.kid-shop-head .purse { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: #7a4e00; }
.kid-shop-row { display: flex; align-items: center; gap: 8px; min-height: 44px; }
.kid-shop-row .rate { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-weight: 700; font-size: 15px; }
.kid-shop-row .arrow { color: var(--muted-foreground); }
.kid-shop-row .name { font-size: 14px; font-weight: 700; }
.kid-shop-btn { margin-left: auto; height: 44px; padding: 0 16px; border-radius: 14px; font-size: 14px; }
.kid-shop-btn:disabled { opacity: .45; pointer-events: none; }

.kid-blist ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: 24px; row-gap: 9px; }
.kid-blist li { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; color: var(--muted-foreground); }
.kid-blist li .dot { width: 9px; height: 9px; flex: none; border-radius: 999px; background: var(--k-card-border); }
.kid-blist li .tag { margin-left: auto; font-family: var(--font-mono); font-size: 12px; font-weight: 500; }
.kid-blist li.built { color: var(--foreground); }
.kid-blist li.built .dot { background: #15803d; }
.kid-blist li.next { color: var(--k-brand-deep); font-weight: 800; }
.kid-blist li.next .dot { background: transparent; border: 2px solid var(--k-brand); }

@media (prefers-reduced-motion: reduce) {
  .iso-smoke, .iso-flag, .iso-b.ghost.next { animation: none; }
  .kid-bar .fill { transition: none; }
}
```

- [ ] **Step 9: Verify in the browser**

Run: `npm run check && npm run lint && npm run dev`, open `/`. (The header still shows the old chip row until Task 9; ignore it here.)

- A green 6x6 diamond with a brown earth edge, a sand path across the middle and a blue pond in one corner. Twelve dashed ghost outlines; only the hut is blue and pulsing.
- Below the map (phone width) or in the right column (1280px wide): the goal card shows `Chatka`, tier 1, one wood bar at `0/5`, a disabled Build button and the "not enough materials" hint. Under it the shop with three rows; all Trade buttons are disabled at 0 coins. The wood row carries the `potrzebne` badge.
- In the DevTools console run `localStorage.setItem('village', JSON.stringify({v:1,materials:{wood:500,stone:0,food:500,coins:5},buildings:[],bestStreak:{},lastPlayed:'',dayStreak:0}))` and reload. Build is enabled and its height is the full 56px (not collapsed). Pressing it draws the hut, fires confetti, deducts 5 wood, and the pulse moves to the well.
- Build up to the bakery. The next goal is the school and needs 6 stone, which you do not have: the stone bar is `0/6`, the stone shop row has the badge and a blue Trade button. Press it three times: coins go 5 to 2, stone 0 to 6, the bar turns green, the badge disappears, the row order never changes. Build the school.
- Nearer buildings overlap farther ones correctly, none sits on the path or pond.
- Click a built building: brand outline, and the goal card switches to its upgrade cost (materials plus coins). Upgrade twice: it grows, gains a window at tier 2 and a waving flag at tier 3, then the card says highest tier. Click it again to deselect.
- Tab reaches built buildings and Enter selects them.
- At 1280px the building list shows under the map in four columns with built, next and locked states; at 390px it is hidden.
- Set `localStorage.setItem('village', '{broken')` and reload: a fresh empty village, no console error.
- Run `localStorage.removeItem('village')` to clean up.

- [ ] **Step 10: Commit**

```bash
git add src/components/MaterialIcon.vue src/components/IsoBuilding.vue src/components/NextGoal.vue src/components/ShopCard.vue src/components/BuildingList.vue src/pages/Village.vue src/router/index.js src/assets/design/kid.css
git commit -m "Add isometric village page with goal card, coin shop and building list"
```

---

### Task 8: Play grid, and rewards plus back arrow on the existing pages

**Files:**
- Create: `src/data/games.js`
- Create: `src/pages/Play.vue`
- Modify: `src/router/index.js`
- Modify: `src/pages/Addition.vue`, `src/pages/Subtraction.vue`, `src/pages/Multiply.vue`, `src/pages/Divide.vue`, `src/pages/Divide_2.vue`
- Modify: `src/assets/design/kid.css` (append)

**Interfaces:**
- Consumes: `village` (default), `next`, `reward`, `recordStreak` from `@/store/village` (Task 2); `<MaterialIcon>` and CSS `.kid-h1`, `.kid-badge` (Task 7); `.kid-back` (Task 4); i18n keys from Task 4.
- Produces:
  - `GROUPS` from `@/data/games`: `{ key, pays: string[], games: Game[] }[]`.
  - `Game` = `{ id, route, color, ink, pays: string[], symbol?: string, icon?: Component }`. `id` is both the i18n key and the `bestStreak` key. `color` is the border colour, `ink` is a darker shade of it that passes contrast as text on white. Exactly one of `symbol` or `icon` is set.
  - `GAMES`: the flat list of every `Game`.
  - Route `/graj`; a catch-all redirect to `/`.

- [ ] **Step 1: Write the game list**

Create `src/data/games.js`:

```js
import { LayoutGrid, Dices } from 'lucide-vue-next'

// Every playable page, grouped for the Play grid. `id` doubles as the i18n key
// for the name and as the bestStreak key in the village save. `ink` is the
// darker text shade of `color`: the operation colours fail contrast on white.
export const GROUPS = [
  {
    key: 'grpOps',
    pays: ['wood', 'stone'],
    games: [
      { id: 'addition', symbol: '+', color: 'var(--k-op-add)', ink: '#15803d', route: '/dodawanie', pays: ['wood'] },
      { id: 'subtraction', symbol: '−', color: 'var(--k-op-sub)', ink: '#b45309', route: '/odejmowanie', pays: ['wood'] },
      { id: 'multiply', symbol: '×', color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/mnozenie', pays: ['stone'] },
      { id: 'divide', symbol: '÷', color: 'var(--k-op-div)', ink: '#be185d', route: '/dzielenie', pays: ['stone'] },
      { id: 'divide2', symbol: '÷', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/dzielenie2', pays: ['stone'] },
      { id: 'missing', symbol: '?', color: 'var(--k-brand)', ink: '#1f4fc4', route: '/gry/brakujaca', pays: ['wood', 'stone'] },
    ],
  },
  {
    key: 'grpGames',
    pays: ['wood', 'stone'],
    games: [
      { id: 'tiles', icon: LayoutGrid, color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/gry/kafelki', pays: ['wood', 'stone'] },
      { id: 'domino', icon: Dices, color: 'var(--k-op-add)', ink: '#15803d', route: '/gry/domino', pays: ['wood'] },
    ],
  },
  {
    key: 'grpNumbers',
    pays: ['food'],
    games: [
      { id: 'compare', symbol: '<', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/porownaj', pays: ['food'] },
      { id: 'biggest', symbol: '↑', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/najwieksza', pays: ['food'] },
      { id: 'ascending', symbol: '123', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/rosnaco', pays: ['food'] },
    ],
  },
]

export const GAMES = GROUPS.flatMap((group) => group.games)
```

- [ ] **Step 2: Write the Play page**

Create `src/pages/Play.vue`:

```vue
<script setup>
import { RouterLink } from 'vue-router'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { next } from '@/store/village'
import { GROUPS } from '@/data/games'
import { t } from '@/i18n'

// true when the next building still lacks a material this group can earn
const needed = (pays) =>
  pays.some((k) => (next.value?.cost[k] ?? 0) > village.materials[k])
</script>

<template>
  <h1 class="kid-h1">{{ t('playTitle') }}</h1>
  <section v-for="group in GROUPS" :key="group.key" class="kid-group">
    <h2>
      {{ t(group.key) }}
      <MaterialIcon v-for="k in group.pays" :key="k" :kind="k" :size="16" />
      <span v-if="needed(group.pays)" class="kid-badge">{{ t('needed') }}</span>
    </h2>
    <div class="kid-grid">
      <RouterLink
        v-for="game in group.games"
        :key="game.id"
        :to="`${game.route}/1`"
        class="kid-game"
        :style="{ '--g': game.color, '--ink': game.ink }"
      >
        <component :is="game.icon" v-if="game.icon" :size="28" class="sym" aria-hidden="true" />
        <span v-else class="sym" aria-hidden="true">{{ game.symbol }}</span>
        <span class="lab">{{ t(game.id) }}</span>
        <span v-if="village.bestStreak[game.id]" class="best">
          {{ t('best') }}: {{ village.bestStreak[game.id] }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Add the routes**

In `src/router/index.js`, after the root `village` route object, add:

```js
  {
    path: '/graj',
    name: 'play',
    component: () => import('@/pages/Play.vue'),
  },
```

At the very end of the `routes` array (it must stay last), add:

```js
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
```

- [ ] **Step 4: Add the grid styles**

Append to the end of `src/assets/design/kid.css`:

```css
/* ============================================================================
   PLAY GRID (src/pages/Play.vue)
   ============================================================================ */
.kid-group { display: flex; flex-direction: column; gap: 10px; }
.kid-group h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 800; }
.kid-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
@media (min-width: 1024px) { .kid-grid { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 12px; } }
.kid-game {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  min-height: 92px; padding: 12px 8px; border-radius: 20px; border: 2px solid var(--g);
  background: var(--k-card); color: var(--foreground); text-decoration: none;
  transition: transform .12s ease, box-shadow .12s ease;
}
@media (min-width: 1024px) { .kid-game { min-height: 108px; } }
.kid-game:hover { transform: translateY(-2px); box-shadow: 0 5px 0 rgba(0,0,0,.08); }
.kid-game .sym { font-family: var(--font-mono); font-size: 28px; font-weight: 700; line-height: 1; color: var(--ink); }
.kid-game .lab { font-size: 13px; font-weight: 700; text-align: center; }
.kid-game .best { font-size: 11px; color: var(--muted-foreground); }
```

- [ ] **Step 5: Wire rewards and the back arrow into the five existing pages**

Apply the same three edits to each page. Only the two string arguments differ:

| File | Line of `streak.value += 1` | material | game id |
|---|---|---|---|
| `src/pages/Addition.vue` | 56 | `'wood'` | `'addition'` |
| `src/pages/Subtraction.vue` | 79 | `'wood'` | `'subtraction'` |
| `src/pages/Multiply.vue` | 55 | `'stone'` | `'multiply'` |
| `src/pages/Divide.vue` | 71 | `'stone'` | `'divide'` |
| `src/pages/Divide_2.vue` | 85 | `'stone'` | `'divide2'` |

Edit A, imports. Change the lucide import line from

```js
import { RefreshCw, Check } from 'lucide-vue-next'
```

to

```js
import { RefreshCw, Check, ArrowLeft } from 'lucide-vue-next'
```

and directly under the `import settings from '@/store/settings'` line add:

```js
import { reward, recordStreak } from '@/store/village'
```

Edit B, reward. Directly under the single `streak.value += 1` line (keep its indentation), add these two lines with the material and game id from the table. Example for `Addition.vue`:

```js
  reward('wood', Number(level.value))
  recordStreak('addition', streak.value)
```

`level.value` comes from the route and may be a string, hence `Number()`.

Edit C, back arrow. In the template, make the back link the first child of the status row. Change

```html
    <div class="kid-status">
```

to

```html
    <div class="kid-status">
      <RouterLink to="/graj" class="kid-back" :aria-label="t('back')">
        <ArrowLeft :size="20" />
      </RouterLink>
```

(`RouterLink` and `t` are already imported in all five pages.)

- [ ] **Step 6: Verify in the browser**

Run: `npm run lint && npm run dev`, then:

- `/graj`: a heading, then three headed groups with drawn material icons. Six, two and three cards. Two columns at 390px wide. With a fresh village the first two groups show the `potrzebne` badge (the hut needs wood) and the Numbers group does not.
- Card symbols are the darker ink shades (dark green, brown, indigo, deep pink, teal), borders keep the lighter operation colours.
- Every card opens its game at level 1. Every game has a back arrow that returns to `/graj`.
- `/dodawanie/2`: a correct answer adds 2 wood in localStorage. `/mnozenie/1` adds 1 stone. After a 3-answer streak the card on `/graj` shows `Rekord: 3`.
- `/no-such-page` redirects to `/`.
- `/dodawanie/1`, `/odejmowanie/1`, `/mnozenie/1`, `/dzielenie/1`, `/dzielenie2/1` all still load.

- [ ] **Step 7: Commit**

```bash
git add src/data/games.js src/pages/Play.vue src/router/index.js src/assets/design/kid.css src/pages/Addition.vue src/pages/Subtraction.vue src/pages/Multiply.vue src/pages/Divide.vue src/pages/Divide_2.vue
git commit -m "Add Play grid and pay village materials from the operation pages"
```

---

### Task 9: App shell - header, tabs, settings sheet, desktop side column

**Files:**
- Create: `src/components/RewardsCard.vue`
- Create: `src/components/SettingsSheet.vue`
- Modify: `src/App.vue` (full rewrite)
- Modify: `src/assets/design/kid.css:198-208` (theme token scope) and append

**Interfaces:**
- Consumes: `village` (default), `affordable`, `exportSave`, `checkSave`, `importSave`, `reset` from `@/store/village` (Task 2); `MATERIALS` (Task 1); `<MaterialIcon>`, `<NextGoal>` and CSS `.kid-cols`, `.kid-col-main`, `.kid-col-side`, `.kid-desktop-only`, `.kid-panel` (Task 7); `GAMES` (Task 8); Sheet parts from `@/components/ui/sheet`; `useClipboard` from `@vueuse/core`; i18n keys from Task 4.
- Produces: the final navigation. Nothing downstream.

Background the implementer needs:

1. `SheetContent` renders through a reka-ui portal into `<body>`, which is OUTSIDE `.kid-page`. The theme variables (`--k-brand`, `--k-card-border` and so on) are declared on `.kid-page`, so without Step 1 the sheet would render with undefined colours.
2. `.kid-header` has `backdrop-filter`, which makes it the containing block for any `position: fixed` descendant. The phone tab bar is fixed to the bottom of the viewport, so it must NOT live inside the header. That is why the same two links are rendered twice: once inside the header (shown from 768px) and once as a sibling of the header (shown below 768px).
3. `Village.vue` brings its own two columns (goal and shop on the side). Every other page gets a side column from `App.vue` holding the goal card and what the current game pays. It is desktop only.

- [ ] **Step 1: Let the sheet see the theme tokens**

In `src/assets/design/kid.css`, replace the `.kid-page { ... }` rule at lines 198 to 208 with two rules. The variable declarations move unchanged into the first rule; the layout declarations stay on `.kid-page`:

```css
.kid-page, .kid-sheet {
  --k-brand: #2f6bed; --k-brand-deep: #1f4fc4; --k-brand-soft: #eaf1fe; --k-brand-fg: #ffffff;
  --k-accent: #f6a823; --k-page: #f6f4ee; --k-card: #ffffff;
  --k-card-border: #e8e4dc; --k-card-radius: 26px; --k-card-shadow: var(--shadow-lg);
  --k-border-w: 1px; --k-btn-radius: 16px; --k-btn-lift: 0px;
  --k-display-op: #2f6bed;
  --k-op-add: #22c55e; --k-op-sub: #f59e0b; --k-op-mul: #6366f1; --k-op-div: #ec4899; --k-op-div2: #14b8a6;
}
.kid-page {
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--k-page); font-family: var(--font-sans); color: var(--foreground);
}
```

- [ ] **Step 2: Write the rewards card**

Create `src/components/RewardsCard.vue`:

```vue
<script setup>
import MaterialIcon from '@/components/MaterialIcon.vue'
import { t } from '@/i18n'

defineProps({
  pays: { type: Array, required: true },
})
</script>

<template>
  <section class="kid-panel kid-rewards" :aria-label="t('rewardTitle')">
    <h2>{{ t('rewardTitle') }}</h2>
    <ul>
      <li v-for="kind in pays" :key="kind"><MaterialIcon :kind="kind" /> {{ t(kind) }}</li>
    </ul>
    <p>{{ t('rewardLevel') }}</p>
    <p><MaterialIcon kind="coins" :size="16" /> {{ t('rewardCoins') }}</p>
  </section>
</template>
```

- [ ] **Step 3: Write the settings sheet**

Create `src/components/SettingsSheet.vue`:

```vue
<script setup>
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { SlidersHorizontal, Timer } from 'lucide-vue-next'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import settings from '@/store/settings'
import { exportSave, checkSave, importSave, reset } from '@/store/village'
import { t } from '@/i18n'

// reads the whole village, so it re-computes whenever anything in it changes
const saveString = computed(() => exportSave())
const { copy, copied } = useClipboard({ source: saveString, legacy: true })

const pasted = ref('')
const importFailed = ref(false)

function onLoad() {
  // the pasted text is untrusted: validate first, only then ask to overwrite
  importFailed.value = !checkSave(pasted.value)
  if (importFailed.value) return
  if (!window.confirm(t('confirmImport'))) return
  importSave(pasted.value)
  pasted.value = ''
}

function onReset() {
  if (window.confirm(t('confirmReset'))) reset()
}
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <button class="kid-gear" :aria-label="t('settings')"><SlidersHorizontal :size="20" /></button>
    </SheetTrigger>
    <SheetContent class="kid-root kid-sheet">
      <SheetHeader>
        <SheetTitle>{{ t('settings') }}</SheetTitle>
        <SheetDescription>{{ t('settingsDesc') }}</SheetDescription>
      </SheetHeader>

      <div class="kid-set">
        <span class="kid-set-label">{{ t('language') }}</span>
        <div class="kid-lang" role="group" :aria-label="t('language')">
          <button :class="{ on: settings.lang === 'pl' }" :aria-pressed="settings.lang === 'pl'" @click="settings.lang = 'pl'">PL</button>
          <button :class="{ on: settings.lang === 'en' }" :aria-pressed="settings.lang === 'en'" @click="settings.lang = 'en'">EN</button>
        </div>
      </div>

      <div class="kid-set">
        <button
          class="kid-zegar"
          role="switch"
          :aria-checked="settings.timerEnabled"
          @click="settings.timerEnabled = !settings.timerEnabled"
        >
          <span class="kid-switch" :aria-checked="settings.timerEnabled"></span>
          <Timer :size="16" /> {{ t('timer') }}
        </button>
      </div>

      <div class="kid-set col">
        <label class="kid-set-label" for="save-out">{{ t('exportSave') }}</label>
        <textarea id="save-out" class="kid-save" rows="3" readonly :value="saveString" @focus="$event.target.select()" />
        <button class="kid-btn kid-btn-ghost" @click="copy()">{{ t(copied ? 'copied' : 'copy') }}</button>
      </div>

      <div class="kid-set col">
        <label class="kid-set-label" for="save-in">{{ t('importSave') }}</label>
        <textarea
          id="save-in"
          v-model="pasted"
          class="kid-save"
          :class="{ bad: importFailed }"
          rows="3"
          :placeholder="t('importPlaceholder')"
          @input="importFailed = false"
        />
        <p v-if="importFailed" class="kid-set-error" role="alert">{{ t('importError') }}</p>
        <button class="kid-btn kid-btn-primary" :disabled="!pasted.trim()" @click="onLoad">{{ t('load') }}</button>
      </div>

      <div class="kid-set col">
        <button class="kid-btn kid-danger" @click="onReset">{{ t('resetVillage') }}</button>
      </div>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 4: Rewrite App.vue**

Replace the whole of `src/App.vue` with:

```vue
<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Infinity as InfinityIcon, Home, Gamepad2 } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import NextGoal from '@/components/NextGoal.vue'
import RewardsCard from '@/components/RewardsCard.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import village, { affordable } from '@/store/village'
import { MATERIALS } from '@/data/buildings'
import { GAMES } from '@/data/games'
import { t } from '@/i18n'

const route = useRoute()
const year = new Date().getFullYear()

const onVillage = computed(() => route.path === '/')

const tabs = computed(() => [
  { to: '/', key: 'village', icon: Home, active: onVillage.value, dot: affordable.value },
  { to: '/graj', key: 'play', icon: Gamepad2, active: !onVillage.value, dot: false },
])

// the game being played, matched at a path boundary so `/dzielenie` does not
// also match `/dzielenie2`
const game = computed(() =>
  GAMES.find((g) => route.path === g.route || route.path.startsWith(`${g.route}/`)),
)
</script>

<template>
  <div class="kid-page">
    <header class="kid-header">
      <div class="kid-header-in">
        <span class="kid-mark"><InfinityIcon :size="22" /></span>
        <span class="kid-wordmark">Math <span class="en">{{ t('subtitle') }}</span></span>

        <!-- from 768px the tabs live here; below that see the fixed bar -->
        <nav class="kid-nav-top" aria-label="Main">
          <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
            <component :is="tab.icon" :size="18" /> {{ t(tab.key) }}
            <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
          </RouterLink>
        </nav>

        <RouterLink to="/" class="kid-mats">
          <span v-for="k in MATERIALS" :key="k" class="kid-mat" role="img" :aria-label="`${t(k)}: ${village.materials[k]}`">
            <MaterialIcon :kind="k" />
            <AnimatedInteger :value="village.materials[k]" aria-hidden="true" />
          </span>
        </RouterLink>
        <SettingsSheet />
      </div>
    </header>

    <main class="kid-main">
      <!-- the village page brings its own side column (goal and shop) -->
      <RouterView v-if="onVillage" />
      <div v-else class="kid-cols">
        <div class="kid-col-main"><RouterView /></div>
        <aside class="kid-col-side kid-desktop-only">
          <NextGoal />
          <RewardsCard v-if="game" :pays="game.pays" />
        </aside>
      </div>
    </main>

    <footer class="kid-foot">© Mateusz Woźniak - {{ year }}</footer>

    <!-- phone tab bar. Outside the header on purpose: the header's
         backdrop-filter would capture position: fixed -->
    <nav class="kid-tabs" aria-label="Main">
      <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
        <component :is="tab.icon" :size="20" /> {{ t(tab.key) }}
        <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
      </RouterLink>
    </nav>
  </div>
</template>
```

Note the footer separator is now a plain hyphen (the old file used an em dash, which the project rules forbid).

- [ ] **Step 5: Add the shell styles**

Append to the end of `src/assets/design/kid.css`:

```css
/* ============================================================================
   APP SHELL - counters, tabs, settings sheet, desktop widths
   ============================================================================ */
.kid-mats {
  margin-left: auto; display: flex; align-items: center; gap: 9px; min-height: 44px;
  color: var(--foreground); text-decoration: none;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 700; font-size: 14px;
}
.kid-mat { display: inline-flex; align-items: center; gap: 3px; }
.kid-gear {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 44px; height: 44px; margin-right: -10px; border: none; border-radius: 999px;
  background: transparent; color: var(--muted-foreground); cursor: pointer;
}
.kid-gear:hover { background: var(--k-brand-soft); color: var(--k-brand-deep); }
@media (max-width: 380px) { .kid-header .kid-wordmark { display: none; } .kid-mats { gap: 7px; font-size: 13px; } }

.kid-tab {
  position: relative; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: var(--muted-foreground); font-weight: 800; font-size: 15px; text-decoration: none;
  transition: background .15s ease, color .15s ease;
}
.kid-tab.active { background: var(--k-brand); color: #fff; }
.kid-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--k-accent); animation: iso-pulse 1.2s ease-in-out infinite; }

/* phone: fixed bottom bar */
.kid-nav-top { display: none; }
.kid-tabs {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  display: flex; gap: 8px; padding: 8px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--k-card); border-top: 1px solid var(--k-card-border);
}
.kid-tabs .kid-tab { flex: 1; min-height: 48px; border-radius: var(--k-btn-radius); }
.kid-page { padding-bottom: 76px; } /* room for the fixed tab bar */

/* from 768px: tabs move into the header */
@media (min-width: 768px) {
  .kid-tabs { display: none; }
  .kid-page { padding-bottom: 0; }
  .kid-nav-top { display: flex; gap: 6px; margin-left: 24px; }
  .kid-nav-top .kid-tab { height: 44px; padding: 0 18px; border-radius: 14px; }
}

/* from 1024px: wide two-column page */
@media (min-width: 1024px) {
  .kid-header-in { max-width: 1120px; height: 72px; }
  .kid-main { max-width: 1120px; padding-top: 28px; }
  .kid-nav-top { margin-left: 36px; }
  .kid-mats { gap: 8px; font-size: 15px; }
  .kid-mat { height: 40px; padding: 0 12px; gap: 6px; border-radius: 999px; background: var(--k-card); border: 1px solid var(--k-card-border); }
}

.kid-rewards ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.kid-rewards li { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
.kid-rewards p { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted-foreground); }

.kid-sheet { font-family: var(--font-sans); color: var(--foreground); overflow-y: auto; }
.kid-set { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; border-top: 1px solid var(--k-card-border); }
.kid-set.col { flex-direction: column; align-items: stretch; gap: 8px; }
.kid-set .kid-btn { flex: none; height: 48px; font-size: 15px; }
.kid-set-label { font-size: 14px; font-weight: 700; }
.kid-set-error { margin: 0; font-size: 13px; font-weight: 600; color: #b91c1c; }
.kid-save {
  width: 100%; padding: 10px; border-radius: 12px; border: 1px solid var(--k-card-border);
  background: var(--k-page); color: var(--foreground); resize: none;
  font-family: var(--font-mono); font-size: 11px; line-height: 1.4; word-break: break-all;
}
.kid-save.bad { border: 2px solid #dc2626; background: var(--k-card); }
.kid-danger { background: #fdecec; color: #b91c1c; }

@media (prefers-reduced-motion: reduce) { .kid-dot { animation: none; } }
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run lint && npm run dev`.

At 390px wide:

- Header: logo, four drawn-icon counters, settings button. No horizontal scroll. The five chips are gone. The tab bar is fixed at the bottom and the footer is fully visible above it when scrolled down.
- Village tab is active on `/`, Play tab on `/graj` and on every game.
- Play `/dodawanie/1` until wood reaches 5: the wood counter animates on each answer and a pulsing dot appears on the Village tab. Build the hut and the dot disappears.
- Tapping the counters goes to `/`.
- No goal card on `/graj` or in games (the side column is desktop only). On `/` the goal card and shop sit under the map.
- The settings button opens the sheet with correct brand colours (blue active language pill, blue switch). PL and EN switch every string including the sheet itself. The timer switch still controls the ring on `/dodawanie/1`.
- Copy puts the string on the clipboard and the button reads `Skopiowano!` briefly.
- Paste `hello` and press Load: the field gets a red border, the inline error shows and the village is unchanged. Typing clears the error. Press Clear village and confirm: counters drop to 0. Paste the copied string and press Load, confirm: the village and counters come back exactly.

At 800px wide: no bottom bar; Village and Play are two pills in the header; content is still one 560px column.

At 1280px wide:

- Header and content are 1120px wide. Counters are white pills.
- `/`: map on the left with the building list under it, goal card and shop on the right. The side column stays in view while scrolling.
- `/graj`: six operation cards in one row. On the right the goal card with a `Zobacz wioskę` button.
- `/gry/kafelki/2`: the game card fills the left column, the six result tiles sit in one row. On the right the goal card and a rewards card listing wood and stone. Play until the next building is affordable: the goal button turns into `Masz wszystko! Buduj` and links to `/`.
- `/dodawanie/1`: rewards card lists wood only.

Turn on "reduce motion" in the OS or the DevTools rendering panel: smoke, flag, ghost pulse, tab dot and bar transitions stop.

- [ ] **Step 7: Commit**

```bash
git add src/components/RewardsCard.vue src/components/SettingsSheet.vue src/App.vue src/assets/design/kid.css
git commit -m "Replace operation chips with village and play tabs, counters, settings sheet and desktop side column"
```

---

### Task 10: Final verification

**Files:** none created. Fix anything the checks surface in the file that owns it.

- [ ] **Step 1: Automated checks**

Run: `npm run check && npm run lint && npm run build`
Expected: both "all checks passed" lines, zero lint errors, a successful Vite build.

- [ ] **Step 2: Em dash and emoji sweep**

Run: `grep -rn "—" src/ docs/superpowers/ index.html`
Expected: no output. Replace any hit with a hyphen.

Run: `perl -CSD -ne 'print "$ARGV:$.: $_" if /[\x{1F300}-\x{1FAFF}]/; close ARGV if eof' $(git ls-files src)`
Expected: no output. Replace any emoji with `MaterialIcon` or a lucide icon. (macOS grep has no `-P`, hence perl.)

- [ ] **Step 3: Production smoke test**

Run: `npm run preview`, open the printed URL, and walk the full loop once at 1280px and once at 390px: fresh village, play Domino to 5 wood, build the hut, play Compare for food, earn a coin from a 5-streak, trade it in the shop, open settings, copy the save, clear the village, load the save, confirm everything returns. Hard-reload on `/gry/kafelki/2` and on `/dodawanie/3` to confirm deep links work (`public/_redirects` already handles this in production).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A src
git commit -m "Fix issues found in final verification"
```

Skip this step if nothing changed.
