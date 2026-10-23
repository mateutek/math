// Who walks where in the village: pure rules, no browser. The board draws the
// walkers and calls cast, spawn and tick from its frame loop, blending
// state.from -> state.to by state.t (0..1).
import { BUILDINGS } from './buildings.js'
import {
  PROJ, PATH_COL, PATH_ROW, RIVER_COL, PLOTS, PLOT_CELLS, DECOR_CELLS, cellsOf, groundAt, nearPlot,
} from './villageMap.js'

const N = PROJ.GRID

// One villager per building, women and men mixed across the town.
export const CAST = {
  hut: 'character-female-a',
  well: 'character-male-a',
  farm: 'character-female-b',
  bakery: 'character-male-b',
  school: 'character-female-c',
  mill: 'character-male-c',
  market: 'character-female-d',
  library: 'character-male-d',
  tower: 'character-female-e',
  bridge: 'character-male-e',
  townhall: 'character-female-f',
  castle: 'character-male-f',
}

// A pet turns up once the building it follows is built; null means from the start.
export const PETS = [
  { id: 'dog', actor: 'animal-dog', after: 'hut', ground: 'yard', radius: 4 },
  { id: 'cat', actor: 'animal-cat', after: 'bakery', ground: 'yard', radius: 4 },
  { id: 'cow', actor: 'animal-cow', after: 'farm', ground: 'yard', radius: 3 },
  { id: 'chick', actor: 'animal-chick', after: 'farm', ground: 'yard', radius: 3 },
  { id: 'fox', actor: 'animal-fox', after: null, ground: 'wood' },
  { id: 'bunny', actor: 'animal-bunny', after: null, ground: 'wood' },
]

export function cast(tiers) {
  const out = []
  for (const { id } of BUILDINGS) {
    if (!(tiers[id] >= 1)) continue
    out.push({ id, actor: CAST[id], ground: 'road', home: PLOTS[id], homeId: id, radius: null, speed: 0.8, rest: 'idle' })
  }
  for (const p of PETS) {
    if (p.after && !(tiers[p.after] >= 1)) continue
    out.push({
      id: p.id, actor: p.actor, ground: p.ground, home: null, homeId: p.after, radius: p.radius ?? null,
      speed: 0.5, rest: p.id === 'cow' || p.id === 'chick' ? 'eat' : 'idle',
    })
  }
  return out
}

export function canStand(walker, a, b, tiers) {
  const { ground } = walker
  if (a < 0 || b < 0 || a >= N || b >= N) return false
  if (ground === 'yard') {
    // a patch around the home building: grass or road, never a plot, a tree or the river
    const { homeId, radius } = walker
    if (a === RIVER_COL || !(tiers[homeId] >= 1) || DECOR_CELLS.has(`${a},${b}`)) return false
    if (PLOT_CELLS.some(([x, y]) => x === a && y === b)) return false
    const [ha, hb] = PLOTS[homeId]
    return cellsOf(homeId, tiers[homeId]).some(([dx, dy]) => Math.max(Math.abs(a - ha - dx), Math.abs(b - hb - dy)) <= radius)
  }
  const [name] = groundAt(a, b)
  if (ground === 'road') {
    return name === 'grass_path' || name === 'grass_pathCrossing' || (a === RIVER_COL && b === PATH_ROW && tiers.bridge >= 1)
  }
  // wood: the rim, clear of trees, plots, roads and the river
  return (
    name === 'grass_center' && Math.min(a, b, N - 1 - a, N - 1 - b) < 5 &&
    !DECOR_CELLS.has(`${a},${b}`) && !nearPlot(a, b) &&
    Math.abs(a - PATH_COL) > 1 && Math.abs(b - PATH_ROW) > 1 && Math.abs(a - RIVER_COL) > 1
  )
}

const STEPS = [[0, 1], [-1, 0], [0, -1], [1, 0]]

export const moves = (walker, [a, b], tiers) =>
  STEPS.map(([dx, dy]) => [a + dx, b + dy]).filter(([x, y]) => canStand(walker, x, y, tiers))

// MAP directions, matching how the sprites were rendered.
const FACES = 'NESW'
export const faceOf = ([dx, dy]) => FACES[STEPS.findIndex(([x, y]) => x === dx && y === dy)]

// Straight on weighs 3, each turn 1, and back only when nothing else is left.
function choose(walker, [a, b], face, tiers, rand) {
  const opts = moves(walker, [a, b], tiers)
  if (!opts.length) return null
  const [fx, fy] = STEPS[FACES.indexOf(face)]
  const fwd = opts.filter(([x, y]) => x - a === fx && y - b === fy)
  const side = opts.filter(([x, y]) => x - a !== -fx && y - b !== -fy && !fwd.some(([p, q]) => p === x && q === y))
  const pool = side.length || fwd.length ? [...fwd, ...fwd, ...fwd, ...side] : opts
  return pool[Math.floor(rand() * pool.length)]
}

export function spawn(walker, tiers, rand) {
  const { ground, home } = walker
  const cells = []
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (canStand(walker, a, b, tiers)) cells.push([a, b])
  if (!cells.length) return null
  let at
  if (ground === 'road') {
    // cells run in a-then-b order, so a strict < keeps the lowest a, then b, on ties
    const dist = ([a, b]) => Math.abs(a - home[0]) + Math.abs(b - home[1])
    at = cells.reduce((best, c) => (dist(c) < dist(best) ? c : best))
  } else {
    at = cells[Math.floor(rand() * cells.length)]
  }
  const state = { a: at[0], b: at[1], from: at, to: null, t: 0, face: 'S', clip: walker.rest, wait: 0 }
  if (ground === 'road') {
    // wander 0-3 cells so villagers sharing a home don't pile up
    for (let i = Math.floor(rand() * 4); i > 0; i--) {
      const next = choose(walker, [state.a, state.b], state.face, tiers, rand)
      if (!next) break
      state.face = faceOf([next[0] - state.a, next[1] - state.b])
      state.a = next[0]
      state.b = next[1]
      state.from = next
    }
  }
  return state
}

function pick(state, walker, tiers, rand) {
  const next = choose(walker, [state.a, state.b], state.face, tiers, rand)
  state.from = [state.a, state.b]
  state.t = 0
  state.to = next
  if (next) {
    state.face = faceOf([next[0] - state.a, next[1] - state.b])
    state.clip = 'walk'
  } else {
    state.clip = walker.rest
  }
}

function step(state, walker, tiers, dt, rand) {
  if (state.wait > 0) {
    state.wait = Math.max(0, state.wait - dt)
    state.clip = walker.rest
    if (state.wait === 0) pick(state, walker, tiers, rand)
    return
  }
  // tiers changed under us: drop the target and look again
  if (state.to && !canStand(walker, state.to[0], state.to[1], tiers)) state.to = null
  if (!state.to) {
    pick(state, walker, tiers, rand)
    return
  }
  state.t += walker.speed * dt
  state.clip = 'walk'
  if (state.t < 1) return
  state.a = state.to[0]
  state.b = state.to[1]
  state.from = [state.a, state.b]
  state.t = 0
  if (rand() < (PETS.some((p) => p.id === walker.id) ? 0.3 : 0.05)) {
    state.to = null
    state.wait = 1 + rand() * 3
    state.clip = walker.rest
  } else {
    pick(state, walker, tiers, rand)
  }
}

export function tick(state, walker, tiers, dt, rand) {
  // small steps, so a long frame never skips past a decision point
  for (let left = dt; left > 1e-9; left -= 0.1) step(state, walker, tiers, Math.min(0.1, left), rand)
  return state
}
