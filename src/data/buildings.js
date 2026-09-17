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
