import { reactive, computed, watch } from 'vue'
import * as logic from './villageLogic.js'

const KEY = 'village'

function load() {
  try {
    return logic.validate(JSON.parse(localStorage.getItem(KEY))) ?? logic.fresh()
  } catch {
    return logic.fresh()
  }
}

const village = reactive(load())

watch(village, (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // storage full or blocked: keep playing in memory
  }
})

const set = (state) => Object.assign(village, state)

// applies a logic result that may be null (refused); reports whether it took
function commit(result) {
  if (!result) return false
  set(result)
  return true
}

// Local calendar date as YYYY-MM-DD (the sv locale formats dates that way).
const today = () => new Date().toLocaleDateString('sv')

export function reward(kind, amount = 1) {
  set(logic.touchDay(logic.applyReward(village, kind, amount), today()))
}

export function recordStreak(game, n) {
  if (n > (village.bestStreak[game] ?? 0)) village.bestStreak[game] = n
}

export const build = (id) => commit(logic.applyBuild(village, id))
export const trade = (kind) => commit(logic.applyTrade(village, kind))
export const importSave = (str) => commit(logic.decode(str))

export const exportSave = () => logic.encode(village)
export const checkSave = (str) => logic.decode(str) !== null
export const reset = () => set(logic.fresh())

export const next = computed(() => logic.nextBuilding(village))
export const affordable = computed(
  () => !!next.value && logic.canAfford(village, next.value.cost),
)

export default village
