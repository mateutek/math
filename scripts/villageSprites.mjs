// Folds the per-sprite JSON the village designer renders into
// public/village/buildings/ into the one manifest the map imports.
// Run after every `npm run render` over there:  npm run sprites
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../public/village/buildings/', import.meta.url)
const rows = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => {
    const { footprint, views } = JSON.parse(readFileSync(new URL(f, dir)))
    const faces = Object.fromEntries(
      Object.entries(views).map(([k, v]) => [k, [v.w, v.h, ...v.anchor]]),
    )
    // [w, h, anchorX, anchorY] per facing, in sprite px
    return `  ${JSON.stringify(f.slice(0, -5))}: ${JSON.stringify({ footprint, ...faces })}`
  })
writeFileSync(new URL('../src/data/villageSprites.json', import.meta.url), `{\n${rows.join(',\n')}\n}\n`)
console.log(`villageSprites.json: ${rows.length} sprites`)
