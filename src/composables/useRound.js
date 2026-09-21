import { ref, computed, watch, reactive } from 'vue'
import { classConfig } from '@/store/settings'
import { reward, recordStreak } from '@/store/village'
import { MATERIALS } from '@/data/buildings'

// A board finished without a mistake, and every tenth correct answer in a row,
// pays this many coins. RewardsCard shows the number, so it lives here.
export const CLEAN_BOARD_COINS = 3

// Five right in a row fill the star row, and a full row turns into one coin.
export const STARS_PER_COIN = 5

// The one place a correct answer is paid, for the boards and the equation pages
// alike, and the tally of what this sitting has earned so far (the status row
// shows it). The tally starts again when the page is opened again.
export function useEarnings() {
  const earned = reactive(Object.fromEntries(MATERIALS.map((k) => [k, 0])))

  function pay(kind, amount) {
    reward(kind, amount)
    earned[kind] += amount
  }

  // `streak` already counts this answer. `times` multiplies the class pay: the
  // topic games pass their level, so a harder level is worth more.
  function payAnswer(material, streak, flawless = false, times = 1) {
    pay(material, classConfig.value.pay * times)
    if (streak % STARS_PER_COIN === 0) pay('coins', 1)
    if (flawless || streak % 10 === 0) pay('coins', CLEAN_BOARD_COINS)
  }

  return { earned, payAnswer }
}

// Round state shared by the new games. `next(cfg)` builds a fresh task from the
// class config and runs once right away, so the caller must declare its task
// refs first. `maxStrikes` is how many wrong answers end the task: three by
// default, fewer where guessing would get there anyway (a game of three tiles
// must not let the third one be a free win). A function is read per task, for
// pages whose tasks differ.
export function useRound(game, next, maxStrikes = 3) {
  const { earned, payAnswer } = useEarnings()
  const streak = ref(0)
  const strikes = ref(0)
  const max = computed(() => (typeof maxStrikes === 'function' ? maxStrikes() : maxStrikes))
  // the task is over and the answer shown
  const out = computed(() => strikes.value >= max.value)
  const flash = ref('')
  const cheer = ref(0)
  const timerKey = ref(0)
  let flashTimeout = null

  function newTask() {
    strikes.value = 0
    if (flash.value === 'red') flash.value = ''
    timerKey.value += 1
    next(classConfig.value)
  }

  function correct(material, flawless = false, times = 1) {
    streak.value += 1
    cheer.value += 1
    flash.value = 'green'
    payAnswer(material, streak.value, flawless, times)
    recordStreak(game, classConfig.value.id, streak.value)
    clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => {
      flash.value = ''
    }, 1000)
  }

  function wrong() {
    if (out.value) return
    flash.value = 'red'
    streak.value = 0
    strikes.value += 1
    if (!out.value) timerKey.value += 1
  }

  // a different kind of task from here on (a new class, a new level): the
  // streak belonged to the old one
  function restart() {
    streak.value = 0
    newTask()
  }

  watch(classConfig, restart, { immediate: true })

  return reactive({ cfg: classConfig, earned, streak, strikes, max, out, flash, cheer, timerKey, newTask, restart, correct, wrong })
}
