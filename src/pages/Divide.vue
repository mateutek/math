<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Check, ArrowLeft } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import ClassChip from '@/components/ClassChip.vue'
import StarRow from '@/components/StarRow.vue'
import Celebration from '@/components/Celebration.vue'
import TimerRing from '@/components/TimerRing.vue'
import { randomIntFromInterval } from '@/helpers/helpers'
import settings, { classConfig } from '@/store/settings'
import { reward, recordStreak } from '@/store/village'
import { t } from '@/i18n'

const timerKey = ref(0)
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
const streak = ref(0)
const cheer = ref(0)

const answerTotalInput = ref(null)

function focusAnswer() {
  nextTick(() => {
    const el = answerTotalInput.value?.$el ?? answerTotalInput.value
    el?.focus?.()
  })
}

function generateNew() {
  // the one game that wants a remainder, so it does not go through expr():
  // a divisor out of the times table and a dividend inside the class ceiling
  const cfg = classConfig.value
  divisor.value = randomIntFromInterval(2, 10)
  dividend.value = randomIntFromInterval(divisor.value + 1, cfg.mulMax)

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
  reward('stone', classConfig.value.pay)
  recordStreak('divide', classConfig.value.id, streak.value)
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
  classConfig,
  () => {
    score.value = 0
    tasksTotal.value = 0
    streak.value = 0
    generateNew()
  },
  { immediate: true },
)

onMounted(focusAnswer)
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: cardColor === 'green', wrong: cardColor === 'red' }"
    style="--k-display-op: var(--k-op-div); border-color: var(--k-op-div); border-width: 2px"
  >
    <Celebration v-if="cardColor === 'green'" :key="cheer" :cheer="cheer" />

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

    <ClassChip game="divide" />

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
        <label class="kid-field-label">{{ t('whole') }}</label>
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
        <label class="kid-field-label">{{ t('rest') }}</label>
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
