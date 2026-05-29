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
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()

const timerDurations = [30, 20, 15]
const levelMinScale = [1, 10, 100]
const levelMaxScale = [10, 100, 1000]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const minuend = ref(1)
const subtrahend = ref(1)
const cardColor = ref('')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)
const streak = ref(0)
const cheer = ref(0)

const answerInput = ref(null)

function generateNew() {
  const index = level.value - 1
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]

  minuend.value = randomIntFromInterval(levelMin.value, levelMax.value)
  subtrahend.value = randomIntFromInterval(levelMin.value, levelMax.value)

  if (minuend.value < subtrahend.value) {
    minuend.value = subtrahend.value + randomIntFromInterval(1, levelMax.value)
  }

  solution.value = minuend.value - subtrahend.value
  answer.value = ''
  cardColor.value = ''
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  setTimeout(() => {
    cardColor.value = ''
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
  if (parseInt(answer.value) === solution.value) {
    generateNew()
    answer.value = ''
    score.value += 1
    streak.value += 1
    cheer.value += 1
    correctAnswer()
  } else {
    wrongAnswer()
  }
  nextTick(() => {
    answerInput.value?.focus?.()
  })
}

watch(
  () => route.params.level,
  (newLevel) => {
    level.value = newLevel
  }
)

watch(level, () => {
  generateNew()
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = route.params.level
})
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: cardColor === 'green', wrong: cardColor === 'red' }"
    style="--k-display-op: #f59e0b"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" :cheer="cheer" />

    <div class="kid-status">
      <div class="kid-score">
        <span class="num">{{ score }} / {{ tasksTotal }}</span>
        <span class="cap">{{ t('points') }}</span>
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
        :to="`/odejmowanie/${n}`"
      >
        <span class="pl">{{ t('level') }} {{ n }}</span>
        <span class="rg">{{ levelMinScale[n - 1] }}–{{ levelMaxScale[n - 1] }}</span>
      </RouterLink>
    </div>

    <div class="kid-eq">
      <AnimatedInteger :value="minuend" />
      <span class="op">−</span>
      <AnimatedInteger :value="subtrahend" />
      <span>=</span>
      <span class="ans" :class="{ reveal: wrongAnswers === 3 }">
        {{ wrongAnswers === 3 ? solution : '?' }}
      </span>
    </div>

    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="wrongAnswers" />
    </div>

    <div class="kid-field">
      <label class="kid-field-label">{{ t('answer') }}</label>
      <input
        ref="answerInput"
        v-model="answer"
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
        <RefreshCw :size="18" /> {{ t('newBtn') }}
      </button>
      <button
        class="kid-btn kid-btn-primary"
        :disabled="wrongAnswers === 3"
        @click="checkAnswer"
      >
        <Check :size="20" /> {{ t('check') }}
      </button>
    </div>
  </div>
</template>
