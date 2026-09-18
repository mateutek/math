import { LayoutGrid, Dices } from 'lucide-vue-next'

// Every playable page, grouped for the Play grid. `id` doubles as the i18n key
// for the name and as the bestStreak key in the village save. `ink` is the
// darker text shade of `color`: the operation colours fail contrast on white.
export const GROUPS = [
  {
    key: 'grpOps',
    pays: ['wood', 'stone'],
    games: [
      { id: 'addition', symbol: '+', color: 'var(--k-op-add)', ink: '#15803d', route: '/dodawanie', pays: ['wood'] },
      { id: 'subtraction', symbol: '−', color: 'var(--k-op-sub)', ink: '#b45309', route: '/odejmowanie', pays: ['wood'] },
      { id: 'multiply', symbol: '×', color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/mnozenie', pays: ['stone'] },
      { id: 'divide', symbol: '÷', color: 'var(--k-op-div)', ink: '#be185d', route: '/dzielenie', pays: ['stone'] },
      { id: 'divide2', symbol: '÷', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/dzielenie2', pays: ['stone'] },
      { id: 'missing', symbol: '?', color: 'var(--k-brand)', ink: '#1f4fc4', route: '/gry/brakujaca', pays: ['wood', 'stone'] },
    ],
  },
  {
    key: 'grpGames',
    pays: ['wood', 'stone'],
    games: [
      { id: 'tiles', icon: LayoutGrid, color: 'var(--k-op-mul)', ink: '#4f46e5', route: '/gry/kafelki', pays: ['wood', 'stone'] },
      { id: 'domino', icon: Dices, color: 'var(--k-op-add)', ink: '#15803d', route: '/gry/domino', pays: ['wood'] },
    ],
  },
  {
    key: 'grpNumbers',
    pays: ['food'],
    games: [
      { id: 'compare', symbol: '<', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/porownaj', pays: ['food'] },
      { id: 'biggest', symbol: '↑', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/najwieksza', pays: ['food'] },
      { id: 'ascending', symbol: '123', color: 'var(--k-op-div2)', ink: '#0f766e', route: '/gry/rosnaco', pays: ['food'] },
    ],
  },
]

export const GAMES = GROUPS.flatMap((group) => group.games)
