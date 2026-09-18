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

// Records are kept per game AND per class: a streak at "do 10" says nothing
// about one at "do 1000". This branch is unreleased, so the old per-game keys
// are simply left behind in any save that has them - there is no migration.
export const streakKey = (game, schoolClass) => `${game}#${schoolClass}`

export function recordStreak(game, schoolClass, n) {
  const key = streakKey(game, schoolClass)
  // validate() rejects the whole save if any bestStreak value is not a
  // non-negative integer, so a bad number must never be written here
  if (Number.isInteger(n) && n > (village.bestStreak[key] ?? 0)) village.bestStreak[key] = n
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
