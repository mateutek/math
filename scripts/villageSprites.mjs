// Folds the per-sprite JSON the village designer renders into
// public/village/buildings/ into the one manifest the map imports.
// Run after every `npm run render` over there:  npm run sprites
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

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

// Same for the villagers and pets in public/village/actors/:
// { actorId: { clip: { N|E|S|W: [w, h, anchorX, anchorY] } } }. Frame counts and fps
// stay in each actor's own json; the map only needs sizes and anchors per facing.
const actorDir = new URL('../public/village/actors/', import.meta.url)
const actors = {}
if (existsSync(actorDir)) {
  for (const f of readdirSync(actorDir).filter((f) => f.endsWith('.json')).sort()) {
    const { id, clips } = JSON.parse(readFileSync(new URL(f, actorDir)))
    actors[id] = Object.fromEntries(
      Object.entries(clips).map(([c, { views }]) => [
        c,
        Object.fromEntries(Object.entries(views).map(([k, v]) => [k, [v.w, v.h, ...v.anchor]])),
      ]),
    )
  }
}
writeFileSync(new URL('../src/data/villageActors.json', import.meta.url), `{\n${Object.entries(actors).map(([id, c]) => `  ${JSON.stringify(id)}: ${JSON.stringify(c)}`).join(',\n')}\n}\n`)
console.log(`villageActors.json: ${Object.keys(actors).length} actors`)
