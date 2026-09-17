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
