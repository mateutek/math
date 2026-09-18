import { h } from 'vue'

// Two icons the canvas draws itself (lucide has no single-bone domino and its
// grid leaves every square empty). Same 24px box and stroke weight as lucide.
function icon(shapes) {
  const cmp = (props) =>
    h(
      'svg',
      {
        width: props.size,
        height: props.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
        'stroke-linejoin': 'round',
      },
      shapes().map(([tag, attrs]) => h(tag, attrs)),
    )
  cmp.props = ['size']
  return cmp
}

const TilesIcon = icon(() => [
  ['rect', { x: 3, y: 3, width: 7.5, height: 7.5, rx: 2 }],
  ['rect', { x: 13.5, y: 3, width: 7.5, height: 7.5, rx: 2 }],
  ['rect', { x: 3, y: 13.5, width: 7.5, height: 7.5, rx: 2 }],
  ['rect', { x: 13.5, y: 13.5, width: 7.5, height: 7.5, rx: 2, fill: 'currentColor' }],
])

const DominoIcon = icon(() => [
  ['rect', { x: 6, y: 2, width: 12, height: 20, rx: 3 }],
  ['line', { x1: 6, y1: 12, x2: 18, y2: 12 }],
  ['circle', { cx: 12, cy: 7, r: 1.2, fill: 'currentColor' }],
  ['circle', { cx: 9.5, cy: 15, r: 1.2, fill: 'currentColor' }],
  ['circle', { cx: 14.5, cy: 19, r: 1.2, fill: 'currentColor' }],
])

// Every playable page, grouped for the Play grid. `id` doubles as the i18n key
// for the name and as the bestStreak key in the village save. `ink` is the
// darker text shade of `color`: the operation colours fail contrast on white.
export const GROUPS = [
  {
    key: 'grpOps',
    pays: ['wood', 'stone'],
    // how many cards the group's row holds on the wide layout
    cols: 6,
    games: [
      { id: 'addition', symbol: '+', color: 'var(--k-op-add)', ink: '#15803d', route: '/dodawanie', pays: ['wood'] },
      { id: 'subtraction', symbol: '−', color: 'var(--k-op-sub)', ink: '#b45309', route: '/odejmowanie', pays: ['wood'] },
      { id: 'multiply', symbol: '×', color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/mnozenie', pays: ['stone'] },
      { id: 'divide', symbol: '÷', color: 'var(--k-op-div)', ink: '#be185d', route: '/dzielenie', pays: ['stone'] },
      { id: 'divide2', symbol: '÷', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/dzielenie2', pays: ['stone'] },
      { id: 'missing', short: 'missingShort', symbol: '?', color: 'var(--k-brand)', ink: '#1f4fc4', route: '/gry/brakujaca', pays: ['wood', 'stone'] },
    ],
  },
  {
    key: 'grpGames',
    pays: ['wood', 'stone'],
    cols: 2,
    games: [
      { id: 'tiles', icon: TilesIcon, color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/gry/kafelki', pays: ['wood', 'stone'] },
      { id: 'domino', icon: DominoIcon, color: 'var(--k-op-add)', ink: '#15803d', route: '/gry/domino', pays: ['wood'] },
    ],
  },
  {
    key: 'grpNumbers',
    pays: ['food'],
    cols: 3,
    games: [
      { id: 'compare', symbol: '<', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/porownaj', pays: ['food'] },
      { id: 'biggest', symbol: '↑', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/najwieksza', pays: ['food'] },
      { id: 'ascending', symbol: '123', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/rosnaco', pays: ['food'] },
    ],
  },
]

export const GAMES = GROUPS.flatMap((group) => group.games)
