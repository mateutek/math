import settings from '@/store/settings'

// Single source of truth for UI strings. `t(key)` reads settings.lang, which is
// reactive, so any template calling t() re-renders when the language changes.
export const messages = {
  pl: {
    subtitle: 'matematyka',
    points: 'Punkty',
    level: 'Poziom',
    answer: 'Wynik',
    whole: 'Całość',
    rest: 'Reszta',
    newBtn: 'Nowe',
    check: 'Sprawdź',
    bravo: 'Brawo!',
    timer: 'Zegar',
    addition: 'Dodawanie',
    subtraction: 'Odejmowanie',
    multiply: 'Mnożenie',
    divide: 'Dzielenie',
    divide2: 'Bez reszty',
  },
  en: {
    subtitle: 'mathematics',
    points: 'Points',
    level: 'Level',
    answer: 'Your answer',
    whole: 'Whole',
    rest: 'Rest',
    newBtn: 'New',
    check: 'Check',
    bravo: 'Great!',
    timer: 'Timer',
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiply: 'Multiplication',
    divide: 'Division',
    divide2: 'No remainder',
  },
}

export function t(key) {
  const lang = messages[settings.lang] ? settings.lang : 'pl'
  return messages[lang][key] ?? key
}
