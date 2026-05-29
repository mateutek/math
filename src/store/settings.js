import { reactive, watch } from 'vue'

const stored = localStorage.getItem('timerEnabled')

const settings = reactive({
  timerEnabled: stored !== null ? JSON.parse(stored) : false,
})

watch(
  () => settings.timerEnabled,
  (value) => {
    localStorage.setItem('timerEnabled', JSON.stringify(value))
  },
)

export default settings
