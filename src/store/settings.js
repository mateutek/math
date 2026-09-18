import { reactive, watch } from 'vue'

const stored = localStorage.getItem('timerEnabled')
const storedLang = localStorage.getItem('lang')
const storedTheme = localStorage.getItem('theme')
const dark = window.matchMedia('(prefers-color-scheme: dark)')

const settings = reactive({
  timerEnabled: stored !== null ? JSON.parse(stored) : false,
  lang: storedLang === 'en' || storedLang === 'pl' ? storedLang : 'pl',
  // 'auto' follows the device, 'day' and 'night' force one
  theme: ['auto', 'day', 'night'].includes(storedTheme) ? storedTheme : 'auto',
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
  () => settings.lang,
  (value) => {
    localStorage.setItem('lang', value)
  },
)

export default settings
