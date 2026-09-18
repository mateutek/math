<script setup>
import { ref, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Check, ArrowLeft } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import StarRow from '@/components/StarRow.vue'
import Celebration from '@/components/Celebration.vue'
import TimerRing from '@/components/TimerRing.vue'
import { expr } from '@/games/generators'
import settings, { classConfig } from '@/store/settings'
import { reward, recordStreak } from '@/store/village'
import { t } from '@/i18n'

const timerKey = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const multiplicand = ref(1)
const multiplayer = ref(1)
const cardColor = ref('')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const streak = ref(0)
const cheer = ref(0)

const answerInput = ref(null)

function generateNew() {
  const task = expr('×', classConfig.value)
  multiplicand.value = task.a
  multiplayer.value = task.b
  solution.value = task.result
  answer.value = ''
  cardColor.value = ''
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  streak.value += 1
  reward('stone', classConfig.value.pay)
  recordStreak('multiply', classConfig.value.id, streak.value)
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
  classConfig,
  () => {
    score.value = 0
    tasksTotal.value = 0
    streak.value = 0
    generateNew()
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: cardColor === 'green', wrong: cardColor === 'red' }"
    :style="{ '--k-display-op': 'var(--k-op-mul)', borderColor: 'var(--k-op-mul)', borderWidth: '2px' }"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" />

    <!-- status row -->
    <div class="kid-status">
      <RouterLink to="/graj" class="kid-back" :aria-label="t('back')">
        <ArrowLeft :size="20" />
      </RouterLink>
      <div class="kid-score">
        <span class="num">{{ score }} / {{ tasksTotal }}</span>
        <span class="cap">{{ t('points') }}</span>
      </div>
      <div v-if="settings.timerEnabled" class="kid-timer-slot">
        <TimerRing
          :key="timerKey"
          :duration="classConfig.seconds"
          @timeout="wrongAnswer"
        />
      </div>
      <StarRow :streak="streak" :just-won="cardColor === 'green'" />
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

    <!-- actions -->
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
