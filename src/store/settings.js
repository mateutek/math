import { reactive, computed, watch } from 'vue'
import { CLASSES, TOPICS, configFor } from '@/data/classes'

const stored = localStorage.getItem('timerEnabled')
const storedLang = localStorage.getItem('lang')
const storedTheme = localStorage.getItem('theme')
// note: not Number(), which would read a missing entry as Zerowka (class 0)
const storedClass = CLASSES.find((c) => String(c.id) === localStorage.getItem('schoolClass'))
const dark = window.matchMedia('(prefers-color-scheme: dark)')

// the difficulty the kid last chose per topic game. Anything unreadable, an
// unknown topic or a level outside 1..3 falls back to the easy level.
function loadTopicLevels() {
  let raw = {}
  try {
    raw = JSON.parse(localStorage.getItem('topicLevel')) ?? {}
  } catch {
    // a corrupt entry: start every topic on easy
  }
  return Object.fromEntries(TOPICS.map((k) => [k, [1, 2, 3].includes(raw[k]) ? raw[k] : 1]))
}

const settings = reactive({
  // 0 is Zerowka and 1..8 the school classes; null until one has been picked,
  // which is what sends a first-run visitor to the picker
  schoolClass: storedClass?.available ? storedClass.id : null,
  timerEnabled: stored !== null ? JSON.parse(stored) : false,
  lang: storedLang === 'en' || storedLang === 'pl' ? storedLang : 'pl',
  // 'auto' follows the device, 'day' and 'night' force one
  theme: ['auto', 'day', 'night'].includes(storedTheme) ? storedTheme : 'auto',
  // quarter turns clockwise applied to the village map, 0..3
  mapRotation: [0, 1, 2, 3].includes(Number(localStorage.getItem('mapRotation')))
    ? Number(localStorage.getItem('mapRotation'))
    : 0,
  topicLevel: loadTopicLevels(),
  // the resolved theme. Everything visual reads the CSS variables under
  // <html data-theme>; this flag is only for the few things CSS cannot set,
  // such as the map viewBox and the night-only sky.
  night: false,
})

// on <html>, so the portalled settings sheet is themed too
function applyTheme() {
  settings.night = settings.theme === 'night' || (settings.theme === 'auto' && dark.matches)
  document.documentElement.dataset.theme = settings.night ? 'night' : 'day'
}

dark.addEventListener('change', applyTheme)

watch(
  () => settings.theme,
  (value) => {
    localStorage.setItem('theme', value)
    applyTheme()
  },
  { immediate: true },
)

watch(
  () => settings.timerEnabled,
  (value) => {
    localStorage.setItem('timerEnabled', JSON.stringify(value))
  },
)

watch(
  () => settings.mapRotation,
  (value) => {
    localStorage.setItem('mapRotation', String(value))
  },
)

watch(
  () => settings.topicLevel,
  (value) => {
    localStorage.setItem('topicLevel', JSON.stringify(value))
  },
  { deep: true },
)

watch(
  () => settings.lang,
  (value) => {
    localStorage.setItem('lang', value)
  },
)

watch(
  () => settings.schoolClass,
  (value) => {
    if (value === null) localStorage.removeItem('schoolClass')
    else localStorage.setItem('schoolClass', String(value))
  },
)

// Everything that needs a number range, a reward or an operator list reads
// this, never settings.schoolClass, so the unpicked case has one answer.
export const classConfig = computed(() => configFor(settings.schoolClass))

export default settings
