// The village map: its geometry, its ground plan and where every sprite goes.
// Pure data and pure functions - no Vue, no DOM, no import.meta - so this file
// runs under plain node (see villageMap.check.js).
//
// Two kinds of art live in public/village/. Buildings and ground tiles are
// whole sprites rendered by ../math-village-designer into buildings/, one per
// tier, each with its own size and anchor (see villageSprites.json). Trees,
// rocks and the unbuilt-plot frames are still pieces of the old isometric kit,
// all on one 256 x 352 canvas. Either way every sprite exists in four facings,
// `<name>_N.png` .. `<name>_W.png`, and N -> E -> S -> W is one 90 degree
// clockwise turn on screen. Rotating the town therefore means rotating every
// cell and stepping every facing, never CSS-rotating the map.
import { BUILDINGS } from './buildings.js'
import SPRITES from './villageSprites.json' with { type: 'json' }

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------
// These are the design board's numbers, not the kit's true geometry. The kit's
// diamond measures 232 x 110 sprite px (a 2.11:1 render); the board projects it
// as a clean 2:1 tile of 48 x 24 map units and that is what every screenshot in
// the design was measured against, so the board wins. This object is the one
// calibration knob on the whole map: change a number here and every seam moves
// together.
//
// GRID is the size of the land. The canvas is derived from it, so it is safe to
// change; the ground plan and the plots below are authored for 32.
const GRID = 32
const HEADROOM = 116 // a tier 3 tower on the back corner rises 111 units above the origin
const SKIRT = 40 // the ground tiles are blocks: their earth sides hang 32 units below the front edge

export const PROJ = {
  GRID,
  TILE_W: 48, // tile diamond, in map units
  TILE_H: 24,
  DIAMOND: 232, // width of the opaque diamond inside a sprite, in sprite px
  LEVEL: 110, // one stack level, in sprite px
  SPRITE_W: 256,
  SPRITE_H: 352,
  GROUND: 184, // sprite px row of the centre of a level 0 block's top face
  // the logical canvas the whole map is laid out in: the ground diamond plus a
  // small margin, plus the headroom above and the skirt below
  CANVAS_W: GRID * 48 + 16,
  CANVAS_H: GRID * 24 + HEADROOM + SKIRT,
  ORIGIN_X: GRID * 24 + 8, // where map unit (0, 0) sits inside that canvas
  ORIGIN_Y: HEADROOM,
}

export const SCALE = PROJ.TILE_W / PROJ.DIAMOND // sprite px -> map units
export const HALF = (PROJ.SPRITE_W / 2) * SCALE // half a drawn sprite
export const LIFT = PROJ.LEVEL * SCALE // one stack level, in map units
export const SPRITE_W = PROJ.SPRITE_W * SCALE
export const SPRITE_H = PROJ.SPRITE_H * SCALE

// screen position of a cell's floor centre, in map units
export const cellX = (a, b) => ((a - b) * PROJ.TILE_W) / 2
export const cellY = (a, b) => ((a + b) * PROJ.TILE_H) / 2

// top-left of the 256x352 sprite canvas for a piece on that cell, at that level
export const spriteX = (a, b) => cellX(a, b) - HALF
export const spriteY = (a, b, level) => cellY(a, b) - HALF - level * LIFT

export const spriteFile = (name, facing) => `${name}_${facing}.png`

// a designer sprite; ground tiles only have tier 1
export const artFile = (id, tier, facing = 'N') => `buildings/${id}_t${tier}_${facing}.png`

// where the ground is, below cellY: the centre of a level 0 block's top face
export const GROUND_DY = PROJ.GROUND * SCALE - HALF

// a designer sprite's box in map units: its anchor px lands on the ground
// centre of cell (a, b). Sizes and anchors come from the render, never from here.
export function artBox(id, tier, facing, a, b) {
  const [w, h, ax, ay] = SPRITES[`${id}_t${tier}`][facing]
  return {
    file: artFile(id, tier, facing),
    x: cellX(a, b) - ax * SCALE,
    y: cellY(a, b) + GROUND_DY - ay * SCALE,
    w: w * SCALE,
    h: h * SCALE,
  }
}

// a kit piece's box: the shared 256 x 352 canvas, lifted one LIFT per level
const kitBox = (name, facing, a, b, level) => ({
  file: spriteFile(name, facing),
  x: spriteX(a, b),
  y: spriteY(a, b, level),
  w: SPRITE_W,
  h: SPRITE_H,
})

// ---------------------------------------------------------------------------
// Rotation
// ---------------------------------------------------------------------------
const FACES = 'NESW'

// one quarter turn clockwise per step
export const rotFace = (f, r = 1) => FACES[(FACES.indexOf(f) + r) & 3]

// A turn maps +a to +b and +b to -a, so (a, b) -> (m-1-b, a) keeps the whole
// square map inside 0..m-1.
export function rotCell([a, b], r = 1, m = PROJ.GRID) {
  for (let i = (r % 4) + (r < 0 ? 4 : 0); i > 0; i--) [a, b] = [m - 1 - b, a]
  return [a, b]
}

// the same turn applied to an offset from a building's anchor cell
export function rotOffset([dx, dy], r = 1) {
  for (let i = (r % 4) + (r < 0 ? 4 : 0); i > 0; i--) [dx, dy] = [-dy, dx]
  return [dx, dy]
}

// ---------------------------------------------------------------------------
// The ground plan
// ---------------------------------------------------------------------------
// The design board's town, given room: one river column, two roads that cross
// west of it. The road is deliberately broken where it meets the river - that
// is where the bridge goes.
export const RIVER_COL = 24
export const PATH_COL = 12
export const PATH_ROW = 16

export function groundAt(a, b) {
  if (a === RIVER_COL) return ['grass_river', 'E']
  if (a === PATH_COL && b === PATH_ROW) return ['grass_pathCrossing', 'N']
  if (a === PATH_COL) return ['grass_path', 'E']
  if (b === PATH_ROW) return ['grass_path', 'N']
  return ['grass_center', 'N']
}

// Which map directions a ground piece joins, written for facing N. dx/dy are
// steps in cell coordinates. Used by the check to prove a turn keeps the road
// and the river connected.
export const CONNECTS = {
  grass_path: [[1, 0], [-1, 0]],
  grass_river: [[1, 0], [-1, 0]],
  grass_pathCrossing: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  grass_pathBend: [[1, 0], [0, 1]],
}

// The sprite that draws each ground piece, and how many quarter turns to add
// to its facing: the designer's straight path and river run along b at N,
// where CONNECTS has them along a. Measured off the rendered tiles. There is
// also a `tile-riverbend`, turned like `tile-bend`; the plan has no use for it.
export const TILES = {
  grass_center: ['tile-grass', 0],
  grass_path: ['tile-path', 1],
  grass_river: ['tile-river', 1],
  grass_pathCrossing: ['tile-crossing', 0],
  grass_pathBend: ['tile-bend', 0],
}

// ---------------------------------------------------------------------------
// The twelve plots
// ---------------------------------------------------------------------------
// Anchor cell per building id. The board's neighbourhoods, spread out: homes and
// civic buildings north of the road, trade and the farm south of it, the tower
// and the castle across the river. Every plot stands two cells off a road and
// at least four from its neighbour, because the sprites overhang their cells.
export const PLOTS = {
  hut: [7, 13],
  well: [15, 19],
  farm: [2, 20],
  bakery: [20, 13],
  school: [9, 8],
  mill: [19, 6],
  market: [19, 19],
  library: [8, 19],
  tower: [28, 4],
  bridge: [RIVER_COL, PATH_ROW],
  townhall: [15, 13],
  castle: [28, 21],
}

// What an unbuilt plot draws. The board uses the tall grey frame for the next
// building (pulsing) and the low one for everything still only planned.
export const GHOST = {
  next: ['structure_high', 'N', 2],
  plan: ['structure_low', 'E', 1.2],
}

// ---------------------------------------------------------------------------
// The cells a built tier stands on, as offsets from its anchor
// ---------------------------------------------------------------------------
// A sprite's `footprint: [w, h]` covers dx 0..w-1, dy 0..h-1 and cannot express
// a negative cell. From the tier given here up, these also keep the old back
// wing at (0, -1) - see docs/game-import.md in the designer. Sprites overhang
// their cells on purpose (mill blades, awnings), so cells are for picking and
// depth only, never for clipping.
const BACK_WING = { hut: 3, school: 3, library: 3, townhall: 2, castle: 2 }

export function cellsOf(id, tier) {
  const [w, h] = SPRITES[`${id}_t${tier}`].footprint
  const cells = tier >= BACK_WING[id] ? [[0, -1]] : []
  for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) cells.push([dx, dy])
  return cells
}

// ---------------------------------------------------------------------------
// Decorations: [a, b, piece, facing], all at level 1
// ---------------------------------------------------------------------------
// Scattered, not placed: a wood round the rim thinning to the odd tree in town.
// A hash of the cell decides, so the land is the same on every load. Nothing
// grows on or beside a road or the river, or within two cells of any plot.
const DECOR_PIECES = ['tree_pine', 'tree_single', 'tree_multiple', 'tree_pineLarge', 'tree_pine', 'rocks_grass']

const hash = (a, b) => (Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663)) >>> 0

// every cell any tier of any building can stand on
const PLOT_CELLS = BUILDINGS.flatMap((d) =>
  d.cost.flatMap((_, i) => cellsOf(d.id, i + 1).map(([dx, dy]) => [PLOTS[d.id][0] + dx, PLOTS[d.id][1] + dy])),
)
const nearPlot = (a, b) => PLOT_CELLS.some(([x, y]) => Math.abs(a - x) < 3 && Math.abs(b - y) < 3)

export const DECOR = (() => {
  const out = []
  for (let a = 0; a < GRID; a++) {
    for (let b = 0; b < GRID; b++) {
      if ([RIVER_COL, PATH_COL].some((c) => Math.abs(a - c) < 2) || Math.abs(b - PATH_ROW) < 2) continue
      if (nearPlot(a, b)) continue
      const rim = Math.min(a, b, GRID - 1 - a, GRID - 1 - b)
      const h = hash(a, b)
      if (h % 100 >= (rim < 2 ? 60 : rim < 5 ? 25 : 7)) continue
      out.push([a, b, DECOR_PIECES[(h >>> 8) % DECOR_PIECES.length], 'S'])
    }
  }
  return out
})()

// The same hash dresses the ground: about one open grass cell in five grows
// flowers, tufts or stones instead of plain grass, and the odd river cell a
// lily. Plots and tree cells stay plain, so nothing pokes through what stands
// there, and so does the water next to the bridge.
const GRASSES = ['flowers', 'meadow', 'mushrooms', 'stones', 'tufts', 'bushes']
const DECOR_CELLS = new Set(DECOR.map(([a, b]) => `${a},${b}`))

export function tileAt(a, b) {
  const [name, facing] = groundAt(a, b)
  const [tile, turns] = TILES[name]
  const h = hash(b, a)
  let pick = tile
  if (name === 'grass_center' && h % 100 < 20 && !nearPlot(a, b) && !DECOR_CELLS.has(`${a},${b}`)) {
    pick = `tile-grass-${GRASSES[(h >>> 8) % GRASSES.length]}`
  } else if (name === 'grass_river' && h % 100 < 25 && Math.abs(b - PATH_ROW) > 1) {
    pick = 'tile-river-lily'
  }
  return [pick, rotFace(facing, turns)]
}

// ---------------------------------------------------------------------------
// Turning all of that into a draw list
// ---------------------------------------------------------------------------
// Painter's algorithm: back to front by depth, then low floors before high
// ones, then insertion order inside a cell. Ground and objects are two passes,
// exactly as the board draws them: a flat tile in front of a building must be
// able to cover that building's base.
const TILE_BLEED = 0.4 // map units; about two sprite px

const byDepth = (p, q) => p.a + p.b - (q.a + q.b) || p.level - q.level || p.i - q.i

// the cell a building's label sits over: the one nearest the mean screen x of
// its footprint, nearest cell first on a tie
function labelCell(cells) {
  const mean = cells.reduce((sum, c) => sum + cellX(c[0], c[1]), 0) / cells.length
  return cells
    .slice()
    .sort(
      (p, q) =>
        Math.abs(cellX(p[0], p[1]) - mean) - Math.abs(cellX(q[0], q[1]) - mean) ||
        p[0] + p[1] - (q[0] + q[1]),
    )[0]
}

/**
 * Everything the map draws.
 * @param rotation quarter turns clockwise, 0..3
 * @param tiers    { [buildingId]: tier }, missing or 0 meaning unbuilt
 * @param nextId   the one unbuilt building that can be built now, or null
 */
export function mapItems(rotation, tiers = {}, nextId = null) {
  const r = ((rotation % 4) + 4) % 4
  const ground = []
  const objects = []
  const buildings = []

  // ponytail: one <img> per ground cell, 1024 at GRID 32. Fine on a tablet; if
  // a bigger land ever stutters, paint the ground once to a canvas instead.
  for (let a = 0; a < PROJ.GRID; a++) {
    for (let b = 0; b < PROJ.GRID; b++) {
      const [tile, facing] = tileAt(a, b)
      const [ra, rb] = rotCell([a, b], r)
      const box = artBox(tile, 1, rotFace(facing, r), ra, rb)
      ground.push({
        key: `g${a}.${b}`,
        file: box.file,
        // Tiles meet edge to edge, and their antialiased rims let the page show
        // through as a grid. Overlap each one a hair past its cell instead.
        x: box.x - TILE_BLEED,
        y: box.y - TILE_BLEED / 2,
        w: box.w + TILE_BLEED * 2,
        h: box.h + TILE_BLEED,
        a: ra,
        b: rb,
        level: 0,
        i: ground.length,
      })
    }
  }

  for (const [a, b, name, facing] of DECOR) {
    const [ra, rb] = rotCell([a, b], r)
    objects.push({
      key: `d${objects.length}`,
      ...kitBox(name, rotFace(facing, r), ra, rb, 1),
      a: ra,
      b: rb,
      level: 1,
      i: objects.length,
      state: '',
    })
  }

  for (const def of BUILDINGS) {
    const tier = tiers[def.id] || 0
    const anchor = rotCell(PLOTS[def.id], r)
    const status = tier ? 'built' : def.id === nextId ? 'next' : 'plan'
    let cells = [anchor]
    let top
    let labelLevel = 1

    if (tier) {
      cells = cellsOf(def.id, tier).map((d) => {
        const [ox, oy] = rotOffset(d, r)
        return [anchor[0] + ox, anchor[1] + oy]
      })
      // One image, already rendered for this rotation: only its anchor cell
      // turns. It sorts by its front-most cell, so whatever stands in front of
      // any part of it is drawn after it.
      const front = cells.reduce((p, q) => (q[0] + q[1] > p[0] + p[1] ? q : p))
      const box = artBox(def.id, tier, FACES[r], anchor[0], anchor[1])
      objects.push({
        key: def.id,
        ...box,
        a: front[0],
        b: front[1],
        level: 1,
        i: objects.length,
        state: '',
        id: def.id,
      })
      // how far the image rises above the label cell, in stack levels
      const label = labelCell(cells)
      top = labelLevel = Math.max(1.2, (cellY(label[0], label[1]) - box.y) / LIFT)
    } else {
      const [name, facing, ghostTop] = GHOST[status]
      objects.push({
        key: `${def.id}.ghost`,
        ...kitBox(name, rotFace(facing, r), anchor[0], anchor[1], 1),
        a: anchor[0],
        b: anchor[1],
        level: 1,
        i: objects.length,
        state: status,
        id: def.id,
      })
      top = ghostTop
    }

    buildings.push({ id: def.id, tier, status, cells, top, label: labelCell(cells), labelLevel })
  }

  ground.sort(byDepth)
  objects.sort(byDepth)
  return { ground, objects, buildings }
}

// every sprite file the map can ever ask for, in all four facings
export function allSpriteFiles() {
  const kit = new Set([...DECOR.map((d) => d[2]), ...Object.values(GHOST).map((g) => g[0])])
  const art = [
    ...Object.values(TILES).map(([tile]) => [tile, 1]),
    ...GRASSES.map((g) => [`tile-grass-${g}`, 1]),
    ['tile-river-lily', 1],
    ...BUILDINGS.flatMap((d) => d.cost.map((_, i) => [d.id, i + 1])),
  ]
  return [...FACES].flatMap((f) => [
    ...[...kit].map((n) => spriteFile(n, f)),
    ...art.map(([id, tier]) => artFile(id, tier, f)),
  ])
}
