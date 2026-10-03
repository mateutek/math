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

const REST = { t: 'restShort' }

const OPS = { addition: '+', subtraction: '−', multiply: '×', divide2: '÷' }

function make(id, cfg, level) {
  if (OPS[id]) {
    const e = expr(OPS[id], cfg)
    return { parts: [e.a, e.op, e.b, '=', '?'], answer: e.result }
  }
  if (id === 'divide') {
    // two blanks, quotient and remainder, with the "r" printed between them;
    // the answer is one value per blank, in order
    const e = remainderExpr(cfg)
    return { parts: [e.a, '÷', e.b, '=', '?', REST, '?'], answer: [e.result, e.rest] }
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

// Hand edits. A question goes out as one line of text and comes back from it:
//   34 + ? = 62    1/4 + 1/4 = ?/4    2^3 = ?    √49 = ?    25% z 80 = ?
// Only the Pythagoras triangle has no text form; it is swapped, not typed.
export const editable = (q) => !q.parts.some((p) => p && p.triangle)

// the keyboard's signs, as the app prints them; "z" and "of" are the word
const KEYS = { '-': '−', '*': '×', ':': '÷', '/': '÷', z: { t: 'of' }, of: { t: 'of' }, r: { t: 'restShort' } }
const num = (s) => (s === '?' ? '?' : Number(s.replace(',', '.')))
const fmt = (x) => (typeof x === 'number' ? String(x).replace('.', ',') : x)

// `of` is the word for { t: 'of' } in the language on screen
function tokenText(p, of) {
  if (typeof p !== 'object') return fmt(p)
  if (p.t) return p.t === 'of' ? of : 'r'
  if (p.frac) return `${fmt(p.frac[0])}/${fmt(p.frac[1])}`
  if (p.pow) return `${fmt(p.pow[0])}^${fmt(p.pow[1])}`
  if (p.root !== undefined) return `√${fmt(p.root)}`
  return `${fmt(p.pct)}%`
}

export const toText = (q, of = 'z') => q.parts.map((p) => tokenText(p, of)).join(' ')

// a number or the blank, then what a token may be built from it
const N = String.raw`(\d+(?:[.,]\d+)?|\?)`
const TOKEN = new RegExp(String.raw`${N}\/${N}|${N}\^${N}|(?:√|sqrt)\s*${N}|${N}%|${N}|[^\s\d?√%^]+`, 'g')

function readToken(m) {
  const [s, fn, fd, pb, pe, root, pct, n] = m
  if (fn) return { frac: [num(fn), num(fd)] }
  if (pb) return { pow: [num(pb), num(pe)] }
  if (root) return { root: num(root) }
  if (pct) return { pct: num(pct) }
  if (n) return num(n)
  return KEYS[s.toLowerCase()] ?? s
}

// the '?' anywhere in a token
const blanks = (x) => (x === '?' ? 1 : x && typeof x === 'object' ? Object.values(x).reduce((n, v) => n + blanks(v), 0) : 0)

// text back into a question's parts; null without a '?' to fill in.
// Spaces are optional: "34+?=62" reads the same. No answer comes with it: the
// builder is for kids and never shows one (a parent panel will add them).
export function fromText(text) {
  const parts = [...String(text).matchAll(TOKEN)].map(readToken)
  return blanks(parts) ? parts : null
}
