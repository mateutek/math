import { reactive, computed, watch } from 'vue'
import * as logic from './villageLogic.js'
import settings from './settings.js'

// Every class builds its own village: siblings in different classes share a
// device, and a village grown on class 2 sums would make class 6 a stroll.
// The village before this split was saved under the bare key; the first class
// to open finds it and takes it over, so nothing anyone built is lost.
const LEGACY = 'village'
const keyFor = (schoolClass) => `village#${schoolClass}`

function read(key) {
  try {
    return logic.validate(JSON.parse(localStorage.getItem(key)))
  } catch {
    return null
  }
}

function load(schoolClass) {
  // no class yet: show the old village, if any, but leave it where it is
  if (schoolClass === null) return read(LEGACY) ?? logic.fresh()
  const own = read(keyFor(schoolClass))
  if (own) return own
  const legacy = read(LEGACY)
  if (legacy) {
    try {
      localStorage.setItem(keyFor(schoolClass), JSON.stringify(legacy))
      localStorage.removeItem(LEGACY)
    } catch {
      // storage blocked: the legacy save just stays where it was
    }
    return legacy
  }
  return logic.fresh()
}

// Before a class is picked nothing is saved: the router keeps that visitor
// on the picker, and the village is loaded for real once a class is chosen.
let key = settings.schoolClass === null ? null : keyFor(settings.schoolClass)
const village = reactive(load(settings.schoolClass))

watch(village, (value) => {
  if (key === null) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: keep playing in memory
  }
})

// a new class swaps the whole village; the old one stays saved under its class
watch(
  () => settings.schoolClass,
  (schoolClass) => {
    if (schoolClass === null) return
    key = keyFor(schoolClass)
    Object.assign(village, load(schoolClass))
  },
)

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
export const needed = computed(() => logic.neededMaterial(village))

export default village
