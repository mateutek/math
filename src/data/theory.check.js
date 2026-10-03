// Self-check for the theory articles. Runs under plain node:
//   node src/data/theory.check.js
// It reads i18n.js as TEXT, because i18n.js imports the Vue settings store and
// cannot be loaded here. The pl and en halves are sliced apart first, so a key
// written in one language and forgotten in the other fails.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { ARTICLES, THEORY_GROUPS, TRICK_ROWS, EASY_ROWS, articleBySlug, shelves, tipFor } from './theory.js'
import { GAMES } from './games.js'
import { holds } from '../games/mathParts.js'
import { figureErrors, outline, shoelace, perimeter, near } from '../games/geoMeasure.js'

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
  'theory', 'theoryLead', 'theoryHelper', 'theoryTable', 'theoryLater', 'crumbs',
  'theoryPick', 'theoryPicked', 'theorySameAsAdd', 'theorySwap',
  'classShort', 'timesAria', ...THEORY_GROUPS,
]
for (const key of CHROME) needsKey(key, 'chrome')
for (const n of TRICK_ROWS) needsKey(`th_trick${n}`, 'the multiplication tricks')
needsKey('th_trickSwap', 'the multiplication tricks')
// a row that lost its tip must not leave a dead string behind in either language
for (let n = 1; n <= 10; n++) {
  if (TRICK_ROWS.includes(n)) continue
  for (const lang of ['pl', 'en']) {
    assert.equal(stringFor(lang, `th_trick${n}`), null, `the multiplication tricks: ${lang} still has th_trick${n}`)
  }
}

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

  // an article with pictures (explore) may need no cards of its own
  assert.ok(a.cards.length >= (a.explore ? 0 : 2) && a.cards.length <= 5, `${where}: ${a.cards.length} cards`)
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
    // this is what catches a typo in 2 + 3 × 4 = 14 or in √49 = 7; an x
    // equation is checked with the x the card says
    if (card.parts && card.verify !== false) {
      const parts = card.parts.map((p) => (p && p.x !== undefined ? p.x * card.x : p))
      if (card.parts.some((p) => p && p.x !== undefined)) assert.ok(Number.isFinite(card.x), `${cw}: an x with no value`)
      assert.ok(holds(parts), `${cw}: ${JSON.stringify(card.parts)} is not true`)
    }
    // a figure is measured: its labels are what is drawn, it hides nothing,
    // and its area or perimeter is the one the card's sum arrives at
    if (card.fig) {
      assert.deepEqual(figureErrors(card.fig), [], `${cw}: ${JSON.stringify(card.fig)}`)
      assert.ok(!JSON.stringify(card.fig).includes('"?"'), `${cw}: a theory figure with a "?"`)
      for (const [what, measure] of [['area', shoelace], ['perimeter', perimeter]]) {
        if (card[what] === undefined) continue
        assert.ok(near(measure(outline(card.fig)), card[what]), `${cw}: the drawn ${what} is not ${card[what]}`)
        assert.equal(card.parts.at(-1), card[what], `${cw}: the sum does not end on the ${what}`)
      }
    }
    // a 13-segment strip is unreadable at 350px
    for (const [n, d] of [card.bars, ...(card.rows ?? [])].filter(Boolean)) {
      assert.ok(n > 0 && n <= d && d <= 12, `${cw}: a ${n} of ${d} strip`)
    }
    if (card.split) assert.equal(card.split[0] + card.split[1], card.bars[0], `${cw}: the split does not add up to the strip`)
  }
}

// the multiplication tricks: ask theory.js's own tipFor which trick a x b
// gets (the same call TimesTable.vue makes), then prove the arithmetic in
// its sentence - the prose is not trusted, the numbers in it are checked one
// by one
const TRICK_OPS = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y }

// fill one i18n string's {name} placeholders by hand, since i18n.js cannot be
// imported under node
function fill(lang, key, vars) {
  return Object.entries(vars).reduce(
    (out, [name, value]) => out.split(`{${name}}`).join(value),
    stringFor(lang, key),
  )
}

// the tip TimesTable.vue shows for a x b, or null when there is none
function buildTip(lang, a, b, pick) {
  const { key, n, swapped } = pick
  const vars = { b: n, p: a * b, f: 5 * n, t: 10 * n }
  const sentence = fill(lang, key, vars)
  return swapped ? `${fill(lang, 'th_trickSwap', { a, b })} ${sentence}` : sentence
}

for (const lang of ['pl', 'en']) {
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const pick = tipFor(a, b)
      const where = `${lang} tip for ${a} x ${b}`
      // prove both directions of the decision, not just "some tip came back":
      // a swap must actually swap, and a row with nothing to say must say nothing
      const swaps = EASY_ROWS.includes(b) && !EASY_ROWS.includes(a)
      if (swaps) {
        assert.ok(pick !== null, `${where}: expected a swapped tip but got none`)
        assert.ok(pick.swapped, `${where}: expected the swap branch`)
        assert.equal(pick.key, `th_trick${b}`, `${where}: expected row ${b}'s own trick`)
        assert.equal(pick.n, a, `${where}: expected n = ${a}`)
      } else if (!TRICK_ROWS.includes(a)) {
        assert.equal(pick, null, `${where}: expected no tip`)
      }
      if (pick === null) continue
      const tip = buildTip(lang, a, b, pick)
      assert.ok(!tip.includes('{'), `${where}: leftover placeholder in "${tip}"`)
      for (const [, x, op, y, z] of tip.matchAll(/(\d+) ([+−×]) (\d+) = (\d+)/g)) {
        assert.equal(TRICK_OPS[op](Number(x), Number(y)), Number(z), `${where}: "${x} ${op} ${y} = ${z}" is wrong`)
      }
      const numbers = tip.match(/\d+/g)
      assert.equal(Number(numbers[numbers.length - 1]), a * b, `${where}: tip does not end on ${a} * ${b}`)
      if (pick.swapped) assert.ok(tip.startsWith(`${a} × ${b}`), `${where}: swapped tip does not start with ${a} x ${b}`)
    }
  }
}

// the pictures' words, in both languages (plain or with plural forms)
const EXPLORE_FILES = ['../components/OpExplorer.vue', '../components/NumStepper.vue']
const EXPLORE_DIR = new URL('../components/explore/', import.meta.url)
for (const f of readdirSync(EXPLORE_DIR)) EXPLORE_FILES.push(`../components/explore/${f}`)
const opKeys = new Set(EXPLORE_FILES.flatMap((f) => [...read(f).matchAll(/'((?:op|ex)_\w+)'/g)].map((m) => m[1])))
assert.ok(opKeys.size > 20, `only ${opKeys.size} op_ keys found`)
for (const key of opKeys) {
  for (const lang of ['pl', 'en']) {
    assert.ok(new RegExp(`\\n    ${key}: ['\\[]`).test(BLOCK[lang]), `the pictures: ${lang} has no "${key}"`)
  }
}
// every article with pictures names a picture that exists
const EXPLORE_KINDS = ['add', 'sub', 'mul', 'div', ...readdirSync(EXPLORE_DIR).map((f) => f.replace('Explore.vue', '').toLowerCase())]
for (const a of ARTICLES.filter((x) => x.explore)) assert.ok(EXPLORE_KINDS.includes(a.explore), `${a.id}: no picture "${a.explore}"`)

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
