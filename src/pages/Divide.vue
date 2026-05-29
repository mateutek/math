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
const levelMinScale = [2, 10, 100]
const levelMaxScale = [10, 100, 200]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solutionTotal = ref(1)
const solutionRest = ref(0)
const answerTotal = ref('')
const answerRest = ref('')
const dividend = ref(1)
const divisor = ref(1)
const cardColor = ref('default')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)
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
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]

  dividend.value = randomIntFromInterval(levelMin.value, levelMax.value)
  divisor.value = randomIntFromInterval(levelMin.value, levelMax.value)

  if (dividend.value < divisor.value) {
    dividend.value = divisor.value + randomIntFromInterval(1, levelMax.value)
  }

  solutionTotal.value = Math.floor(dividend.value / divisor.value)
  solutionRest.value = dividend.value - solutionTotal.value * divisor.value
  answerTotal.value = ''
  answerRest.value = ''
  cardColor.value = 'default'
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  streak.value += 1
  cheer.value += 1
  setTimeout(() => {
    cardColor.value = 'default'
  }, 1000)
}

function wrongAnswer() {
  cardColor.value = 'red'
  streak.value = 0
  wrongAnswers.value += 1
  if (wrongAnswers.value < 3) {
    timerKey.value += 1
  }
}

function checkAnswer() {
  if (
    parseInt(answerTotal.value) === solutionTotal.value &&
    parseInt(answerRest.value) === solutionRest.value
  ) {
    generateNew()
    answerTotal.value = ''
    answerRest.value = ''
    score.value += 1
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
    style="--k-display-op: var(--k-op-div)"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" :cheer="cheer" />

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
        :to="`/dzielenie/${n}`"
      >
        <span class="pl">Poziom {{ n }}</span>
        <span class="rg">{{ levelMinScale[n - 1] }}–{{ levelMaxScale[n - 1] }}</span>
      </RouterLink>
    </div>

    <div class="kid-eq">
      <AnimatedInteger :value="dividend" />
      <span class="op">÷</span>
      <AnimatedInteger :value="divisor" />
      <span>=</span>
      <span class="ans" :class="{ reveal: wrongAnswers === 3 }">
        {{ wrongAnswers === 3 ? `${solutionTotal} r ${solutionRest}` : '?' }}
      </span>
    </div>

    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="wrongAnswers" />
    </div>

    <div class="kid-fields">
      <div class="kid-field">
        <label class="kid-field-label">Całość</label>
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
      <div class="kid-field">
        <label class="kid-field-label">Reszta</label>
        <input
          v-model="answerRest"
          class="kid-input"
          type="number"
          inputmode="numeric"
          placeholder="?"
          :disabled="wrongAnswers === 3"
          @keyup.enter="checkAnswer"
        />
      </div>
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
