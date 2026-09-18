import { ref, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { reward, recordStreak } from '@/store/village'

// A board finished without a mistake, and every tenth correct answer in a row,
// pays this many coins. RewardsCard shows the number, so it lives here.
export const CLEAN_BOARD_COINS = 3

// Round state shared by the new games. `next(level)` builds a fresh task and
// runs once right away, so the caller must declare its task refs first.
export function useRound(game, next) {
  const route = useRoute()
  const level = computed(() => Math.min(3, Math.max(1, Number(route.params.level) || 1)))

  const score = ref(0)
  const total = ref(0)
  const streak = ref(0)
  const strikes = ref(0)
  const flash = ref('')
  const cheer = ref(0)
  const timerKey = ref(0)
  let flashTimeout = null

  function newTask() {
    strikes.value = 0
    if (flash.value === 'red') flash.value = ''
    timerKey.value += 1
    total.value += next(level.value) ?? 1
  }

  function correct(material, flawless = false) {
    score.value += 1
    streak.value += 1
    cheer.value += 1
    flash.value = 'green'
    reward(material, level.value)
    if (streak.value % 5 === 0) reward('coins', 1)
    if (flawless || streak.value % 10 === 0) reward('coins', CLEAN_BOARD_COINS)
    recordStreak(game, streak.value)
    clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => {
      flash.value = ''
    }, 1000)
  }

  function wrong() {
    if (strikes.value >= 3) return
    flash.value = 'red'
    streak.value = 0
    strikes.value += 1
    if (strikes.value < 3) timerKey.value += 1
  }

  watch(
    level,
    () => {
      score.value = 0
      total.value = 0
      streak.value = 0
      newTask()
    },
    { immediate: true },
  )

  return reactive({ level, score, total, streak, strikes, flash, cheer, timerKey, newTask, correct, wrong })
}
