<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { RefreshCw, Check } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import StarRow from '@/components/StarRow.vue'
import Celebration from '@/components/Celebration.vue'
import TimerRing from '@/components/TimerRing.vue'
import { randomIntFromInterval } from '@/helpers/helpers'
import settings from '@/store/settings'

const route = useRoute()
const router = useRouter()

const timerDurations = [30, 20, 15]
const divisorMinScale = [1, 2, 2]
const divisorMaxScale = [9, 15, 15]
const multiplierMinScale = [1, 2, 2]
const multiplierMaxScale = [9, 9, 15]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answerTotal = ref('')
const dividend = ref(1)
const divisor = ref(1)
const cardColor = ref('default')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const streak = ref(0)
const cheer = ref(0)

const answerTotalInput = ref(null)

function focusAnswer() {
  nextTick(() => {
    const el = answerTotalInput.value?.$el ?? answerTotalInput.value
    el?.focus?.()
  })
}

function generateNew(newLevel) {
  if (newLevel !== undefined && typeof newLevel === 'string') {
    tasksTotal.value -= 1
  }
  const index = level.value - 1
  const divisorMin = divisorMinScale[index]
  const divisorMax = divisorMaxScale[index]
  const multiplierMin = multiplierMinScale[index]
  const multiplierMax = multiplierMaxScale[index]

  divisor.value = randomIntFromInterval(divisorMin, divisorMax)
  const multiplier = randomIntFromInterval(multiplierMin, multiplierMax)
  dividend.value = divisor.value * multiplier

  solution.value = multiplier
  answerTotal.value = ''
  cardColor.value = 'default'
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  setTimeout(() => {
    cardColor.value = 'default'
  }, 1000)
}

function wrongAnswer() {
  cardColor.value = 'red'
  wrongAnswers.value += 1
  streak.value = 0
  if (wrongAnswers.value < 3) {
    timerKey.value += 1
  }
}

function checkAnswer() {
  if (parseInt(answerTotal.value) === solution.value) {
    generateNew()
    answerTotal.value = ''
    score.value += 1
    streak.value += 1
    cheer.value += 1
    correctAnswer()
  } else {
    wrongAnswer()
  }
  focusAnswer()
}

watch(
  () => route.params.level,
  (newLevel) => {
    level.value = newLevel || 1
  }
)

watch(level, (newLevel) => {
  generateNew(newLevel)
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = route.params.level
  generateNew()
  focusAnswer()
})
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: cardColor === 'green', wrong: cardColor === 'red' }"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" />

    <div class="kid-status">
      <div class="kid-score">
        <span class="num">{{ score }} / {{ tasksTotal }}</span>
        <span class="cap">Punkty</span>
      </div>

      <div v-if="settings.timerEnabled" class="kid-timer-slot">
        <TimerRing
          :key="timerKey"
          :duration="timerDurations[level - 1]"
          @timeout="wrongAnswer"
        />
      </div>

      <StarRow :streak="streak" :just-won="cardColor === 'green'" />
    </div>

    <div class="kid-levels">
      <RouterLink
        v-for="n in 3"
        :key="n"
        class="kid-pill"
        :class="{ active: Number(level) === n }"
        :to="`/dzielenie2/${n}`"
      >
        <span class="pl">Poziom {{ n }}</span>
        <span class="rg">{{ divisorMinScale[n - 1] }}–{{ divisorMaxScale[n - 1] }}</span>
      </RouterLink>
    </div>

    <div class="kid-eq" style="--k-display-op: var(--k-op-div)">
      <AnimatedInteger :value="dividend" />
      <span class="op">÷</span>
      <AnimatedInteger :value="divisor" />
      <span>=</span>
      <span class="ans" :class="{ reveal: wrongAnswers === 3 }">
        {{ wrongAnswers === 3 ? solution : '?' }}
      </span>
    </div>

    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="wrongAnswers" />
    </div>

    <div class="kid-field">
      <label class="kid-field-label">Wynik</label>
      <input
        ref="answerTotalInput"
        v-model="answerTotal"
        class="kid-input"
        type="number"
        inputmode="numeric"
        placeholder="?"
        autofocus
        :disabled="wrongAnswers === 3"
        @keyup.enter="checkAnswer"
      />
    </div>

    <div class="kid-actions">
      <button class="kid-btn kid-btn-ghost" @click="generateNew">
        <RefreshCw :size="18" /> Nowe
      </button>
      <button
        class="kid-btn kid-btn-primary"
        :disabled="wrongAnswers === 3"
        @click="checkAnswer"
      >
        <Check :size="20" /> Sprawdź
      </button>
    </div>
  </div>
</template>
