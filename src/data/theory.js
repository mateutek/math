// The theory articles, in index order. Pure data and pure functions, no Vue:
// theory.check.js runs this under plain node and asserts that every formula is
// arithmetically true and every word has a string in both languages.
//
// Every word here is an i18n key: `th_<id>` is the title, `th_<id>_ex` the mono
// example on the index row, `th_<id>_cta` the button into the game, and each
// card carries `th_<id>_h<n>` plus its `th_<id>_n<n>` notes. `parts` is the
// token list MathParts.vue draws; `verify: false` marks one that is not an
// equation (a lone fraction, or the symbolic a² + b² = c²).
export const THEORY_GROUPS = ['grpOps', 'grpNumbers', 'grpTopics', 'grpGeometry']

// the multiplication rows that keep a trick tip under the table
export const TRICK_ROWS = [1, 6, 9, 10]

// rows easy enough that their trick is worth showing even when picked as the
// other factor (so 7 x 10 reads the times-10 trick, not nothing)
export const EASY_ROWS = [1, 10]

// which trick tip a x b should show: swap to the other factor's row when it
// is 1 or 10, otherwise the row's own trick when it has one, otherwise none.
// TimesTable.vue and theory.check.js both call this, so the two never drift.
export function tipFor(a, b) {
  if (EASY_ROWS.includes(b) && !EASY_ROWS.includes(a)) return { key: `th_trick${b}`, n: a, swapped: true }
  if (TRICK_ROWS.includes(a)) return { key: `th_trick${a}`, n: b, swapped: false }
  return null
}

// the word token MathParts draws as "z" / "of"; the evaluator multiplies by it
const OF = { t: 'of' }
// x in an equation, as MathParts draws it; a card with x says its value in `x`
const X = (k = 1) => ({ x: k })
// the colours of the geometry game
const GEO = { color: 'var(--k-op-div)', ink: 'var(--k-ink-div, #be185d)', practise: '/tematy/geometria' }

export const ARTICLES = [
  {
    id: 'addTen',
    slug: 'dodawanie',
    cls: 1,
    group: 'grpOps',
    symbol: '+',
    color: 'var(--k-op-add)',
    ink: 'var(--k-ink-add, #15803d)',
    practise: '/dodawanie',
    cards: [
      { h: 'th_addTen_h1', parts: [8, '+', 5, '=', 8, '+', 2, '+', 3, '=', 13], notes: ['th_addTen_n1'] },
      { h: 'th_addTen_h2', parts: [5, '+', 8, '=', 8, '+', 5], notes: ['th_addTen_n2'] },
    ],
  },
  {
    id: 'subTen',
    slug: 'odejmowanie',
    cls: 1,
    group: 'grpOps',
    symbol: '−',
    color: 'var(--k-op-sub)',
    ink: 'var(--k-ink-sub, #b45309)',
    practise: '/odejmowanie',
    cards: [
      { h: 'th_subTen_h1', parts: [13, '−', 5, '=', 13, '−', 3, '−', 2, '=', 8], notes: ['th_subTen_n1'] },
      { h: 'th_subTen_h2', parts: [8, '+', 5, '=', 13], notes: ['th_subTen_n2'] },
    ],
  },
  {
    id: 'mulAdd',
    slug: 'mnozenie',
    cls: 2,
    group: 'grpOps',
    symbol: '×',
    color: 'var(--k-op-mul)',
    ink: 'var(--k-ink-mul, #4f46e5)',
    practise: '/mnozenie',
    cards: [
      { h: 'th_mulAdd_h1', parts: [3, '×', 4, '=', 4, '+', 4, '+', 4, '=', 12], notes: ['th_mulAdd_n1'] },
      { h: 'th_mulAdd_h2', parts: [4, '×', 3, '=', 3, '×', 4], notes: ['th_mulAdd_n2'] },
    ],
  },
  {
    id: 'divMul',
    slug: 'dzielenie',
    cls: 2,
    group: 'grpOps',
    symbol: '÷',
    color: 'var(--k-op-div)',
    ink: 'var(--k-ink-div, #be185d)',
    practise: '/dzielenie',
    cards: [
      { h: 'th_divMul_h1', parts: [12, ':', 3, '=', 4], notes: ['th_divMul_n1'] },
      { h: 'th_divMul_h2', parts: [12, ':', 1, '=', 12], notes: ['th_divMul_n2'] },
    ],
  },
  {
    id: 'compareNum',
    slug: 'porownywanie',
    cls: 1,
    group: 'grpNumbers',
    symbol: '<',
    color: 'var(--k-op-div2)',
    ink: 'var(--k-ink-div2, #0f766e)',
    practise: '/gry/porownaj',
    cards: [
      { h: 'th_compareNum_h1', parts: [47, '<', 52], notes: ['th_compareNum_n1'] },
      { h: 'th_compareNum_h2', parts: [54, '>', 51], notes: ['th_compareNum_n2'] },
      { h: 'th_compareNum_h3', parts: [3, '<', 8], notes: ['th_compareNum_n3'] },
    ],
  },
  {
    id: 'order',
    slug: 'kolejnosc',
    cls: 3,
    group: 'grpNumbers',
    symbol: '( )',
    color: 'var(--k-brand)',
    ink: 'var(--k-ink-missing, #1f4fc4)',
    practise: null,
    cards: [
      { h: 'th_order_h1', parts: [2, '+', 3, '×', 4, '=', 2, '+', 12, '=', 14], notes: ['th_order_n1'] },
      { h: 'th_order_h2', parts: ['(', 2, '+', 3, ')', '×', 4, '=', 5, '×', 4, '=', 20], notes: ['th_order_n2'] },
      { h: 'th_order_h3', parts: [20, ':', 4, '×', 2, '=', 5, '×', 2, '=', 10], notes: ['th_order_n3'] },
    ],
  },
  {
    id: 'fractions',
    slug: 'ulamki',
    cls: 4,
    group: 'grpTopics',
    symbol: '¾',
    color: 'var(--k-op-sub)',
    ink: 'var(--k-ink-sub, #b45309)',
    practise: '/tematy/ulamki',
    cards: [
      {
        h: 'th_fractions_h1',
        // a lone fraction is a picture, not an equation, so nothing to verify
        parts: [{ frac: [3, 4] }],
        verify: false,
        bars: [3, 4],
        notes: [
          { term: 'th_numerator', text: 'th_fractions_n1' },
          { term: 'th_denominator', text: 'th_fractions_n2' },
          'th_fractions_n3',
        ],
      },
      { h: 'th_fractions_h2', rows: [[1, 2], [2, 4], [4, 8]], notes: ['th_fractions_n4'] },
      {
        h: 'th_fractions_h3',
        parts: [{ frac: [1, 5] }, '+', { frac: [2, 5] }, '=', { frac: [3, 5] }],
        bars: [3, 5],
        notes: ['th_fractions_n5'],
      },
    ],
  },
  {
    id: 'decimals',
    slug: 'dziesietne',
    cls: 5,
    group: 'grpTopics',
    symbol: '0,5',
    color: 'var(--k-op-add)',
    ink: 'var(--k-ink-add, #15803d)',
    practise: '/tematy/dziesietne',
    cards: [
      { h: 'th_decimals_h1', parts: [{ frac: [3, 10] }, '=', 0.3], bars: [3, 10], notes: ['th_decimals_n1'] },
      { h: 'th_decimals_h2', parts: [0.25, '=', { frac: [25, 100] }], notes: ['th_decimals_n2'] },
      { h: 'th_decimals_h3', parts: [0.4, '+', 0.3, '=', 0.7], notes: ['th_decimals_n3'] },
    ],
  },
  {
    id: 'percents',
    slug: 'procenty',
    cls: 6,
    group: 'grpTopics',
    symbol: '%',
    color: 'var(--k-op-mul)',
    ink: 'var(--k-ink-mul, #4f46e5)',
    practise: '/tematy/procenty',
    cards: [
      { h: 'th_percents_h1', parts: [{ pct: 1 }, '=', { frac: [1, 100] }], notes: ['th_percents_n1'] },
      { h: 'th_percents_h2', parts: [{ pct: 25 }, OF, 80, '=', 20], bars: [1, 4], notes: ['th_percents_n2'] },
      { h: 'th_percents_h3', parts: [{ frac: [1, 2] }, '=', 0.5, '=', { pct: 50 }], notes: ['th_percents_n3'] },
    ],
  },
  {
    id: 'powers',
    slug: 'potegi',
    cls: 4,
    group: 'grpTopics',
    symbol: 'x²',
    color: 'var(--k-op-mul)',
    ink: 'var(--k-ink-mul, #4f46e5)',
    practise: '/tematy/potegi',
    cards: [
      {
        h: 'th_powers_h1',
        parts: [{ pow: [2, 5] }, '=', 2, '·', 2, '·', 2, '·', 2, '·', 2, '=', 32],
        notes: ['th_powers_n1'],
      },
      { h: 'th_powers_h2', parts: [{ root: 49 }, '=', 7], notes: ['th_powers_n2'] },
      { h: 'th_powers_h3', parts: [{ pow: [2, 3] }, '·', { pow: [2, 2] }, '=', { pow: [2, 5] }], notes: ['th_powers_n3'] },
    ],
  },
  {
    id: 'pythagoras',
    slug: 'pitagoras',
    cls: 8,
    group: 'grpTopics',
    symbol: '△',
    color: 'var(--k-op-div2)',
    ink: 'var(--k-ink-div2, #0f766e)',
    practise: '/tematy/pitagoras',
    cards: [
      {
        h: 'th_pythagoras_h1',
        // the drawing names the sides; it is not an equation to check
        parts: [{ triangle: { a: 'a', b: 'b', c: 'c' } }],
        verify: false,
        notes: ['th_pythagoras_n1'],
      },
      {
        h: 'th_pythagoras_h2',
        // symbolic: MathParts draws a letter token as a letter, and no
        // arithmetic can be done with it
        parts: [{ pow: ['a', 2] }, '+', { pow: ['b', 2] }, '=', { pow: ['c', 2] }],
        verify: false,
        notes: ['th_pythagoras_n2'],
      },
      {
        h: 'th_pythagoras_h3',
        parts: [{ pow: [3, 2] }, '+', { pow: [4, 2] }, '=', 9, '+', 16, '=', 25, '=', { pow: [5, 2] }],
        notes: ['th_pythagoras_n3'],
      },
    ],
  },
  {
    id: 'negatives',
    slug: 'ujemne',
    cls: 5,
    group: 'grpTopics',
    symbol: '−3',
    color: 'var(--k-op-sub)',
    ink: 'var(--k-ink-sub, #b45309)',
    practise: '/tematy/ujemne',
    cards: [
      { h: 'th_negatives_h1', parts: [-3, '<', -1, '<', 0, '<', 2], notes: ['th_negatives_n1'] },
      { h: 'th_negatives_h2', parts: [-3, '+', 5, '=', 2], notes: ['th_negatives_n2'] },
      { h: 'th_negatives_h3', parts: [4, '−', '(', -2, ')', '=', 4, '+', 2, '=', 6], notes: ['th_negatives_n3'] },
      { h: 'th_negatives_h4', parts: ['(', -3, ')', '·', '(', -2, ')', '=', 6], notes: ['th_negatives_n4'] },
    ],
  },
  {
    id: 'equations',
    slug: 'rownania',
    cls: 6,
    group: 'grpTopics',
    symbol: 'x=',
    color: 'var(--k-op-mul)',
    ink: 'var(--k-ink-mul, #4f46e5)',
    practise: '/tematy/rownania',
    cards: [
      { h: 'th_equations_h1', parts: [X(), '+', 7, '=', 12], x: 5, notes: ['th_equations_n1'] },
      { h: 'th_equations_h2', parts: [3, '·', X(), '=', 21], x: 7, notes: ['th_equations_n2'] },
      { h: 'th_equations_h3', parts: [X(2), '+', 3, '=', 11], x: 4, notes: ['th_equations_n3'] },
      { h: 'th_equations_h4', parts: [X(5), '−', 3, '=', X(2), '+', 9], x: 4, notes: ['th_equations_n4'] },
    ],
  },
  {
    id: 'average',
    slug: 'srednia',
    cls: 6,
    group: 'grpTopics',
    symbol: 'x̄',
    color: 'var(--k-op-add)',
    ink: 'var(--k-ink-add, #15803d)',
    practise: '/tematy/srednia',
    cards: [
      { h: 'th_average_h1', parts: [{ mean: [4, 7, 10] }, '=', 7], notes: ['th_average_n1'] },
      { h: 'th_average_h2', parts: ['(', 4, '+', 7, '+', 10, ')', ':', 3, '=', 21, ':', 3, '=', 7], notes: ['th_average_n2'] },
      { h: 'th_average_h3', parts: [{ mean: [3, 4] }, '=', 3.5], notes: ['th_average_n3'] },
    ],
  },
  // Geometry. A card's `fig` is drawn by GeoFigure.vue from the same layout the
  // game uses; theory.check.js measures it, so the picture and its numbers
  // agree, and checks its `area` or `perimeter` against the drawn outline.
  {
    id: 'angles',
    slug: 'katy',
    cls: 4,
    group: 'grpGeometry',
    symbol: '∠',
    ...GEO,
    cards: [
      {
        h: 'th_angles_h1',
        fig: { shape: 'angle', deg: 130 },
        notes: [
          { term: 'th_angles_t_acute', text: 'th_angles_acute' },
          { term: 'th_angles_t_right', text: 'th_angles_right' },
          { term: 'th_angles_t_obtuse', text: 'th_angles_obtuse' },
          { term: 'th_angles_t_straight', text: 'th_angles_straight' },
          { term: 'th_angles_t_reflex', text: 'th_angles_reflex' },
        ],
      },
      { h: 'th_angles_h2', fig: { shape: 'line', angles: [130, 50] }, parts: [130, '+', 50, '=', 180], notes: ['th_angles_n2'] },
      { h: 'th_angles_h3', fig: { shape: 'cross', shown: 70, ask: 'opposite', other: 70 }, notes: ['th_angles_n3'] },
      { h: 'th_angles_h4', fig: { shape: 'around', angles: [120, 100, 140] }, parts: [120, '+', 100, '+', 140, '=', 360], notes: ['th_angles_n4'] },
    ],
  },
  {
    id: 'triangles',
    slug: 'trojkaty',
    cls: 5,
    group: 'grpGeometry',
    symbol: '△',
    ...GEO,
    cards: [
      { h: 'th_triangles_h1', fig: { shape: 'triangle', angles: { A: 50, B: 60, C: 70 } }, parts: [50, '+', 60, '+', 70, '=', 180], notes: ['th_triangles_n1'] },
      { h: 'th_triangles_h2', fig: { shape: 'triangle', iso: true, angles: { A: 70, B: 70, C: 40 } }, parts: [70, '+', 70, '+', 40, '=', 180], notes: ['th_triangles_n2'] },
      { h: 'th_triangles_h3', fig: { shape: 'bars', sides: [6, 3, 4] }, parts: [3, '+', 4, '>', 6], notes: ['th_triangles_n3'] },
    ],
  },
  {
    id: 'quads',
    slug: 'czworokaty',
    cls: 4,
    group: 'grpGeometry',
    symbol: '▱',
    ...GEO,
    cards: [
      {
        h: 'th_quads_h1',
        fig: { shape: 'rect', a: 7, b: 4, bare: true },
        notes: [{ term: 'th_quads_t_rect', text: 'th_quads_rect' }, { term: 'th_quads_t_square', text: 'th_quads_square' }],
      },
      { h: 'th_quads_h2', fig: { shape: 'para', a: 7, h: 3, o: 2, bare: true }, notes: ['th_quads_n2'] },
      { h: 'th_quads_h3', fig: { shape: 'rhombus', e: 8, f: 5, bare: true }, notes: ['th_quads_n3'] },
      { h: 'th_quads_h4', fig: { shape: 'trap', a: 9, b: 4, h: 3, o: 2, bare: true }, notes: ['th_quads_n4'] },
      { h: 'th_quads_h5', fig: { shape: 'quad', angles: [80, 100, 70, 110] }, parts: [80, '+', 100, '+', 70, '+', 110, '=', 360], notes: ['th_quads_n5'] },
    ],
  },
  {
    id: 'perimeter',
    slug: 'obwod',
    cls: 4,
    group: 'grpGeometry',
    symbol: '⬚',
    ...GEO,
    cards: [
      { h: 'th_perimeter_h1', fig: { shape: 'rect', a: 6, b: 4 }, perimeter: 20, parts: [6, '+', 4, '+', 6, '+', 4, '=', 20], notes: ['th_perimeter_n1'] },
      { h: 'th_perimeter_h2', fig: { shape: 'rect', a: 5, b: 5 }, perimeter: 20, parts: [4, '·', 5, '=', 20], notes: ['th_perimeter_n2'] },
      { h: 'th_perimeter_h3', fig: { shape: 'tri3', a: 6, b: 5, c: 7 }, perimeter: 18, parts: [7, '+', 6, '+', 5, '=', 18], notes: ['th_perimeter_n3'] },
    ],
  },
  {
    id: 'area',
    slug: 'pole',
    cls: 4,
    group: 'grpGeometry',
    symbol: 'cm²',
    ...GEO,
    cards: [
      { h: 'th_area_h1', fig: { shape: 'rect', a: 6, b: 4 }, area: 24, parts: [6, '·', 4, '=', 24], notes: ['th_area_n1'] },
      { h: 'th_area_h2', fig: { shape: 'triH', a: 8, h: 5, o: 3 }, area: 20, parts: [8, '·', 5, ':', 2, '=', 20], notes: ['th_area_n2'] },
      { h: 'th_area_h3', fig: { shape: 'para', a: 7, h: 4, o: 2 }, area: 28, parts: [7, '·', 4, '=', 28], notes: ['th_area_n3'] },
      { h: 'th_area_h4', fig: { shape: 'trap', a: 8, b: 4, h: 5, o: 2 }, area: 30, parts: ['(', 8, '+', 4, ')', '·', 5, ':', 2, '=', 30], notes: ['th_area_n4'] },
    ],
  },
]

export const articleBySlug = (slug) => ARTICLES.find((a) => a.slug === slug) ?? null

// The index and the rail read this: the kid's own classes grouped by section,
// then everything above the class flat, under "Na później". Reading ahead is
// the point of a theory tab, so nothing is hidden, only moved down.
export function shelves(classId) {
  const mine = ARTICLES.filter((a) => a.cls <= classId)
  return {
    groups: THEORY_GROUPS
      .map((key) => ({ key, articles: mine.filter((a) => a.group === key) }))
      .filter((group) => group.articles.length),
    later: ARTICLES.filter((a) => a.cls > classId),
  }
}
