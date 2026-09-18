// The one table that says what a school class practises. The picker, the Play
// grid, the class chip, the generators and the reward amount all read it, so a
// change here moves the whole app at once.
// Pure data and pure functions, no Vue: generators.check.js runs under node.

// `max`       biggest number + and - and the number games work with
// `mulMax`    biggest product x and / work with; 0 means the class has neither
// `pay`       materials a correct answer pays
// `seconds`   what the optional timer gives per task
// `available` false while the app has no games for the class's topic
const cls = (id, max, mulMax, pay, seconds, available = true) => ({
  id,
  max,
  mulMax,
  pay,
  seconds,
  available,
  ops: mulMax ? ['+', '−', '×', '÷'] : ['+', '−'],
  // a domino bone is two halves of 0 to 6 pips, so 12 is the hard ceiling
  dominoMax: Math.min(max, 12),
  // i18n key of the one-line caption under the class on the picker
  cap: `cls_cap_${id}`,
})

export const CLASSES = [
  cls(0, 10, 0, 1, 30),
  cls(1, 20, 0, 1, 30),
  cls(2, 100, 50, 2, 20),
  cls(3, 1000, 100, 3, 15),
  // 4 to 8 name topics (ulamki, dziesietne, procenty, potegi, Pitagoras) the app
  // has no games for yet: the picker shows them, greyed out and unpickable.
  ...[4, 5, 6, 7, 8].map((id) => cls(id, 1000, 100, 3, 15, false)),
]

// what the app falls back to before a class has been picked (the router sends
// that case to the picker, so this only covers the frame before it lands)
const FALLBACK = 2

export const configFor = (id) =>
  CLASSES.find((c) => c.id === id && c.available) ?? CLASSES.find((c) => c.id === FALLBACK)

// Per game: which pool of the class it draws from, and the operator its chip
// shows. 'class' means every operator the class has, '' means none to show.
const GAMES = {
  addition: { pool: 'max', op: '+' },
  subtraction: { pool: 'max', op: '−' },
  multiply: { pool: 'mul', op: '×' },
  divide: { pool: 'mul', op: '÷' },
  divide2: { pool: 'mul', op: '÷' },
  missing: { pool: 'max', op: 'class' },
  tiles: { pool: 'max', op: 'class' },
  domino: { pool: 'domino', op: '+' },
  compare: { pool: 'max', op: '' },
  biggest: { pool: 'max', op: '' },
  ascending: { pool: 'max', op: '' },
}

// the biggest number this game shows a kid in this class
export function gameMax(id, cfg) {
  const pool = GAMES[id]?.pool
  if (pool === 'mul') return cfg.mulMax
  if (pool === 'domino') return cfg.dominoMax
  return cfg.max
}

// operators for the class chip, '' when the game has none worth naming
export function gameOps(id, cfg) {
  const op = GAMES[id]?.op ?? ''
  return op === 'class' ? cfg.ops.join(' ') : op
}

// A game built on an operator the class has not met is not offered at all.
// Anything not in the table (an unknown route name) is always offered.
export function gameOffered(id, cfg) {
  const op = GAMES[id]?.op
  return !op || op === 'class' || cfg.ops.includes(op)
}
