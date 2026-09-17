# Math Village - design spec

Date: 2026-09-17
Branch: `feat/math-village` (branched from `fix/reset-score-on-level`)

## Goal

Add six new game types inspired by the exercise mechanics on matzoo.pl, a
village-building reward loop stored only in localStorage, and a navigation
redesign that scales past the current five operation chips. No ads, no
accounts, no backend.

## Constraints

- All code, art and text are original. Only the game mechanics (matching
  tiles, picking a domino, ordering numbers) are taken as ideas. No matzoo
  images, texts or scripts are used.
- Persistence is localStorage only, plus a copyable export string.
- No new dependencies. Vue 3, vue-router, @vueuse/core, reka-ui and
  lucide-vue-next are already installed and cover everything here.
- Existing URLs (`/dodawanie/1` etc.) keep working.
- PL and EN strings for everything user-visible.
- Never use the em dash character in code, comments, docs or UI strings.

## Out of scope

Word problems, calendar and temperature quizzes, zerowka colours and shapes,
klasa 4-8 topics, comments, accounts, sounds, avatars, multiple save slots,
onboarding screens, villagers or any game loop, free building placement,
refactoring the five existing operation pages.

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/store/village.js` | Reactive store, same pattern as `store/settings.js`. Holds `materials`, `buildings`, `streak`. Persists to one `village` localStorage key via `watch`. Exposes `reward(kind, level)`, `build(id)`, `exportSave()`, `importSave(str)`, `reset()`. |
| `src/data/buildings.js` | Static list of 12 buildings: id, plot tile, cost per tier, unlock order. |
| `src/composables/useRound.js` | Shared round state for the new games: score, tasksTotal, streak, strikes, flash colour. Calls `village.reward()` on a correct answer and awards coins. |
| `src/pages/Village.vue` | Isometric map, next-goal panel, Build button. |
| `src/components/IsoTile.vue` | One SVG ground tile. |
| `src/components/IsoBuilding.vue` | One SVG building, drawn from id and tier. |
| `src/components/SettingsSheet.vue` | Language, timer, export, import, reset. |
| `src/pages/Play.vue` | Game grid grouped by category. |
| `src/pages/games/Tiles.vue` | Kafelki. |
| `src/pages/games/Domino.vue` | Domino. |
| `src/pages/games/Compare.vue` | Porownaj. |
| `src/pages/games/Biggest.vue` | Najwieksza. |
| `src/pages/games/Ascending.vue` | Rosnaco. |
| `src/pages/games/Missing.vue` | Brakujaca. |
| `src/store/village.check.js` | Plain Node self-check for the store logic. |

### Changes to existing files

- The five operation pages: one line each, `village.reward(kind, level)` in
  the success branch of `checkAnswer`. Addition and Subtraction pay wood,
  Multiply, Divide and Divide_2 pay stone.
- `App.vue`: chip row removed. Header gains material counters and a settings
  button. Two-tab navigation added.
- `router/index.js`: `/` renders the village instead of redirecting. New
  routes `/graj` and `/gry/<name>/:level?`.
- `i18n.js`: strings for games, buildings, materials, settings.
- `assets/design/kid.css`: tab bar, game grid, iso map, counters.

### Store logic must be testable without Vue

`village.js` keeps the pure parts (validate, applyReward, applyBuild, encode,
decode) as plain exported functions that take and return state objects. The
reactive wrapper and the localStorage `watch` sit on top. The Node check
imports only the pure functions.

## Data model

```js
{
  v: 1,
  materials: { wood: 0, stone: 0, food: 0, coins: 0 },
  buildings: [{ id: 'hut', tier: 1 }],
  bestStreak: { tiles: 0, domino: 0 /* per game key */ },
  lastPlayed: '2026-09-17',
  dayStreak: 0
}
```

Plot tiles live in `buildings.js`, not in the save. When free placement is
added later, a `tile` field is added to each saved building and `v` is bumped.

### Validation

One `validate(raw)` function guards both the localStorage load and the import
path. It checks: `v === 1`, the four known material keys hold non-negative
integers, every building id exists in `buildings.js`, tiers are within range,
no duplicate ids. Anything else returns `null`.

- localStorage load: `null` means start a fresh village. Never throws.
- Import: `null` means show an error and leave the current village untouched.

### Export and import

- Export: `btoa(JSON.stringify(state))`. State is ASCII only, so plain `btoa`
  is safe.
- Import: `atob` then `JSON.parse` inside try/catch, then `validate`. A valid
  save asks for confirmation before replacing the current village.
- Not signed or encrypted. A checksum can be added if cheating ever matters.

## Rewards

- A correct answer pays `level` units (1, 2 or 3) of the game's material.
- A wrong answer costs nothing.
- Every 5-answer streak pays 1 coin. A flawless Tiles round, or 10 correct in
  a row in any other game, pays 3 coins.
- `dayStreak` increments when `lastPlayed` was yesterday, resets when older.

| Source | Material |
|---|---|
| Addition, Subtraction, Domino | wood |
| Multiply, Divide, Divide_2 | stone |
| Tiles, Missing | wood for + and -, stone for x and / |
| Compare, Biggest, Ascending | food |

## Games

All six have 3 levels, a status row, level pills and the back arrow, matching
the existing card layout. All use `useRound`.

| Game | Interaction | Levels |
|---|---|---|
| Tiles | 6 operation tiles and 6 result tiles. Tap one of each to pair them. Round ends when all are matched. Results within a round are unique so every pair is unambiguous. | L1 + and -, L2 adds x, L3 adds / |
| Domino | Shows `3 + 4`. Pick 1 of 4 dominoes, dots drawn in CSS. Exactly one domino is correct; distractors have different totals. | Sum up to 6, 9, 12 |
| Compare | Two sides, tap `<`, `=` or `>`. | Number vs number, number vs expression, expression vs expression |
| Biggest | 4 to 6 distinct numbers. Tap the biggest or the smallest, the prompt says which. | Up to 50, 200, 1000 |
| Ascending | 5 distinct shuffled numbers. Tap them in ascending order. A wrong tap is a strike and does not advance. | Up to 50, 200, 1000 |
| Missing | `7 + ? = 12`, typed answer. Reuses the current input UI. All four operations; division only with whole results. | Existing operation ranges |

Three strikes reveal the answer and move on, as the current pages do. The
timer setting applies to the single-question games and is ignored by Tiles.

## Village

- 6x6 isometric diamond drawn in one SVG. Grid to screen:
  `x = (col - row) * w/2`, `y = (col + row) * h/2`. Tiles are drawn back to
  front so buildings overlap correctly.
- Ground: grass, a path, a pond. Decorative only.
- Buildings: original flat-shaded SVG, box plus roof from three polygons, in
  the `kid.css` palette. Tier changes scale and adds details (chimney,
  windows, flag), so 12 buildings with 3 tiers do not need 36 drawings.
- Unbuilt plots show a ghost outline. Only the next plot in order is
  highlighted.
- Built tiles get a small CSS idle animation (smoke, flag), disabled under
  `prefers-reduced-motion`.

### Buildings and cost

Order: hut, well, farm, bakery, school, mill, market, library, tower, bridge,
town hall, castle.

- Hut tier 1 costs 5 wood, so the first build lands within about two minutes.
- Costs rise roughly 1.4x per building and mix materials from the third
  building on, so every game category is needed.
- Tiers 2 and 3 cost coins plus materials.
- Castle tier 1 is about 150 mixed materials plus 20 coins.
- Target pacing: a full tier-1 village in 3 to 4 weeks at 10 minutes a day.
- Every number lives in `buildings.js` for retuning after real play.

### Building flow

Next-goal panel shows the building name, one progress bar per required
material, and a Build button that is disabled until affordable. Build deducts
the cost, adds the building, fires `Celebration`, and moves the highlight to
the next plot. Upgrades are offered from a tap on a built building.

## Navigation

### Header

`[logo] [wood] [stone] [food] [coins] [settings]`

- Counters animate with `AnimatedInteger`. Under 380px the labels drop and
  icons stay. Each counter has an `aria-label` such as "Wood: 24". Tapping
  the counters goes to the village.
- The language switch and timer toggle move into `SettingsSheet`, together
  with export (string plus Copy via `useClipboard`), import (paste field plus
  Load) and Reset village (with confirm).

### Tabs

Two tabs: Village and Play. Fixed bottom bar on mobile, two pills under the
header at 768px and up. The Village tab shows a pulsing dot when the next
building is affordable.

### `/` village

Map plus next-goal panel. Empty state: one ghost hut and one line, "Solve
tasks to collect wood", with a Play button.

### `/graj` game grid

Three groups, each heading showing what it pays:

- Dzialania (wood, stone): the five existing pages plus Missing.
- Gry (wood, stone): Tiles, Domino.
- Liczby (food): Compare, Biggest, Ascending.

Card: symbol, name, operation colour from the existing `--k-op-*` tokens,
best streak. Two columns on mobile, four on desktop. A group whose material
the next building still needs gets a small "needed" badge.

### Game view

Unchanged apart from a back arrow to `/graj` in the card's top-left corner.

### Accessibility

Tabs and cards are real links. Tap targets are at least 44px. Animations
respect `prefers-reduced-motion`.

## Error handling

- Corrupt or missing localStorage: fresh village, no crash.
- localStorage unavailable or full: writes are wrapped in try/catch, the
  session keeps working in memory.
- Invalid import string: inline error, state untouched.
- Unknown route: redirect to `/`.

## Testing

`node src/store/village.check.js`, plain `assert`, no framework:

1. `applyReward` adds `level` units of the right material.
2. `applyBuild` deducts cost and adds the building.
3. `applyBuild` refuses when short and leaves state unchanged.
4. `applyBuild` refuses a building that is out of unlock order.
5. `decode(encode(state))` deep-equals `state`.
6. `decode` of garbage, of valid base64 with wrong shape, and of negative
   materials all return `null`.

Game generators get one check each where logic can silently break: Tiles
results are unique within a round, Domino has exactly one correct option,
Missing division is always whole.

Manual pass in the browser at 360px and 1280px: play each game, earn, build,
export, reset, import, confirm the village returns.
