// The pictures on the four operation articles (addition, subtraction,
// multiplication, division), as pure data: the numbers a kid may pick, and
// what each picture shows for them. OpExplorer.vue draws it; opPictures.check.js
// tries every allowed pick and proves the pictures add up. No Vue in here.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// The range of each number, in the order they are settled: a later range may
// depend on an earlier number (the second addend keeps the sum past ten).
const LIMITS = {
  // bridging ten: a + b from 11 to 18
  add: { a: () => [2, 9], b: ({ a }) => [Math.max(2, 11 - a), 9] },
  // back across ten: m − s lands below 10
  sub: { m: () => [11, 18], s: ({ m }) => [m - 9, 9] },
  // the difference bars, on their own numbers
  bars: { o: () => [2, 10], t: ({ o }) => [1, o - 1] },
  // the multiplication table
  mul: { r: () => [1, 10], c: () => [1, 10] },
  // d children, q each, and a remainder below d
  div: { d: () => [2, 5], q: () => [1, 5], r: ({ d }) => [1, d - 1] },
}

export const DEFAULTS = {
  add: { a: 8, b: 5 },
  sub: { m: 13, s: 5 },
  bars: { o: 9, t: 5 },
  mul: { r: 3, c: 4 },
  div: { d: 3, q: 4, r: 2 },
}

// every number of a picture brought into its range, earlier ones first
export function settle(kind, values = {}) {
  const out = {}
  for (const [key, range] of Object.entries(LIMITS[kind])) {
    const [lo, hi] = range(out)
    out[key] = clamp(values[key] ?? DEFAULTS[kind][key], lo, hi)
  }
  return out
}

// [lo, hi] of one number, given the others
export const rangeOf = (kind, values, key) => LIMITS[kind][key](values)

// every allowed set of numbers, for the check
export function allPicks(kind) {
  const keys = Object.keys(LIMITS[kind])
  const walk = (i, acc) => {
    if (i === keys.length) return [acc]
    const [lo, hi] = LIMITS[kind][keys[i]](acc)
    const out = []
    for (let v = lo; v <= hi; v++) out.push(...walk(i + 1, { ...acc, [keys[i]]: v }))
    return out
  }
  return walk(0, {})
}

const range = (n) => Array.from({ length: n }, (_, i) => i)

// A number line: ticks from lo to hi, a dot at start and one at end, and the
// jumps between them; `on` is false for a jump the step has not reached.
const ticks = (lo, hi, keys) => range(hi - lo + 1).map((i) => ({ n: lo + i, key: keys.includes(lo + i) }))

// The stepped sums go one move at a time, each starting where the last ended:
// 0 the question, 1 to ten, 2 on from ten, 3 the whole sum with the split in
// brackets. The pictures are complete from step 2; step 3 only writes it up.
export const LAST_STEP = 3

// 8 + 5: jump to 10, then the rest; two ten-frames fill the same way.
export function addPicture({ a, b }, s) {
  const step = Math.min(s, 2)
  const sum = a + b
  const fill = 10 - a
  const rest = b - fill
  const added = [0, fill, b][step]
  return {
    // 8 + 5 = ?, 8 + 2 = 10, 10 + 3 = 13, and 8 + (2 + 3) = 13: the 5 in two parts
    eq: [[a, '+', b, '=', '?'], [a, '+', fill, '=', 10], [10, '+', rest, '=', sum], [a, '+', '(', fill, '+', rest, ')', '=', sum]][s],
    line: {
      lo: a - 1,
      hi: sum + 1,
      ticks: ticks(a - 1, sum + 1, [a, 10, ...(step === 2 ? [sum] : [])]),
      start: a,
      end: [a, 10, sum][step],
      jumps: [
        { from: a, to: 10, label: `+${fill}`, on: step >= 1 },
        { from: 10, to: sum, label: `+${rest}`, on: step >= 2 },
      ],
    },
    cells: range(20).map((k) => (k < a ? 'start' : k < a + added ? 'added' : 'empty')),
    vars: { a, b, fill, rest, sum },
  }
}

// 13 − 5: cross out what is above ten, then the rest from the first frame.
export function subPicture({ m, s }, st) {
  const step = Math.min(st, 2)
  const units = m - 10
  const rest = s - units
  const res = m - s
  const gone = (k) => (step >= 1 && k >= 10 && k < m) || (step >= 2 && k >= 10 - rest && k < 10)
  return {
    // 13 − 5 = ?, 13 − 3 = 10, 10 − 2 = 8, and 13 − (3 + 2) = 8
    eq: [[m, '−', s, '=', '?'], [m, '−', units, '=', 10], [10, '−', rest, '=', res], [m, '−', '(', units, '+', rest, ')', '=', res]][st],
    line: {
      lo: res - 1,
      hi: m + 1,
      ticks: ticks(res - 1, m + 1, [m, 10, ...(step === 2 ? [res] : [])]),
      start: m,
      end: [m, 10, res][step],
      jumps: [
        { from: m, to: 10, label: `−${units}`, on: step >= 1 },
        { from: 10, to: res, label: `−${rest}`, on: step >= 2 },
      ],
    },
    cells: range(20).map((k) => (k >= m ? 'empty' : gone(k) ? 'gone' : 'start')),
    vars: { m, s, units, rest, res },
  }
}

// Ola's bar and Tomek's: the part they share, and what Ola has more.
export function barsPicture({ o, t }) {
  return {
    ola: range(10).map((i) => (i < t ? 'same' : i < o ? 'more' : 'none')),
    tomek: range(10).map((i) => (i < t ? 'same' : 'none')),
    eq: [o, '−', t, '=', o - t],
    vars: { o, t, diff: o - t },
  }
}

// r × c: an array (turned: c rows of r), r groups of c, r hops of c.
export function mulPicture({ r, c }, turned) {
  const p = r * c
  const rows = turned ? c : r
  const cols = turned ? r : c
  return {
    rows,
    cols,
    // every other row a shade lighter, so the rows read as rows
    dots: range(rows * cols).map((i) => Math.floor(i / cols) % 2 === 1),
    eq: turned ? [c, '×', r, '=', p] : [r, '×', c, '=', p],
    groups: range(r).map(() => c),
    // side by side: r rows of c, and the same turned, c rows of r
    swap: [
      { rows: r, cols: c, eq: [r, '×', c] },
      { rows: c, cols: r, eq: [c, '×', r] },
    ],
    // a long sum is shortened: 5 + 5 + … + 5
    sum: r <= 5 ? range(r).flatMap((i) => (i ? ['+', c] : [c])) : [c, '+', c, '+', '…', '+', c],
    line: {
      lo: 0,
      hi: p,
      ticks: range(r + 1).map((i) => ({ n: i * c, key: true })),
      start: 0,
      end: p,
      jumps: range(r).map((i) => ({ from: i * c, to: (i + 1) * c, label: `+${c}`, on: true })),
    },
    vars: { r, c, p, rows, cols },
  }
}

// d children share d × q sweets one round at a time; the same sweets packed
// in bags of d; and d × q + r, which leaves r over.
export function divPicture({ d, q, r }, round) {
  const n = d * q
  const dealt = Math.min(round, q)
  return {
    n,
    pool: n - d * dealt,
    kids: range(d).map(() => dealt),
    done: dealt === q,
    eq: dealt === q ? [n, ':', d, '=', q] : [n, ':', d, '=', '?'],
    bags: range(q).map(() => d),
    restEq: [n + r, ':', d, '=', q, { t: 'restShort' }, r],
    left: r,
    vars: { n, d, q, r, total: n + r, dealt },
  }
}

// the names the sharing card gives its children, in order
export const KIDS = ['Ania', 'Kuba', 'Ola', 'Staś', 'Zosia']
