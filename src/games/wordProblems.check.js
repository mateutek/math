// Self-check for the word problems. Runs under plain node:
//   node src/games/wordProblems.check.js
// Every task is read back in both languages and its answer worked out again
// here, from the numbers the story prints, by code that does not share the
// generator's formulas. A story must also make sense: change is never
// negative, a note is a real note, a speed suits its vehicle.
import assert from 'node:assert/strict'
import { LEVELS, TEXTS, WORDS, EVENTS, wordTask, wordKindsFor, storiesFor, storyText, money, form } from './wordProblems.js'
import { TOPICS, FROM } from '../data/classes.js'
import { tokenValue } from './mathParts.js'
import { parseAnswer, sameNumber } from './topics.js'

const RUNS = 3000
const EM_DASH = String.fromCharCode(0x2014)
const NOTES = [1000, 2000, 5000, 10000, 20000]
const SPEEDS = { cyclist: [10, 20], bus: [40, 60], car: [50, 90], train: [60, 120] }
const whole = (n) => Number.isInteger(n) && n > 0

// the answer again, per story; the asserts are what makes the story possible
const SOLVE = {
  cost: ({ count, price }) => (count * price) / 100,
  change({ count, price, note }) {
    assert.ok(NOTES.includes(note), `${note} is not a banknote`)
    assert.ok(note > count * price, 'the note does not cover the cost')
    return note / 100 - (count * price) / 100
  },
  unitPrice({ count, total }) {
    assert.equal(total % count, 0, 'the total does not divide')
    return total / count / 100
  },
  discount({ price, p }) {
    assert.ok(p > 0 && p < 100)
    return price / 100 - (price / 100) * (p / 100)
  },
  priceBefore: ({ after, p }) => after / 100 / (1 + p / 100),
  speedDistance: ({ v, t }) => v * t,
  speedSpeed: ({ d, t }) => d / t,
  speedTime: ({ d, v }) => d / v,
  proportion: ({ a, b, flour }) => (flour / a) * b,
  split({ a, b, sum, name, other }) {
    assert.ok(a !== b && name !== other)
    return (sum / 100 / (a + b)) * a
  },
  average: ({ marks }) => {
    assert.ok(marks.every((m) => m >= 1 && m <= 6), `marks ${marks}`)
    return marks.reduce((s, m) => s + m) / marks.length
  },
}

// favourable over all, counted face by face or ball by ball
const CHANCE = {
  die: ({ event }) => [1, 2, 3, 4, 5, 6].filter(EVENTS[event]).length / 6,
  balls: ({ red, blue, asked }) => (asked === 'red' ? red : blue) / (red + blue),
}

// the plain numbers a story's vars hold (money as it is printed)
const shownNumbers = (key, vars, lang) =>
  Object.entries(vars).flatMap(([name, v]) => {
    if (Array.isArray(v)) return v.map(String)
    if (typeof v !== 'number') return []
    return new RegExp(`\\{${name} zł\\}`).test(TEXTS[key][lang]) ? [money(v, lang)] : [lang === 'pl' ? String(v).replace('.', ',') : String(v)]
  })

function checkText(task, where) {
  for (const lang of ['pl', 'en']) {
    const text = storyText(task, lang)
    const at = `${where} ${lang}: "${text}"`
    assert.ok(!/[{}]|undefined|NaN|null/.test(text), `${at} has an unfilled slot`)
    assert.ok(!text.includes(EM_DASH), `${at} has an em dash`)
    assert.ok(/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(text) && text.endsWith('?'), `${at} is not a question`)
    // short enough for a 10-year-old to read in one go
    assert.ok(text.split(/\s+/).length <= 30, `${at} is too long`)
    if (lang === 'en') assert.ok(!/\b[Aa] [aeiou]/.test(text), `${at}: "a" before a vowel`)
    // every var is printed, so the answer worked out below uses only what the kid reads
    for (const name of Object.keys(task.story.vars)) {
      assert.ok(new RegExp(`\\{${name}[ }]|\\{\\w+ ${name}\\}`).test(TEXTS[task.story.key][lang]), `${at}: var ${name} has no slot`)
    }
    for (const n of shownNumbers(task.story.key, task.story.vars, lang)) assert.ok(text.includes(n), `${at} does not show ${n}`)
  }
}

for (let cls = 4; cls <= 8; cls++) {
  for (const level of LEVELS) {
    const where = `class ${cls} L${level}`
    const types = new Set()
    for (let i = 0; i < RUNS; i++) {
      const task = wordTask(level, cls)
      const { key, vars } = task.story
      types.add(task.type)
      checkText(task, `${where} ${key}`)
      if (['cost', 'change', 'unitPrice'].includes(key)) {
        assert.ok(vars.count >= 2, `${where} ${key}: a count of ${vars.count} meets the singular accusative`)
        assert.ok(whole(vars.price ?? vars.total), `${where} ${key}: money must be whole grosze`)
      }
      if (key.startsWith('speed')) {
        const [lo, hi] = SPEEDS[vars.vehicle]
        const v = vars.v ?? vars.d / vars.t
        const t = vars.t ?? vars.d / vars.v
        assert.ok(v >= lo && v <= hi, `${where}: a ${vars.vehicle} at ${v} km/h`)
        assert.ok(whole(t) && t <= 5, `${where}: ${t} hours`)
      }

      if (task.kind === 'number') {
        const { answer } = task
        assert.ok(Number.isFinite(answer) && answer > 0, `${where} ${key}: answer ${answer}`)
        assert.ok(Math.abs(answer * 100 - Math.round(answer * 100)) < 1e-6, `${where} ${key}: ${answer} past two places`)
        assert.ok(sameNumber(SOLVE[key](vars), answer), `${where} ${key}: ${JSON.stringify(vars)} is not ${answer}`)
        assert.equal(typeof task.unit, 'string')
        // the kid can type it with the Polish comma
        assert.ok(sameNumber(parseAnswer(String(answer).replace('.', ',')), answer))
        continue
      }

      assert.equal(task.kind, 'pick', where)
      // three tiles at least: two would leave a guess one try from a sure win
      assert.ok(task.options.length >= 3 && task.options.length <= 4, `${where} ${key}: ${task.options.length} options`)
      const values = task.options.map((o) => tokenValue(o[0]))
      assert.equal(new Set(values.map((v) => v.toFixed(9))).size, values.length, `${where} ${key}: two options are equal`)
      assert.ok(values.every((v) => v > 0 && v <= 1), `${where} ${key}: an option is no probability`)
      const p = CHANCE[key](vars)
      assert.ok(p > 0 && p < 1, `${where} ${key}: a sure or impossible event`)
      assert.ok(Math.abs(values[task.answer] - p) < 1e-9, `${where} ${key}: the right option is not ${p}`)
    }
    assert.deepEqual([...types].sort(), wordKindsFor(cls).sort(), `${where} kinds`)
  }
}

// the curriculum's order
assert.deepEqual(wordKindsFor(4), ['cost', 'change', 'unitPrice'])
assert.ok(!wordKindsFor(6).includes('probability') && wordKindsFor(7).includes('probability'))
assert.ok(!wordKindsFor(7).includes('split') && wordKindsFor(8).includes('split'))
// every story has one home topic, and that topic is open by the story's class
const homed = TOPICS.flatMap((topic) =>
  Object.entries(storiesFor(topic)).map(([type, [from]]) => {
    assert.ok(from >= FROM[topic], `${type} (class ${from}) waits for ${topic} (class ${FROM[topic]})`)
    return type
  }),
)
assert.deepEqual(homed.sort(), wordKindsFor(8).sort(), 'every story has a home topic')
assert.throws(() => wordTask(1, 3))
assert.throws(() => wordTask(4, 8))

// both languages have every story with the same slots, and every word has
// three Polish forms when counted, two English, or one each when only named
const slotsOf = (s) => [...new Set([...s.matchAll(/\{(\w+)(?: (\S+?))?\}/g)].map((m) => m[0]))].sort()
for (const [key, t] of Object.entries(TEXTS)) assert.deepEqual(slotsOf(t.pl), slotsOf(t.en), `${key} slots`)
for (const [id, w] of Object.entries(WORDS)) {
  assert.ok((w.pl.length === 3 && w.en.length === 2) || (w.pl.length === 1 && w.en.length === 1), `${id} forms`)
}

// Polish plurals after a number
assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 102, 112, 0].map(form), [0, 1, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2])
const story = (n) => ({ story: { key: 'cost', vars: { name: 'Ola', item: 'notebook', count: n, price: 350 } } })
assert.equal(storyText(story(3), 'pl'), 'Zeszyt kosztuje 3,50 zł. Ola kupuje 3 zeszyty. Ile płaci?')
assert.ok(storyText(story(5), 'pl').includes('5 zeszytów'))
assert.ok(storyText(story(12), 'pl').includes('12 zeszytów'))
assert.ok(storyText(story(22), 'pl').includes('22 zeszyty'))
assert.equal(storyText(story(2), 'en'), 'One notebook costs 3.50 zł. Ola buys 2 notebooks. How much does Ola pay?')
assert.equal(money(5, 'pl'), '0,05 zł')
assert.equal(money(1200, 'en'), '12 zł')

console.log('wordProblems: all checks passed')
