// Self-check for the theory articles. Runs under plain node:
//   node src/data/theory.check.js
// It reads i18n.js as TEXT, because i18n.js imports the Vue settings store and
// cannot be loaded here. The pl and en halves are sliced apart first, so a key
// written in one language and forgotten in the other fails.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARTICLES, THEORY_GROUPS, articleBySlug, shelves } from './theory.js'
import { GAMES } from './games.js'
import { holds } from '../games/mathParts.js'

const EM_DASH = String.fromCharCode(0x2014)
const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8')

const theorySrc = read('./theory.js')
const i18nSrc = read('../i18n.js')
assert.ok(!theorySrc.includes(EM_DASH), 'theory.js contains an em dash')
assert.ok(!i18nSrc.includes(EM_DASH), 'i18n.js contains an em dash')

const cut = i18nSrc.indexOf('\n  en: {')
assert.ok(cut > 0, 'i18n.js has no en block')
const BLOCK = { pl: i18nSrc.slice(i18nSrc.indexOf('\n  pl: {'), cut), en: i18nSrc.slice(cut) }

// the value of one plain single-quoted key inside one language block
function stringFor(lang, key) {
  const found = BLOCK[lang].match(new RegExp(`\\n    ${key}: '([^'\\\\]*)'`))
  return found ? found[1] : null
}

function needsKey(key, where) {
  for (const lang of ['pl', 'en']) {
    const value = stringFor(lang, key)
    assert.ok(value !== null, `${where}: ${lang} has no "${key}"`)
    assert.ok(value.trim() !== '', `${where}: ${lang} "${key}" is empty`)
    assert.notEqual(value, key, `${where}: ${lang} "${key}" is only the key`)
  }
}

// the chrome the three pages say out loud, plus the section headings
const CHROME = [
  'theory', 'theoryLead', 'theoryHelper', 'theoryTable', 'theoryTableSub', 'theoryLater',
  'theoryYourClass', 'theoryPick', 'theoryPicked', 'theorySameAsAdd', 'theorySwap',
  'classShort', 'timesAria', ...THEORY_GROUPS,
]
for (const key of CHROME) needsKey(key, 'chrome')
for (let n = 1; n <= 10; n++) needsKey(`th_trick${n}`, 'the multiplication tricks')

const ROUTES = new Set(GAMES.map((g) => g.route))
const ids = new Set()
const slugs = new Set()

for (const a of ARTICLES) {
  const where = `article ${a.id}`
  assert.ok(!ids.has(a.id), `${where}: the id is used twice`)
  ids.add(a.id)
  assert.ok(!slugs.has(a.slug), `${where}: the slug is used twice`)
  slugs.add(a.slug)
  // the URL segment: lowercase letters only, and never the table's own
  assert.match(a.slug, /^[a-z]+$/, `${where}: "${a.slug}" is not a plain slug`)
  assert.notEqual(a.slug, 'tabliczka', `${where}: that slug belongs to the table`)
  assert.ok(Number.isInteger(a.cls) && a.cls >= 0 && a.cls <= 8, `${where}: class ${a.cls}`)
  assert.ok(THEORY_GROUPS.includes(a.group), `${where}: unknown group ${a.group}`)
  assert.ok(a.practise === null || ROUTES.has(a.practise), `${where}: ${a.practise} is no game route`)
  assert.equal(articleBySlug(a.slug), a, `${where}: articleBySlug does not find it`)

  needsKey(`th_${a.id}`, where)
  needsKey(`th_${a.id}_ex`, where)
  if (a.practise) needsKey(`th_${a.id}_cta`, where)

  assert.ok(a.cards.length >= 2 && a.cards.length <= 4, `${where}: ${a.cards.length} cards`)
  for (const [i, card] of a.cards.entries()) {
    const cw = `${where} card ${i + 1}`
    needsKey(card.h, cw)
    assert.ok(card.notes.length > 0, `${cw}: a card with nothing to read`)
    for (const note of card.notes) {
      if (typeof note === 'string') needsKey(note, cw)
      else {
        needsKey(note.term, cw)
        needsKey(note.text, cw)
      }
    }
    // this is what catches a typo in 2 + 3 × 4 = 14 or in √49 = 7
    if (card.parts && card.verify !== false) {
      assert.ok(holds(card.parts), `${cw}: ${JSON.stringify(card.parts)} is not true`)
    }
    // a 13-segment strip is unreadable at 350px
    for (const [n, d] of [card.bars, ...(card.rows ?? [])].filter(Boolean)) {
      assert.ok(n > 0 && n <= d && d <= 12, `${cw}: a ${n} of ${d} strip`)
    }
  }
}

assert.equal(articleBySlug('nic-takiego'), null)

// every article is shelved exactly once, and "later" holds exactly the ones the
// class has not reached
for (let classId = 0; classId <= 8; classId++) {
  const { groups, later } = shelves(classId)
  const listed = [...groups.flatMap((g) => g.articles), ...later]
  assert.equal(listed.length, ARTICLES.length, `class ${classId}: ${listed.length} articles shelved`)
  assert.equal(new Set(listed).size, ARTICLES.length, `class ${classId}: an article is shelved twice`)
  for (const group of groups) {
    assert.ok(THEORY_GROUPS.includes(group.key), `class ${classId}: unknown group ${group.key}`)
    for (const a of group.articles) {
      assert.equal(a.group, group.key, `class ${classId}: ${a.id} is in the wrong group`)
      assert.ok(a.cls <= classId, `class ${classId}: ${a.id} (kl. ${a.cls}) should be for later`)
    }
  }
  for (const a of later) assert.ok(a.cls > classId, `class ${classId}: ${a.id} belongs in a group`)
}

console.log('theory: all checks passed')
