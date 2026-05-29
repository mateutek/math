import { reactive, watch } from 'vue'

const stored = localStorage.getItem('timerEnabled')
const storedLang = localStorage.getItem('lang')

const settings = reactive({
  timerEnabled: stored !== null ? JSON.parse(stored) : false,
  lang: storedLang === 'en' || storedLang === 'pl' ? storedLang : 'pl',
})

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
