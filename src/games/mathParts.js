// The evaluator for the token lists MathParts.vue draws. Pure node, no Vue: it
// is imported by topics.check.js (every generated task must be true) and by
// theory.check.js (every formula in an article must be true).
//
// Tokens are the ones src/games/topics.js and src/data/theory.js produce:
// numbers, the operator strings '+' '−' '×' '·' ':', the grouping strings
// '(' ')', the relations '=' '<' '>', a word token { t } that means "of" and
// multiplies, and { frac } { pow } { root } { pct } { triangle }.
const isObj = (x) => x !== null && typeof x === 'object'

// the number a single token stands for
export function tokenValue(p) {
  if (typeof p === 'number') return p
  if (p.frac) return p.frac[0] / p.frac[1]
  if (p.pow) return p.pow[0] ** p.pow[1]
  if (p.root !== undefined) return Math.sqrt(p.root)
  if (p.pct !== undefined) return p.pct / 100
  throw new Error(`no value for ${JSON.stringify(p)}`)
}

const APPLY = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '·': (a, b) => a * b,
  ':': (a, b) => a / b,
}
// 2 binds tighter than 1, which is the whole of "kolejność działań"
const PREC = { '+': 1, '−': 1, '×': 2, '·': 2, ':': 2 }

// One side of a relation. A plain left-to-right walk would read 2 + 3 × 4 as
// 20, so this is the smallest recursive descent that gets the article right:
// sum -> product -> atom, with '(' recursing back into sum.
export function side(tokens) {
  let i = 0
  const peek = () => tokens[i]

  function atom() {
    const p = tokens[i++]
    if (p === '(') {
      const value = sum()
      if (tokens[i] !== ')') throw new Error(`no ")" in ${JSON.stringify(tokens)}`)
      i += 1
      return value
    }
    if (p === undefined) throw new Error(`a missing number in ${JSON.stringify(tokens)}`)
    return tokenValue(p)
  }

  function product() {
    let acc = atom()
    for (;;) {
      const p = peek()
      // a word token ({ t: 'of' }) reads as a multiplication: 3/4 z 20
      const word = isObj(p) && p.t
      if (!word && PREC[p] !== 2) return acc
      i += 1
      acc = APPLY[word ? '×' : p](acc, atom())
    }
  }

  function sum() {
    let acc = product()
    while (PREC[peek()] === 1) {
      const op = tokens[i++]
      acc = APPLY[op](acc, product())
    }
    return acc
  }

  const value = sum()
  if (i !== tokens.length) throw new Error(`stray token in ${JSON.stringify(tokens)}`)
  return value
}

export const isTriple = ({ a, b, c }) => a * a + b * b === c * c

const REL = {
  // a fraction sum lands a few 1e-17 off, and no task is that precise
  '=': (a, b) => Math.abs(a - b) < 1e-9,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
}

// Is what is on screen true? A chain (8 + 5 = 8 + 2 + 3 = 13) holds when every
// neighbouring pair does, so one wrong step in the middle is caught.
export function holds(parts) {
  if (parts[0] && parts[0].triangle) return isTriple(parts[0].triangle)
  const at = parts.flatMap((p, i) => (REL[p] ? [i] : []))
  if (!at.length || at[0] === 0) throw new Error(`no left side in ${JSON.stringify(parts)}`)
  const values = []
  let from = 0
  for (const i of at) {
    values.push(side(parts.slice(from, i)))
    from = i + 1
  }
  values.push(side(parts.slice(from)))
  return at.every((i, k) => REL[parts[i]](values[k], values[k + 1]))
}
