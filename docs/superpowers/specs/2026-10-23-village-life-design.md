# Village life: villagers and pets that walk around

## Why

The village is a still picture. Nothing moves, so it feels dead. Building
something should make the place feel more alive, not just add one more still
sprite. People walking the roads and a few animals give that, and later they
are the obvious hook for quests (a villager who introduces a topic, daily
quests). Quests are NOT part of this work.

## Goals

- Villagers walk along the village roads.
- More buildings mean more villagers: one villager per building that is built.
- A few cube pets: a dog and a cat on the roads, a cow grazing by the farm, a
  fox in the wood at the edge of the map.
- They look like they belong: same low-poly style, same camera, same lighting as
  the building sprites.

## Non-goals (for now)

- No tapping or talking to villagers or animals. They ignore the pointer.
- No daily routines, no entering buildings, no paths to doors.
- No quests. Each walker does keep a stable id (the building it belongs to, or
  the pet name) so quests can hang off it later.
- No wheelchair users in v1, although the pack supports them (separate
  `wheelchair` models plus `wheelchair-move-*` clips). A good follow-up.

## Anti-goals (would be a failure even if it works)

- Walkers that block taps or drags on the map, or on buildings.
- Walkers drawn on top of a building they are walking behind, or vice versa.
- Stutter on an older tablet or phone, or battery drain while the tab is hidden.
- Flat 2D figures that look pasted onto the 3D-rendered town.

## Assets

Two Kenney packs, both CC0, both checked on 2026-10-23:

- **Mini Characters** (`https://kenney.nl/assets/mini-characters`): 12 people,
  `character-female-a..f` and `character-male-a..f`. The clips include `idle`
  and `walk`.
- **Cube Pets** (`https://kenney.nl/assets/cube-pets`): `animal-dog`,
  `animal-cat`, `animal-fox`, `animal-cow` and others. The clips include `idle`,
  `walk` and `eat`.

Both zips have a `Models/GLB format/` folder and `Previews/`. The designer's
`scripts/kits.mjs` already handles that layout, so the packs are two more
entries in its `KITS` map (`characters: 'mini-characters'`, `pets: 'cube-pets'`).

## Part 1: the designer renders animated sprites (`../math-village-designer`)

The designer renders still buildings today: three.js in headless Chromium
(`npm run render`, `src/renderViews.js`, `src/projection.js`), writing PNGs +
JSON into `../math/public/village/buildings/`. This adds animated actors.

**Output format: animated WebP.** It loops on its own as a plain `<img>`, and
unlike GIF it has real alpha, so the soft edges match the PNG sprites.
`img2webp` (libwebp) is installed at `/opt/homebrew/bin/img2webp` and turns the
frames into one file. The exact flags are the builder's call; settle on lossless
or a high quality that shows no fringing on the grass.

**What gets rendered.** For each actor, each clip it needs, and each of the four
facings:

| actor | clips |
|---|---|
| 12 characters | `walk`, `idle` |
| dog, cat | `walk`, `idle` |
| cow | `walk`, `eat` |
| fox, bunny | `walk`, `idle` |

**Facings use the building convention.** The camera never moves. Rendering the
model turned by `viewAngle(k)` gives facing `'NESW'[k]`, exactly like a
building view. In the game, a walker heading along map direction `d` at map
rotation `r` draws facing `rotFace(d, r)`. That way map rotation needs no special
code: it is the same stepping buildings already use. The builder decides which
model heading counts as `N` and writes it down in `docs/game-import.md`.

**Frames.**
- Sample the clip at a fixed rate over exactly one loop. 12 fps is the starting
  value; it is a tuning knob.
- All frames of one actor+clip+facing share ONE canvas: crop to the union of
  every frame's alpha bounds, never per frame, or the figure jitters.
- The anchor is the point under the feet (the world origin), computed from the
  projection as `renderViews` already does, never read back from pixels.

**Size.** A villager should read as a small person next to a tier 1 hut,
roughly a third to half of its height. A cat or dog is knee to hip height of a
villager, and a cow is a bit taller than a dog. The per-kit `scale` in
`src/kits.js` is the knob. Measure the kits with `scripts/measure.mjs` as the
file comments describe, then tune by eye in the game.

**Files** go to `../math/public/village/actors/` (a new folder next to
`buildings/`):

```
character-female-a_walk_N.webp ... _W.webp
character-female-a.json  { id, clips: { walk: { fps, frames, views: { N: { w, h, anchor }, ... } }, idle: { ... } } }
```

Plus one still PNG per actor and facing (the first `idle` frame, or the cow's
first `eat` frame) for reduced motion. See Part 2.

How this hooks into the CLI is up to the builder: a new `npm run render-actors`,
or an actor list that `npm run render` also walks. Keep the editor UI untouched;
actors are not designed by hand.

`npm run check` in the designer gets one check for anything new and pure, for
example the union crop or the facing mapping.

## Part 2: the game moves them (`math`)

**Manifest.** Fold `public/village/actors/*.json` into the app the same way
`scripts/villageSprites.mjs` folds the building JSON into
`src/data/villageSprites.json`. Extend that script or add a sibling one; either
is fine.

**Who is on the map.**
- One villager per building whose tier is 1 or more. Each building owns one
  fixed character, so the hut's villager looks the same on every visit. That is
  12 buildings and 12 characters, one each. The pairing is the builder's call;
  mix women and men across the town.
- Dog: appears once the **hut** is built. Cat: once the **bakery** is built.
  Cow: once the **farm** is built. Fox: always there, because the wood always
  is. (These pairings are the designer's call, easy to change.)
- When a building gets built while the map is open, its villager (and pet, if it
  has one) appears on the road cell nearest that building with a short fade-in.
  On page load, everyone starts at a spread-out, seeded spot on their own
  ground.

**Where they walk.** The roads today are column `PATH_COL` (12) and row
`PATH_ROW` (16) across the whole `GRID` (32), crossing at (12, 16). The river is
column `RIVER_COL` (24), and the bridge plot sits at (24, 16).

- Villagers, the dog and the cat move cell to cell along road cells only.
- At the crossing they pick a direction at random, with "straight on" weighted
  a bit higher.
- At the edge of the map they turn around.
- They never step onto the river column unless the **bridge** is built. A
  villager whose building is east of the river (tower, castle) starts on the
  east stretch of road. Before the bridge exists, that stretch is all they
  have.
- Now and then a walker stops for a few seconds and plays `idle` (pets: often,
  villagers: rarely), then walks on.
- Pets walk slower than villagers. Starting speeds are about 0.8 cells/s for a
  villager and 0.5 for a pet; both are tuning knobs.
- Two walkers may overlap on the same cell. No collision avoidance.
- Cow: wanders the open grass within about 2-3 cells of the farm plot. It never
  stands on the farm's own cells or the road, and plays `eat` when it stops.
- Fox: wanders between grass cells in the wood around the rim, the area where
  `DECOR` places trees. It never goes onto a road, the river, or near a plot.
- If a pet's region is empty after a rotation or a layout change, it simply
  does not show. It never errors.

All of this is plain logic over cells, written so it can be tested without a
browser. It goes in `src/data/` or `src/store/`, next to the other village
logic.

**Drawing.**
- Each walker is an `<img>` of the right `<actor>_<clip>_<facing>.webp`,
  positioned with the same projection as everything else (`cellX`, `cellY`,
  `SCALE`, its anchor), at fractional cell coordinates while it moves between
  cells.
- Depth must match the painter's order the map already uses (`byDepth`: `a + b`
  after rotation). A walker behind a building or tree is covered by it, and one
  in front covers it. How this is done (z-index from depth rank, or merging
  walkers into the sorted object list) is the builder's call, but it must not
  rebuild the whole object list every frame.
- Walkers rotate with the map: positions go through `rotCell`, facings through
  `rotFace`.
- `pointer-events: none` on every walker, so panning, zooming, and tapping
  buildings behave exactly as today.

**The loop.**
- One `requestAnimationFrame` loop drives every walker while the map is
  mounted. It stops on unmount.
- `rAF` already pauses in a hidden tab. After a long pause, clamp the time step
  so nobody teleports.
- Per-frame updates touch only the walkers' style (a `transform`), not reactive
  state that makes Vue re-render the map.
- `prefers-reduced-motion: reduce`: walkers stand still at their start spots
  and show the still PNG, not the animated WebP.
- Night mode: no change; they keep walking.

**Checks.** One new `*.check.js` in the style of the existing ones, added to
`npm run check`. It must prove:

- a road walker never stands on a non-road cell;
- nobody steps onto the river column while the bridge is unbuilt, and they can
  cross once it is built;
- the cow stays within its pasture and the fox stays in the wood;
- the walker count equals the number of built buildings, plus the pets.

## Constraints

- Both repos run Node `^24.13.0`.
- The designer already depends on three.js and playwright. Do not add a
  dependency to `math` for this; plain DOM plus the existing projection is
  enough.
- Total size of `public/village/actors/` should stay modest, a few MB at most.
  It ships to kids' tablets.
- The kid-facing village never shows answers (unrelated here, but it holds).
- No em dash characters in code, comments, docs or UI strings.

## Calls made after review (the designer's, the user delegated them)

- **Bridge cell.** On (24, 16), walkers draw above the bridge sprite and are
  lifted by the deck height of the current bridge tier, measured from that
  tier's model. Otherwise they look like they're wading.
- **Per-model scale.** If measuring shows that dog and cow (same kit) come out
  the same size, add a per-model scale override next to the kit `scale`.
- **Cow pasture.** The cow stays off EVERY plot's cells, not just the farm's.
  The library at (8, 19) is close to the farm.
- **Fox.** Stays inside the rim band where `DECOR` grows trees, on grass cells
  that hold no tree.
- **Four directions only.** Every walker, cow and fox included, steps to one
  of the 4 neighbouring cells, never diagonally, because there are only four
  facings.
- **Zoom.** The map zooms by recomputing pixel positions (`px`/`py` with `u`),
  so each walker's per-frame `transform` uses the current zoom.
- **Bunny.** A bunny (`animal-bunny`, `walk` + `idle`) joins the fox in the
  wood from the start, with the same rules as the fox. It costs one more
  actor.
- Confirmed: `VillageMap` is used only by `src/pages/Village.vue`, and there is
  no service worker or precache list to update.

## Left to the builder

- `img2webp` flags, exact fps, frame counts.
- How actor rendering plugs into the designer's CLI.
- The building-to-character pairing.
- How depth sorting is wired into `VillageMap.vue`.
- Exact speeds, idle frequency, fade-in.
