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
export const PROJ = {
  GRID: 12, // 12 x 12 ground cells
  TILE_W: 48, // tile diamond, in map units
  TILE_H: 24,
  DIAMOND: 232, // width of the opaque diamond inside a sprite, in sprite px
  LEVEL: 110, // one stack level, in sprite px
  SPRITE_W: 256,
  SPRITE_H: 352,
  GROUND: 184, // sprite px row of the centre of a level 0 block's top face
  CANVAS_W: 592, // the logical canvas the whole map is laid out in
  CANVAS_H: 360,
  ORIGIN_X: 296, // where map unit (0, 0) sits inside that canvas
  ORIGIN_Y: 52,
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

// Designer sprites. The file for a building tier, or null when it was never
// rendered and the kit composition in BUILDING_ART has to stand in.
export const artFile = (id, tier, facing = 'N') =>
  SPRITES[`${id}_t${tier}`] ? `buildings/${id}_t${tier}_${facing}.png` : null

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

// The opaque region inside the 256 x 352 sprite canvas, in sprite px, measured
// off grass_block_N. Everything outside it is transparent padding, so a
// thumbnail that crops to it wastes no space.
export const CONTENT = { x: 12, y: 128, w: PROJ.DIAMOND, h: 222 }

/**
 * Fit a building's piece list into a fixed thumbnail box, the way the design's
 * goal card crops its sprite. Returns absolute CSS boxes in the box's own
 * coordinates; anything outside it is meant to be clipped.
 */
export function fitArt(pieces, boxW, boxH) {
  const placed = pieces.map(([dx, dy, level, name, facing]) => ({
    name,
    facing,
    x: spriteX(dx, dy),
    y: spriteY(dx, dy, level),
  }))
  const x0 = Math.min(...placed.map((p) => p.x)) + CONTENT.x * SCALE
  const x1 = Math.max(...placed.map((p) => p.x)) + (CONTENT.x + CONTENT.w) * SCALE
  const y0 = Math.min(...placed.map((p) => p.y)) + CONTENT.y * SCALE
  const y1 = Math.max(...placed.map((p) => p.y)) + (CONTENT.y + CONTENT.h) * SCALE
  const k = Math.min(boxW / (x1 - x0), boxH / (y1 - y0))
  const ox = (boxW - (x1 - x0) * k) / 2 - x0 * k
  const oy = (boxH - (y1 - y0) * k) / 2 - y0 * k
  return placed.map((p, i) => ({
    key: `${p.name}${i}`,
    name: p.name,
    facing: p.facing,
    left: p.x * k + ox,
    top: p.y * k + oy,
    width: SPRITE_W * k,
    height: SPRITE_H * k,
  }))
}

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
// The ground plan, straight off the board
// ---------------------------------------------------------------------------
// Column a=9 is the river, column a=4 and row b=6 are the two roads, and they
// cross at (4, 6). The road is deliberately broken where it meets the river at
// (9, 6) - that is where the bridge goes. This reproduces the board's 144 tiles
// exactly: 110 grass, 12 river, 11 path_E, 10 path_N, 1 crossing.
export const RIVER_COL = 9
export const PATH_COL = 4
export const PATH_ROW = 6

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

// the board's 23 decorations: [a, b, piece, facing], all at level 1
export const DECOR = [
  [0, 0, 'tree_multiple', 'S'],
  [0, 1, 'tree_pineLarge', 'S'],
  [1, 0, 'tree_pine', 'S'],
  [2, 1, 'tree_single', 'S'],
  [0, 4, 'tree_pine', 'S'],
  [2, 2, 'rocks_grass', 'S'],
  [6, 0, 'tree_multiple', 'S'],
  [7, 0, 'tree_pine', 'S'],
  [7, 3, 'tree_single', 'S'],
  [0, 11, 'tree_single', 'S'],
  [7, 4, 'rocks_grass', 'S'],
  [11, 0, 'tree_pineLarge', 'S'],
  [1, 11, 'tree_pine', 'S'],
  [10, 3, 'tree_pine', 'S'],
  [5, 10, 'tree_single', 'S'],
  [11, 4, 'tree_multiple', 'S'],
  [8, 8, 'rocks_grass', 'S'],
  [6, 11, 'tree_pine', 'S'],
  [7, 10, 'tree_multiple', 'S'],
  [8, 9, 'tree_single', 'S'],
  [11, 8, 'tree_pine', 'S'],
  [10, 11, 'tree_single', 'S'],
  [11, 11, 'tree_pineLarge', 'S'],
]

// ---------------------------------------------------------------------------
// The twelve plots
// ---------------------------------------------------------------------------
// Anchor cell per building id, matching the board's VM_BUILDINGS one for one
// (chatka/studnia/farma/... are the Polish names of hut/well/farm/...).
export const PLOTS = {
  hut: [2, 5],
  well: [5, 7],
  farm: [0, 8],
  bakery: [6, 5],
  school: [3, 3],
  mill: [8, 2],
  market: [6, 7],
  library: [3, 8],
  tower: [10, 1],
  bridge: [9, 6],
  townhall: [5, 5],
  castle: [10, 9],
}

// What an unbuilt plot draws. The board uses the tall grey frame for the next
// building (pulsing) and the low one for everything still only planned.
export const GHOST = {
  next: ['structure_high', 'N', 2],
  plan: ['structure_low', 'E', 1.2],
}

// ---------------------------------------------------------------------------
// Building art: [dx, dy, level, piece, facing] per tier, relative to the anchor
// ---------------------------------------------------------------------------
// Tier 1 of hut, bakery, well and farm is the board's composition, piece for
// piece. Everything else is composed from the same kit on the board's rules:
// a roof colour per role (brown = home and work, green = civic, purple =
// knowledge and trade), beige walls for the stone civic buildings, and each
// tier visibly taller than the last. Second cells always sit at dy = -1, i.e.
// behind the main block on screen, so a tall wing never hides its own facade;
// every one of them is plain grass with no decor on the board.
export const BUILDING_ART = {
  // board tier 1: beige cottage under a brown gable
  hut: [
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'roof_gableBrown', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'roof_gableBrown', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'roof_gableBrown', 'N'],
      [0, -1, 1, 'building_windowsBeige', 'E'],
      [0, -1, 2, 'roof_slantBrown', 'E'],
    ],
  ],
  // board tier 1: the well sprite itself, then a fence, then a fenced yard
  well: [
    [[0, 0, 1, 'well', 'S']],
    [
      [0, 0, 1, 'well', 'S'],
      [0, 0, 1, 'fence_wood', 'E'],
    ],
    // roofed over rather than spread out: the well's only free neighbour is the
    // road, and a tier 3 that stays one cell keeps it reachable next to the market
    [
      [0, 0, 1, 'well', 'S'],
      [0, 0, 1, 'structure_low', 'E'],
      [0, 0, 1, 'fence_woodDouble', 'N'],
      [0, 0, 2, 'roof_slantBeige', 'E'],
    ],
  ],
  // board tier 1: six furrow tiles. Later tiers keep the same six cells and
  // grow a barn on the back one, so the farm never needs more ground.
  farm: [
    [
      [0, 0, 1, 'furrow_cropWheat', 'S'],
      [0, 1, 1, 'furrow_crop', 'S'],
      [1, 0, 1, 'furrow_crop', 'S'],
      [1, 1, 1, 'furrow_cropWheat', 'S'],
      [2, 0, 1, 'furrow_cropWheat', 'S'],
      [2, 1, 1, 'furrow_crop', 'S'],
    ],
    [
      [0, 0, 1, 'building_doorWindows', 'E'],
      [0, 0, 2, 'roof_slantBrown', 'E'],
      [0, 1, 1, 'furrow_crop', 'S'],
      [1, 0, 1, 'furrow_cropWheat', 'S'],
      [1, 1, 1, 'furrow_cropWheat', 'S'],
      [2, 0, 1, 'furrow_cropWheat', 'S'],
      [2, 1, 1, 'furrow_crop', 'S'],
    ],
    [
      [0, 0, 1, 'building_doorWindows', 'E'],
      [0, 0, 2, 'building_stack', 'E'],
      [0, 0, 3, 'roof_gableBrown', 'N'],
      [0, 1, 1, 'furrow_cropWheat', 'S'],
      [0, 1, 1, 'fence_woodDouble', 'E'],
      [1, 0, 1, 'furrow_cropWheat', 'S'],
      [1, 1, 1, 'furrow_cropWheat', 'S'],
      [2, 0, 1, 'furrow_cropWheat', 'S'],
      [2, 1, 1, 'furrow_cropWheat', 'S'],
      [2, 1, 1, 'fence_woodDouble', 'E'],
    ],
  ],
  // board tier 1: a three-storey stack under a round green roof
  bakery: [
    [
      [0, 0, 1, 'building_door', 'E'],
      [0, 0, 2, 'building_windows', 'E'],
      [0, 0, 3, 'building_window', 'E'],
      [0, 0, 4, 'roof_roundedGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_door', 'E'],
      [0, 0, 2, 'building_windows', 'E'],
      [0, 0, 3, 'building_window', 'E'],
      [0, 0, 4, 'building_stack', 'E'],
      [0, 0, 5, 'roof_roundedGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_door', 'E'],
      [0, 0, 2, 'building_windows', 'E'],
      [0, 0, 3, 'building_window', 'E'],
      [0, 0, 3, 'balcony_wood', 'E'],
      [0, 0, 4, 'building_stack', 'E'],
      [0, 0, 5, 'roof_roundedGreen', 'N'],
      [0, -1, 1, 'structure_low', 'E'],
      [0, -1, 2, 'roof_slantPurple', 'E'],
    ],
  ],
  // green roofs, then a bell spire behind
  school: [
    [
      [0, 0, 1, 'building_doorWindows', 'E'],
      [0, 0, 2, 'roof_gableGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindows', 'E'],
      [0, 0, 2, 'building_stack', 'E'],
      [0, 0, 3, 'roof_gableGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindows', 'E'],
      [0, 0, 2, 'building_stack', 'E'],
      [0, 0, 3, 'roof_gableGreen', 'N'],
      [0, -1, 1, 'building_windows', 'E'],
      [0, -1, 2, 'building_stack', 'E'],
      [0, -1, 3, 'building_stackCorner', 'E'],
      [0, -1, 4, 'roof_churchGreen', 'N'],
    ],
  ],
  // a tower mill: round cap, then a pointed one, then a balcony
  mill: [
    [
      [0, 0, 1, 'building_center', 'E'],
      [0, 0, 2, 'roof_roundBrown', 'N'],
    ],
    [
      [0, 0, 1, 'building_door', 'E'],
      [0, 0, 2, 'building_stack', 'E'],
      [0, 0, 3, 'roof_pointBrown', 'N'],
    ],
    [
      [0, 0, 1, 'building_door', 'E'],
      [0, 0, 2, 'building_stack', 'E'],
      [0, 0, 3, 'building_stack', 'E'],
      [0, 0, 3, 'balcony_wood', 'E'],
      [0, 0, 4, 'roof_pointBrown', 'N'],
    ],
  ],
  // open stalls, no walls, spreading sideways instead of up
  market: [
    [
      [0, 0, 1, 'structure_low', 'E'],
      [0, 0, 2, 'roof_slantPurple', 'E'],
    ],
    [
      [0, 0, 1, 'structure_low', 'E'],
      [0, 0, 2, 'roof_slantPurple', 'E'],
      [0, 1, 1, 'structure_arch', 'N'],
      [0, 1, 2, 'roof_slantGreen', 'N'],
    ],
    [
      [0, 0, 1, 'structure_low', 'E'],
      [0, 0, 2, 'roof_slantPurple', 'E'],
      [0, 1, 1, 'structure_arch', 'N'],
      [0, 1, 2, 'roof_slantGreen', 'N'],
      [1, 0, 1, 'structure_high', 'N'],
      [1, 0, 2, 'roof_slantBeige', 'E'],
    ],
  ],
  // beige walls, purple roofs, a purple spire behind
  library: [
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'roof_gablePurple', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'roof_gablePurple', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'roof_gablePurple', 'N'],
      [0, -1, 1, 'building_windowsBeige', 'E'],
      [0, -1, 2, 'building_stackBeige', 'E'],
      [0, -1, 3, 'building_stackCornerBeige', 'E'],
      [0, -1, 4, 'roof_churchPurple', 'N'],
    ],
  ],
  // a castle tower that simply gets taller
  tower: [
    [
      [0, 0, 1, 'castle_towerBrownBase', 'N'],
      [0, 0, 2, 'castle_towerBrownTop', 'N'],
    ],
    [
      [0, 0, 1, 'castle_towerBrownBase', 'N'],
      [0, 0, 2, 'castle_tower', 'N'],
      [0, 0, 3, 'castle_towerBrownTop', 'N'],
    ],
    [
      [0, 0, 1, 'castle_towerBrownBase', 'N'],
      [0, 0, 2, 'castle_window', 'E'],
      [0, 0, 3, 'castle_tower', 'N'],
      [0, 0, 4, 'castle_towerBrownTop', 'N'],
    ],
  ],
  // sits on the river cell the road runs into; tier 3 roofs it over
  bridge: [
    [[0, 0, 1, 'bridge', 'N']],
    [
      [0, 0, 1, 'bridge', 'N'],
      [0, 0, 1, 'fence_wood', 'N'],
    ],
    [
      [0, 0, 1, 'bridge', 'N'],
      [0, 0, 1, 'structure_arch', 'N'],
      [0, 0, 2, 'roof_gableBrown', 'N'],
    ],
  ],
  // beige and green, with a clock turret on the back wing
  townhall: [
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'roof_gableGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'roof_gableGreen', 'N'],
      [0, -1, 1, 'building_windowsBeige', 'E'],
      [0, -1, 2, 'roof_gableCornerGreen', 'N'],
    ],
    [
      [0, 0, 1, 'building_doorWindowsBeige', 'E'],
      [0, 0, 2, 'building_stackBeige', 'E'],
      [0, 0, 3, 'building_stackBeige', 'E'],
      [0, 0, 4, 'roof_gableGreen', 'N'],
      [0, -1, 1, 'building_windowsBeige', 'E'],
      [0, -1, 2, 'building_stackBeige', 'E'],
      [0, -1, 3, 'building_stackCornerBeige', 'E'],
      [0, -1, 4, 'castle_towerGreenTop', 'N'],
    ],
  ],
  // a ruin, then a gate and one tower, then a gate and two
  castle: [
    [[0, 0, 1, 'castle_endRuined', 'E']],
    [
      [0, 0, 1, 'castle_gateOpen', 'N'],
      [0, -1, 1, 'castle_tower', 'N'],
      [0, -1, 2, 'castle_towerPurpleTop', 'N'],
    ],
    [
      [0, 0, 1, 'castle_gateOpen', 'N'],
      [0, -1, 1, 'castle_tower', 'N'],
      [0, -1, 2, 'castle_tower', 'N'],
      [0, -1, 3, 'castle_towerPurpleTop', 'N'],
      [1, 0, 1, 'castle_tower', 'N'],
      [1, 0, 2, 'castle_towerBeigeTop', 'N'],
    ],
  ],
}

// ---------------------------------------------------------------------------
// Turning all of that into a draw list
// ---------------------------------------------------------------------------
// Painter's algorithm: back to front by depth, then low floors before high
// ones, then insertion order inside a cell. Ground and objects are two passes,
// exactly as the board draws them: a flat tile in front of a building must be
// able to cover that building's base.
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

  for (let a = 0; a < PROJ.GRID; a++) {
    for (let b = 0; b < PROJ.GRID; b++) {
      const [name, facing] = groundAt(a, b)
      const [ra, rb] = rotCell([a, b], r)
      ground.push({
        key: `g${a}.${b}`,
        name,
        facing: rotFace(facing, r),
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
      name,
      facing: rotFace(facing, r),
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
    const cells = []
    let top

    if (tier) {
      for (const [dx, dy, level, name, facing] of BUILDING_ART[def.id][tier - 1]) {
        const [ox, oy] = rotOffset([dx, dy], r)
        const a = anchor[0] + ox
        const b = anchor[1] + oy
        objects.push({
          key: `${def.id}.${objects.length}`,
          name,
          facing: rotFace(facing, r),
          a,
          b,
          level,
          i: objects.length,
          state: '',
          id: def.id,
        })
        if (!cells.some((c) => c[0] === a && c[1] === b)) cells.push([a, b])
      }
      top = Math.max(1.2, ...BUILDING_ART[def.id][tier - 1].map((p) => p[2]))
    } else {
      const [name, facing, ghostTop] = GHOST[status]
      objects.push({
        key: `${def.id}.ghost`,
        name,
        facing: rotFace(facing, r),
        a: anchor[0],
        b: anchor[1],
        level: 1,
        i: objects.length,
        state: status,
        id: def.id,
      })
      cells.push(anchor)
      top = ghostTop
    }

    buildings.push({
      id: def.id,
      tier,
      status,
      cells,
      top,
      label: labelCell(cells),
      labelLevel: Math.max(1, ...objects.filter((o) => o.id === def.id).map((o) => o.level)),
    })
  }

  ground.sort(byDepth)
  objects.sort(byDepth)
  return { ground, objects, buildings }
}

// every sprite file the map can ever ask for, in all four facings
export function allSpriteFiles() {
  const names = new Set(['grass_center', 'grass_river', 'grass_path', 'grass_pathCrossing'])
  for (const d of DECOR) names.add(d[2])
  for (const g of Object.values(GHOST)) names.add(g[0])
  for (const tiersOf of Object.values(BUILDING_ART)) {
    for (const tier of tiersOf) for (const p of tier) names.add(p[3])
  }
  return [...names].flatMap((n) => [...FACES].map((f) => spriteFile(n, f)))
}
