import { GAMES } from '@/data/games'
import { t, tp } from '@/i18n'

// the "W klasie N ćwiczysz" rows for one class config, read straight off the
// class table; the class picker and the parent page both list them
export function practiceRows(cfg) {
  return [
    { sym: '+ −', ink: 'var(--k-ink-add, #15803d)', text: tp('practiceAdd', cfg.max) },
    ...(cfg.mulMax
      ? [{ sym: '× ÷', ink: 'var(--k-ink-mul, #4f46e5)', text: tp('practiceMul', cfg.mulMax) }]
      : []),
    { sym: '< >', ink: 'var(--k-ink-div2, #0f766e)', text: tp('practiceCompare', cfg.max) },
    { sym: '?', ink: 'var(--k-ink-missing, #1f4fc4)', text: tp('practiceMissing', cfg.max) },
    ...cfg.topics.map((id) => {
      const game = GAMES.find((g) => g.id === id)
      return { sym: game.symbol, ink: game.ink, text: t('practice_' + id) }
    }),
  ]
}
