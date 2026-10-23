# Village Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Villagers (one per built building) and cube pets walk around the village map as animated sprites rendered from Kenney 3D models.

**Architecture:** The designer (`/Users/mateutek/work/www/math-village-designer`, three.js in headless Chromium) renders each actor's `walk`/`idle`/`eat` clips into looping animated WebP files, one per facing, and writes them to `math/public/village/actors/`. The game (`/Users/mateutek/work/www/math`, Vue 3) gets a pure cell-walking module (`src/data/villageLife.js`) and draws walkers as `<img>` elements inside the map's art layer. One `requestAnimationFrame` loop moves them by writing `transform` directly.

**Tech Stack:** three.js 0.186 + GLTFLoader + AnimationMixer, playwright, `img2webp` (libwebp, `/opt/homebrew/bin/img2webp`), Vue 3, plain `node:assert` checks.

**Spec:** `docs/superpowers/specs/2026-10-23-village-life-design.md` (in `math`)

## Global Constraints

- Node `^24.13.0` in both repos.
- No new dependency in `math`. The designer gets none either: three.js already ships `SkeletonUtils` and `AnimationMixer`.
- No em dash characters in code, comments, docs, commit messages or UI strings.
- Kenney packs are CC0. `public/kits` is gitignored in the designer, so kit files are never committed.
- **The designer has someone else's uncommitted work in progress** (`package.json`, `src/Editor.jsx`, `src/Viewport.jsx`, `src/models.js`, `src/renderViews.js`, `src/style.css`, `src/PieceColors.jsx`, `src/pieceColors*.js`, `designs/building_slot_t1.json`). Do not edit or commit any of those files. Only commit files this plan creates or names, always with explicit `git add <path>`. The new designer scripts run as `node scripts/...` and are documented in the README; wiring them into `package.json` waits until that work is committed.
- `math` work happens on branch `village-life`, cut from `main`. Designer commits go on its current branch (`build-designer`).
- Code style follows the file you are in: comment density, naming, terse JS, no semicolons in `math`.

## Review Focus

1. **Map rotated mid-walk:** a walker keeps its cell and keeps facing the way it walks. Task 4 check: `rotOffset(step, r)` equals the step `faceOf` names after `rotFace(faceOf(step), r)`, for all 4 steps and all 4 rotations.
2. **Building built while the map is open:** existing walkers keep their positions, and only the new ones fade in. Task 6 manual step.
3. **Tab hidden for minutes, then shown:** nobody teleports or walks off the road. Task 4 check: `tick` with `dt = 600` leaves the walker on an allowed cell. Task 6 clamps `dt` to 0.1 s.
4. **Zoom or resize mid-walk:** walkers stay glued to the ground. Task 6 places walkers from the same `px`/`py`/`u` the map uses, each frame.
5. **Bridge built or not yet:** without the bridge, nobody ever stands on (24, 16), and the tower and castle villagers start east of the river. With it, the river can be crossed. Task 4 checks both.

---

## Part A: designer (`/Users/mateutek/work/www/math-village-designer`)

### Task 1: Download the two packs and list the actors

**Files:**
- Modify: `scripts/kits.mjs` (the `KITS` map, line 8)
- Create: `src/actors.js`

**Interfaces:**
- Produces: `ACTORS` in `src/actors.js`, an array of
  `{ id: string, kit: 'characters' | 'pets', model: string, clips: string[], scale: number }`.
  `id` equals `model` (for example `'character-female-a'`, `'animal-cow'`).

- [ ] **Step 1:** Add `characters: 'mini-characters', pets: 'cube-pets'` to `KITS` in `scripts/kits.mjs`. Run `npm run kits`. Expected: `characters: 50 models` (or so) and `pets: 24 models` (or so). Both `public/kits/characters/models/Textures/colormap.png` and `public/kits/pets/models/Textures/colormap.png` exist.
- [ ] **Step 2:** Create `src/actors.js` with `ACTORS`:
  - all 12 of `character-female-a..f` and `character-male-a..f`, clips `['walk', 'idle']`;
  - `animal-dog`, `animal-cat`, `animal-fox`, `animal-bunny`, clips `['walk', 'idle']`;
  - `animal-cow`, clips `['walk', 'eat']`.

  Starting `scale` values: characters `0.6`, pets `0.22`, cow `0.26`. These are tuning knobs, finalised by eye in Task 7. For reference, Kenney's raw `character-male-a` is 0.67 units tall and a fantasy-town wall is 1.0, while the pet meshes are about 1.4 to 1.8 units raw. Put a one-line comment above the list saying sizes are tuned in the game, against a tier 1 hut.
- [ ] **Step 3:** Commit.
  ```bash
  git add scripts/kits.mjs src/actors.js
  git commit -m "Add Kenney Mini Characters and Cube Pets as actor kits"
  ```

### Task 2: Frame math (pure, tested)

**Files:**
- Create: `src/actorFrames.js`, `src/actorFrames.check.js`

**Interfaces:**
- Consumes: `alphaBounds` result shape `[x, y, w, h]` from `src/alphaBounds.js`.
- Produces:
  - `frameTimes(duration: number, fps: number): number[]`: sample times in seconds over exactly one loop. Gives `max(1, round(duration * fps))` frames at `i * duration / count`. The last frame is not equal to `duration`, so the loop does not stutter.
  - `unionBounds(list: ([x,y,w,h] | null)[]): [x,y,w,h] | null`: the box holding every non-null box, or null if all are null.
  - `FPS = 12`

- [ ] **Step 1:** Write `src/actorFrames.check.js` in the style of `alphaBounds.check.js`:
  ```js
  assert.deepEqual(frameTimes(1, 4), [0, 0.25, 0.5, 0.75])
  assert.deepEqual(frameTimes(0.01, 12), [0])
  assert.equal(frameTimes(0.75, 12).length, 9)
  assert.equal(unionBounds([null, null]), null)
  assert.deepEqual(unionBounds([[2, 3, 4, 5], null, [0, 6, 3, 1]]), [0, 3, 6, 5])
  console.log('actorFrames ok')
  ```
- [ ] **Step 2:** Run `node src/actorFrames.check.js`. Expected: fails, because the module does not exist.
- [ ] **Step 3:** Implement `src/actorFrames.js`.
- [ ] **Step 4:** Run `node src/actorFrames.check.js`. Expected: `actorFrames ok`.
- [ ] **Step 5:** Commit.
  ```bash
  git add src/actorFrames.js src/actorFrames.check.js
  git commit -m "Add frame sampling and union crop for animated actors"
  ```

### Task 3: Render actors to animated WebP

**Files:**
- Create: `src/renderActor.js`, `scripts/renderActors.mjs`
- Modify: `server/api.js` (new `POST /api/actor/<name>` route in `handle`), `server/api.check.js` (only if a new pure helper is exported), `src/main.jsx` (one line: `window.__exportActor = exportActor`), `src/api.js` (add `exportActor`), `README.md`, `docs/game-import.md`

**Interfaces:**
- Consumes: `ACTORS` (Task 1); `frameTimes`, `unionBounds`, `FPS` (Task 2); `alphaBounds`; `makeCamera`, `viewAngle`, `VIEWS` from `src/projection.js`; `LIGHT` from `src/renderViews.js` (import only, do not edit that file).
- Produces, written to `../math/public/village/actors/` (env `ACTOR_DIR` overrides):
  - `<id>_<clip>_<F>.webp` for every clip and `F` in `NESW`: an animated WebP that loops forever.
  - `<id>_<clip>_<F>.png`: the clip's first frame, for reduced motion.
  - `<id>.json`: `{ "id": "...", "clips": { "<clip>": { "fps": 12, "frames": n, "views": { "N": { "w", "h", "anchor": [x, y] }, "E": ..., "S": ..., "W": ... } } } }`
- Browser side: `exportActor(id): Promise<meta>` in `src/api.js`, which renders and then POSTs to `/api/actor/<id>`.

- [ ] **Step 1: Implement `renderActor(actor) -> { [clip]: { fps, frames, views: { [F]: { w, h, anchor, urls: string[] } } } }` in `src/renderActor.js`.**
  - Load `/kits/<kit>/models/<model>.glb` with its own `GLTFLoader` call, because `loadModel` drops `animations`. Zero out `metalness` the way `models.js` does. Use `SkeletonUtils.clone` from `three/addons/utils/SkeletonUtils.js` if you clone.
  - Use the same scene, lights (`LIGHT`), camera (`makeCamera`) and renderer settings as `renderViews.js`. The camera never moves; the model turns with `rotation.y = viewAngle(k)` for facing `VIEWS[k]`.
  - Canvas size: render every frame of every facing of the clip into one fixed square canvas, big enough to hold the scaled model plus `PAD`, with the world origin at its centre. Size it from a `Box3` of the posed model across all sampled frames, not the bind pose.
  - Per clip: sample `frameTimes(clip.duration, FPS)` with `mixer.setTime(t)`. Render each facing and keep the `alphaBounds` per frame. Then crop every frame of that clip+facing to `unionBounds` of that clip+facing's frames.
  - `anchor = [w/2 - x, h/2 - y]` against the union crop, exactly like `renderViews`.
  - Return each frame as a PNG data URL.
- [ ] **Step 2: Add the `/api/actor/<name>` POST route in `server/api.js`.**
  - Body: `{ meta, clips: { [clip]: { [F]: string[] } } }`, where each string is a PNG data URL. Validate the way `export` does: `safeName` on the name and each clip name, `F` in `NESW`, every string starts with `PNG`.
  - Write the frames to a fresh `mkdtempSync` folder. For each clip+facing, run:
    `execFileSync('img2webp', ['-loop', '0', '-lossy', '-q', '90', '-m', '6', '-d', String(Math.round(1000 / fps)), ...frames, '-o', out])`.
    Use the `execFileSync` argument array, never a shell string.
  - Copy frame 0 to `<id>_<clip>_<F>.png`, write `<id>.json`, and remove the temp folder.
- [ ] **Step 3:** Add `exportActor` in `src/api.js` and `window.__exportActor` in `src/main.jsx`. Write `scripts/renderActors.mjs` as a copy of `render.mjs`'s shape that loops over `ACTORS` (or over ids given as args), calling `window.__exportActor`. It prints `<id>: walk NxM, idle NxM` and exits 1 on any failure.
- [ ] **Step 4:** Run `node scripts/renderActors.mjs character-male-a animal-cow`. Expected: two lines with sizes and no `FAILED`. `../math/public/village/actors/` now holds 16 webp files, 16 png files and 2 json files.
- [ ] **Step 5: Check facing and loop by eye.** Open `character-male-a_walk_N.webp` and `_E.webp` in a browser. The `N` file must walk toward screen lower-right, which is map `+b`, and `E` toward screen lower-left, which is map `-a`. This is the convention Task 4 relies on.
  - If the model's forward is not `+z`, add one constant `FORWARD_TURNS` in `renderActor.js` and add it to `k` before `viewAngle`. Do not change the game's convention.
  - The loop must not hitch, and the edges must show no dark fringe. If they do, switch to `-lossless`.
- [ ] **Step 6:** Document it.
  - `README.md`: a "Actors" section with `node scripts/kits.mjs` (already `npm run kits`), `node scripts/renderActors.mjs [id...]` and `node src/actorFrames.check.js`.
  - `docs/game-import.md`: a section with the file names, the JSON shape, the facing convention (+b N, -a E, -b S, +a W, then `rotFace(F, r)` at map rotation r), and the anchor meaning (the ground point under the feet).
- [ ] **Step 7:** Commit only these files.
  ```bash
  git add src/renderActor.js scripts/renderActors.mjs server/api.js src/main.jsx src/api.js README.md docs/game-import.md
  git commit -m "Render animated actors to looping WebP sprites"
  ```
  Before committing, `git diff --cached --stat` must list only those paths.

## Part B: game (`/Users/mateutek/work/www/math`)

Start: `git switch -c village-life` from `main`.

### Task 4: Who walks where (pure logic + check)

**Files:**
- Create: `src/data/villageLife.js`, `src/data/villageLife.check.js`
- Modify: `src/data/villageMap.js`: add `export` to `PLOT_CELLS`, `nearPlot`, `DECOR_CELLS` (lines 211, 214, 236); no other change. `package.json`: append `&& node src/data/villageLife.check.js` to `check`.

**Interfaces:**
- Consumes: `groundAt`, `PATH_COL`, `PATH_ROW`, `RIVER_COL`, `PLOTS`, `PROJ`, `cellsOf`, `PLOT_CELLS`, `nearPlot`, `DECOR_CELLS` from `villageMap.js`; `BUILDINGS` from `buildings.js`.
- Produces:
  - `CAST: { [buildingId]: actorId }`, mapping all 12 buildings to the 12 characters one to one, with women and men mixed across the town.
  - `PETS: { id, actor, after: buildingId | null, ground }[]`: dog after `hut`, cat after `bakery`, cow after `farm` (ground `'pasture'`), fox and bunny with `after: null` (ground `'wood'`). Dog and cat use ground `'road'`.
  - `cast(tiers) -> Walker[]`, where `Walker = { id, actor, ground: 'road' | 'pasture' | 'wood', home: [a, b] | null, speed, rest: 'idle' | 'eat' }`.
    - One villager per building with `tiers[id] >= 1`: id is the building id, `home` is `PLOTS[id]`, speed `0.8`.
    - Pets whose `after` is built (or null): speed `0.5`, `rest` is `'eat'` for the cow and `'idle'` otherwise.
  - `canStand(ground, a, b, tiers) -> boolean`:
    - `road`: `groundAt` is `grass_path` or `grass_pathCrossing`, or the cell is `(RIVER_COL, PATH_ROW)` and `tiers.bridge >= 1`.
    - `pasture`: `grass_center`, within Chebyshev distance 3 of a cell of the farm's current tier (`cellsOf('farm', tiers.farm)` offset by `PLOTS.farm`), and not in `PLOT_CELLS`.
    - `wood`: `grass_center`, `min(a, b, GRID-1-a, GRID-1-b) < 5`, not in `DECOR_CELLS`, not `nearPlot`, and not within 1 cell of `PATH_COL`, `PATH_ROW` or `RIVER_COL`.
    - Outside the grid: false.
  - `moves(ground, [a, b], tiers) -> [a, b][]`: the 4-neighbours where `canStand` is true.
  - `faceOf([dx, dy]) -> 'N' | 'E' | 'S' | 'W'`: `[0,1]` gives N, `[-1,0]` E, `[0,-1]` S, `[1,0]` W.
  - `spawn(walker, tiers, rand) -> State`, where `State = { a, b, from: [a,b], to: [a,b] | null, t, face, clip: 'walk' | rest, wait }`.
    - Road walkers start on the road cell nearest `home`, measured by Manhattan distance. Ties break by lowest `a`, then `b`. They then move a seeded number of cells (0 to 3) along the road, so they don't pile up.
    - Wood and pasture walkers start on a seeded allowed cell.
    - If there is no allowed cell, return `null`.
  - `tick(state, walker, tiers, dt, rand) -> State`, mutating and returning `state`.
    - While `wait > 0`, count it down with `clip = walker.rest`.
    - Otherwise move toward `to` at `walker.speed` cells/s, with `clip = 'walk'` and `face = faceOf(to - from)`.
    - On arrival, pick the next cell from `moves`. Prefer "straight on" (weight 3 against 1 for each turn). Go back only when it is the only move.
    - On arrival, start a rest with probability `0.05` for villagers and `0.3` for pets, lasting `1 + rand() * 3` s.
    - If the current target is no longer allowed (because tiers changed), stop and re-pick from `moves`.
    - A large `dt` is processed in steps of at most 0.1 s, so the walker never skips past a decision point.
  - `rand` is any `() => number` in [0, 1); the check passes a seeded one.

- [ ] **Step 1: Write `src/data/villageLife.check.js`** in the style of `villageMap.check.js`, with a small seeded `rand` (for example mulberry32). Assertions:
  ```js
  // facings agree with the map's own turn, at every rotation
  for (const step of [[0, 1], [-1, 0], [0, -1], [1, 0]])
    for (let r = 0; r < 4; r++)
      assert.deepEqual(rotOffset([0, 1], 'NESW'.indexOf(rotFace(faceOf(step), r))), rotOffset(step, r))

  // cast size: empty village has only the wood animals; full village has 12 villagers + 5 pets
  assert.deepEqual(cast({}).map((w) => w.id).sort(), ['bunny', 'fox'])
  assert.equal(cast(full).length, 12 + 5)            // full = every building at tier 1
  assert.equal(new Set(Object.values(CAST)).size, 12)

  // 2000 seconds of simulated walking, dt 1/30, for every walker in `full` and in `noBridge`
  //   - every state.a/b and every state.to is a cell where canStand(walker.ground, ...) is true
  //   - noBridge (full minus bridge): nobody ever stands on (RIVER_COL, PATH_ROW)
  //   - full: at least one road walker is seen on both sides of the river
  // the tower villager without a bridge spawns with a > RIVER_COL
  // tick(state, w, tiers, 600, rand) leaves the walker on an allowed cell
  // cow: every cell visited is within Chebyshev 3 of a farm cell and never in PLOT_CELLS
  // fox: every cell visited has min(a, b, 31-a, 31-b) < 5 and is not in DECOR_CELLS
  ```
- [ ] **Step 2:** Run `node src/data/villageLife.check.js`. Expected: fails, because the module does not exist.
- [ ] **Step 3:** Implement `src/data/villageLife.js` and add the exports to `villageMap.js`.
- [ ] **Step 4:** Run `npm run check`. Expected: every check passes, including the new one (`villageLife ok`).
- [ ] **Step 5:** Commit.
  ```bash
  git add src/data/villageLife.js src/data/villageLife.check.js src/data/villageMap.js package.json
  git commit -m "Work out who walks where in the village"
  ```

### Task 5: Actor manifest

**Files:**
- Modify: `scripts/villageSprites.mjs`
- Create (generated, committed): `src/data/villageActors.json`; `public/village/actors/*` from Task 3

**Interfaces:**
- Produces: `src/data/villageActors.json`: `{ "<actorId>": { "<clip>": { "N": [w, h, ax, ay], "E": ..., "S": ..., "W": ... } } }`. This uses the same `[w, h, anchorX, anchorY]` row shape as `villageSprites.json`.

- [ ] **Step 1:** Run `node scripts/renderActors.mjs` in the designer (all 17 actors). Expected: 17 lines, no `FAILED`.
- [ ] **Step 2:** Extend `scripts/villageSprites.mjs` so it also folds `public/village/actors/*.json` into `src/data/villageActors.json`. Print `villageActors.json: 17 actors`. A missing folder writes `{}`.
- [ ] **Step 3:** Run `npm run sprites` then `npm run check`. Expected: both pass. Run `du -sh public/village/actors`; expected a few MB at most. If it's over 5 MB, lower `-q` or `FPS` in the designer and re-render.
- [ ] **Step 4:** Commit.
  ```bash
  git add scripts/villageSprites.mjs src/data/villageActors.json public/village/actors
  git commit -m "Add the rendered villager and pet sprites"
  ```

### Task 6: Draw and move the walkers on the map

**Files:**
- Create: `src/components/VillageLife.vue`
- Modify: `src/components/VillageMap.vue` (objects get a `zIndex`; mount `<VillageLife>` inside `.kid-map-art` after the object `<img>`s), `src/assets/design/kid.css` (`.kid-map-art { isolation: isolate }`, `.kid-map-art img.walker { will-change: transform; left: 0; top: 0 }`, a `kid-walker-in` fade keyframe for `.born`, and `.kid-map-art img.walker.born { animation: none }` in the reduced-motion block)

**Interfaces:**
- Consumes: `cast`, `spawn`, `tick` (Task 4); `villageActors.json` (Task 5); `rotCell`, `rotFace`, `cellX`, `cellY`, `GROUND_DY`, `SCALE`, `RIVER_COL`, `PATH_ROW` from `villageMap.js`.
- `VillageLife.vue` props: `rotation: number`, `tiers: object`, `depths: number[]` (the sorted `a + b` of every object, ascending, after rotation), `place: (x: number, y: number) => [number, number]` (map units to world px, that is `[px(x), py(y)]`), `u: number`, `url: (file) => string`.

- [ ] **Step 1: Depth, in `VillageMap.vue`.**
  - Each object gets `zIndex = 2 * (index + 1)` in its style, from its index in the already-sorted `objects`.
  - Pass `depths = items.objects.map((o) => o.a + o.b)` to `VillageLife`.
  - A walker at rotated position `(ra, rb)` gets `zIndex = 2 * k + 1`, where `k` is the number of `depths <= Math.round(ra + rb)`. Use a binary search.
  - On the bridge cell, when the bridge is built, the walker sits above the bridge sprite: count the bridge object as `<=`.
  - Add `isolation: isolate` on `.kid-map-art`, so walker and object z-indexes never climb over labels, hits or the pin.
- [ ] **Step 2: Walker set, in `VillageLife.vue`.**
  - `walkers = computed(() => cast(tiers))`. Keep a plain `Map<id, State>` (not reactive).
  - When `walkers` changes, add states for new ids via `spawn`, using `Math.random`, and drop states for ids that are gone. Existing states are untouched.
  - Ids added after the first mount get the `born` class.
  - Render one `<img class="walker">` per walker, with a template ref keyed by id.
- [ ] **Step 3: The loop.**
  - One `requestAnimationFrame` loop, started in `onMounted` and cancelled in `onUnmounted`.
  - `dt = min((now - last) / 1000, 0.1)`. For each state, call `tick`, then write directly to the `<img>`:
    - Interpolate `(a, b)` between `from` and `to` by `t`.
    - `[ra, rb] = rotCell([a, b], rotation)`. `rotCell` works on fractional cells.
    - The facing is `F = rotFace(state.face, rotation)`. The view is `villageActors[actor][clip][F] = [w, h, ax, ay]`.
    - Map-unit box: `x = cellX(ra, rb) - ax * SCALE`, `y = cellY(ra, rb) + GROUND_DY - ay * SCALE - lift`. `lift` is the bridge deck height for the current bridge tier when standing on `(RIVER_COL, PATH_ROW)`, else 0. `BRIDGE_DECK = { 1: ?, 2: ?, 3: ? }` in map units, measured by eye in Task 7, starting at `{ 1: 2, 2: 3, 3: 5 }`.
    - Write the style: `transform = translate(${place(x, y)}px)`, `width = w * SCALE * u`, `height = h * SCALE * u`, and `zIndex` from Step 1.
    - Change `src` to `url('actors/' + actor + '_' + clip + '_' + F + '.webp')` only when it differs from the last value written.
- [ ] **Step 4: Reduced motion.** If `matchMedia('(prefers-reduced-motion: reduce)').matches`, skip the loop entirely. Draw each walker once at its spawn spot with the `.png` still. Redraw on rotation, zoom or tier changes, using a `watch` on `[rotation, u, tiers]`.
- [ ] **Step 5: Mount it in `VillageMap.vue`.** Pass `:place="(x, y) => [px(x), py(y)]"` and `:u="u"`. Run `npm run check`, `npm run lint` and `npm run build`. Expected: all pass.
- [ ] **Step 6: Manual check in the browser** (`npm run dev`, village page, use the `run` skill or claude-in-chrome). Expected:
  - Villagers walk the roads and the cow grazes by the farm. Fox and bunny stay in the wood.
  - Walkers are hidden behind buildings and trees in front of them, and drawn over the ones behind.
  - Rotate four times: everyone stays on the roads and faces the way they walk.
  - Zoom in and out, and resize the window: walkers stay on the ground.
  - Tapping a building still selects it, and dragging still pans.
  - Build a building from the dev panel: its villager fades in by it, and nobody else jumps.
  - Without the bridge, nobody is on the river. With it, villagers cross over the deck, not under it.
  - Hide the tab for a minute and come back: nobody teleported.
  - With the OS reduced-motion setting on: still figures, no loop.
- [ ] **Step 7:** Commit.
  ```bash
  git add src/components/VillageLife.vue src/components/VillageMap.vue src/assets/design/kid.css
  git commit -m "Let villagers and pets walk around the village"
  ```

### Task 7: Tune by eye and finish

**Files:** `src/actors.js` (designer, `scale`), `src/components/VillageLife.vue` (`BRIDGE_DECK`), and the re-rendered `public/village/actors`.

- [ ] **Step 1:** Next to a tier 1 hut, a villager reads at a third to half of the hut's height. Dog and cat come to a villager's knee to hip, and the cow is a bit taller than the dog. Adjust `scale` in the designer's `src/actors.js`, then re-run `node scripts/renderActors.mjs` and `npm run sprites`.
- [ ] **Step 2:** Adjust `BRIDGE_DECK` so feet sit on the deck of each bridge tier. Use the dev panel to switch tiers.
- [ ] **Step 3:** Run `npm run check`, `npm run lint` and `npm run build`. Expected: all pass. Then commit: in the designer, `git add src/actors.js` with the message "Tune actor sizes against the hut". In math, `git add public/village/actors src/data/villageActors.json src/components/VillageLife.vue` with the message "Tune walker sizes and the bridge deck".
- [ ] **Step 4:** Finish with superpowers:finishing-a-development-branch. Per the user's standing preference, reviewed work is pushed and `main` is fast-forwarded.
