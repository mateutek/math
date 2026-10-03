// Questions for the printable test builder (src/pages/TestBuilder.vue). Pure,
// no Vue, so tests.check.js runs it under plain node. Every question comes from
// the generators the games already use, so a test stays inside what the class
// knows. A question is { parts, answer }: `parts` are MathParts.vue tokens with
// one '?' slot, the blank the kid fills in on paper.
import { expr, remainderExpr, compareRound, missingRound } from './generators.js'
import { topicTask } from './topics.js'
import { gameOffered } from '../data/classes.js'

// the sections a test can have, in the order they print. `instr` is the i18n
// key of the line that tells the kid what to do.
const SECTIONS = [
  { id: 'addition', instr: 'testCalc', count: 4 },
  { id: 'subtraction', instr: 'testCalc', count: 4 },
  { id: 'multiply', instr: 'testCalc', count: 4 },
  { id: 'divide', instr: 'testCalcRest', count: 4 },
  { id: 'divide2', instr: 'testCalc', count: 4 },
  { id: 'compare', instr: 'testCompare', count: 3 },
  { id: 'missing', instr: 'testMissing', count: 3 },
  { id: 'fractions', instr: 'testCalc', count: 4 },
  { id: 'powers', instr: 'testCalc', count: 4 },
  { id: 'decimals', instr: 'testCalc', count: 4 },
  { id: 'percents', instr: 'testCalc', count: 4 },
  { id: 'pythagoras', instr: 'testCalc', count: 3 },
]

export const MAX_PER_SECTION = 12

export const sectionsFor = (cfg) => SECTIONS.filter((s) => gameOffered(s.id, cfg))

// "34 + 28" from the generators as tokens, numbers kept as numbers
const tokens = (text) => text.split(' ').map((s) => (/^\d+$/.test(s) ? Number(s) : s))

const OPS = { addition: '+', subtraction: '−', multiply: '×', divide2: '÷' }

function make(id, cfg, level) {
  if (OPS[id]) {
    const e = expr(OPS[id], cfg)
    return { parts: [e.a, e.op, e.b, '=', '?'], answer: e.result }
  }
  if (id === 'divide') {
    // one blank, the kid writes both: "3 r 2"
    const e = remainderExpr(cfg)
    return { parts: [e.a, '÷', e.b, '=', '?'], answer: `${e.result} r ${e.rest}` }
  }
  if (id === 'compare') {
    const r = compareRound(cfg)
    return { parts: [...tokens(r.left.text), '?', r.right.value], answer: r.answer }
  }
  if (id === 'missing') {
    const r = missingRound(cfg)
    const [a, b] = r.hide === 'a' ? ['?', r.b] : [r.a, '?']
    return { parts: [a, r.op, b, '=', r.result], answer: r.answer }
  }
  // a topic: only typed tasks, a pick needs its tiles and paper has none
  for (;;) {
    const task = topicTask(id, level)
    if (task.kind === 'number') return { parts: task.parts, answer: task.answer }
  }
}

// a question not already in `taken`. Some pools are tiny (Pythagoras at level 1
// has a handful of tasks), so after enough misses a repeat is let through.
export function question(id, cfg, level, taken = []) {
  const seen = new Set(taken.map((q) => JSON.stringify(q.parts)))
  let q
  for (let i = 0; i < 50; i++) {
    q = make(id, cfg, level)
    if (!seen.has(JSON.stringify(q.parts))) break
  }
  return q
}

// Hand edits. Only a question made of plain numbers and signs can be typed
// back in; a fraction, power or triangle is swapped for a new one instead.
export const editable = (q) => q.parts.every((p) => typeof p === 'number' || typeof p === 'string')

// the keyboard's minus and star, as the app prints them
const KEYS = { '-': '−', '*': '×' }
const num = (s) => Number(s.replace(',', '.'))
const fmt = (x) => (typeof x === 'number' ? String(x).replace('.', ',') : x)

export const toText = (q) => q.parts.map(fmt).join(' ')
export const answerText = (q) => fmt(q.answer)

// "34 + ? = 62" and "28" back into a question; null unless it has exactly one
// '?' and an answer. Spaces are optional: "34+?=62" reads the same.
export function fromText(text, answer) {
  const parts = (String(text).match(/\d+(?:[.,]\d+)?|\?|[^\s\d?]+/g) ?? []).map((s) =>
    /^\d/.test(s) ? num(s) : (KEYS[s] ?? s),
  )
  const a = String(answer ?? '').trim()
  if (parts.filter((p) => p === '?').length !== 1 || !a) return null
  return { parts, answer: /^\d+(?:[.,]\d+)?$/.test(a) ? num(a) : a }
}
