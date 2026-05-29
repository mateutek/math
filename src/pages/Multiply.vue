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
const levelMinScale = [1, 5, 10]
const levelMaxScale = [10, 20, 30]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const multiplicand = ref(1)
const multiplayer = ref(1)
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

  multiplicand.value = randomIntFromInterval(levelMin.value, levelMax.value)
  multiplayer.value = randomIntFromInterval(levelMin.value, levelMax.value)
  solution.value = multiplicand.value * multiplayer.value
  answer.value = ''
  cardColor.value = ''
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  streak.value += 1
  cheer.value += 1
  setTimeout(() => {
    cardColor.value = ''
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

function focusAnswer() {
  nextTick(() => {
    answerInput.value?.focus?.()
  })
}

function checkAnswer() {
  if (wrongAnswers.value === 3) return
  if (parseInt(answer.value) === solution.value) {
    generateNew()
    answer.value = ''
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
    level.value = parseInt(newLevel) || 1
  }
)

watch(level, () => {
  generateNew()
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = parseInt(route.params.level) || 1
  generateNew()
})
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: cardColor === 'green', wrong: cardColor === 'red' }"
    :style="{ '--k-display-op': '#6366f1' }"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" />

    <!-- status row -->
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

    <!-- level pills -->
    <div class="kid-levels">
      <RouterLink
        v-for="n in 3"
        :key="n"
        class="kid-pill"
        :class="{ active: level === n }"
        :to="`/mnozenie/${n}`"
      >
        <span class="pl">Poziom {{ n }}</span>
        <span class="rg">{{ levelMinScale[n - 1] }}–{{ levelMaxScale[n - 1] }}</span>
      </RouterLink>
    </div>

    <!-- equation -->
    <div class="kid-eq">
      <AnimatedInteger :value="multiplicand" />
      <span class="op">×</span>
      <AnimatedInteger :value="multiplayer" />
      <span>=</span>
      <span class="ans" :class="{ reveal: wrongAnswers === 3 }">
        {{ wrongAnswers === 3 ? solution : '?' }}
      </span>
    </div>

    <!-- strikes -->
    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="wrongAnswers" />
    </div>

    <!-- answer field -->
    <div class="kid-field">
      <label class="kid-field-label">Wynik</label>
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

    <!-- actions -->
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
