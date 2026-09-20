<script setup>
import { ref, watch, nextTick } from 'vue'
import { Check } from 'lucide-vue-next'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { missingRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const answer = ref('')
const answerInput = ref(null)

const focusAnswer = () => nextTick(() => answerInput.value?.focus())

const round = useRound('missing', (cfg) => {
  task.value = missingRound(cfg)
  answer.value = ''
  focusAnswer()
})

// the hidden operand shows "?" until three strikes reveal it
const shown = (side) =>
  task.value.hide !== side ? task.value[side] : round.strikes === 3 ? task.value.answer : '?'

function isRight() {
  return parseInt(answer.value) === task.value.answer
}

function check() {
  if (answer.value === '' || round.strikes === 3) return
  if (isRight()) {
    round.correct(task.value.material)
    round.newTask()
  } else {
    round.wrong()
    focusAnswer()
  }
}

// a right value is taken the moment it is typed, no Enter needed; an empty
// field (the reset for a new task, or a slip of the finger) is never right
watch(answer, () => {
  if (round.strikes < 3 && answer.value !== '' && isRight()) {
    round.correct(task.value.material)
    round.newTask()
  }
})
</script>

<template>
  <GameCard
    :round="round"
    :title="t('missing')"
    color="var(--k-brand)"
    ink="var(--k-ink-missing, #1f4fc4)"
    timed
  >
    <p class="kid-prompt">{{ t('missingPrompt') }}</p>
    <div class="kid-eq sm">
      <span :class="{ ans: task.hide === 'a', reveal: task.hide === 'a' && round.strikes === 3 }">{{ shown('a') }}</span>
      <span class="op">{{ task.op }}</span>
      <span :class="{ ans: task.hide === 'b', reveal: task.hide === 'b' && round.strikes === 3 }">{{ shown('b') }}</span>
      <span>=</span>
      <span>{{ task.result }}</span>
    </div>
    <div class="kid-field">
      <label class="kid-field-label" for="missing-answer">{{ t('answer') }}</label>
      <input
        id="missing-answer"
        ref="answerInput"
        v-model="answer"
        class="kid-input"
        type="number"
        inputmode="numeric"
        placeholder="?"
        :disabled="round.strikes === 3"
        @keyup.enter="check"
      />
    </div>
    <template #action>
      <button class="kid-btn kid-btn-primary" :disabled="round.strikes === 3" @click="check">
        <Check :size="20" /> {{ t('check') }}
      </button>
    </template>
  </GameCard>
</template>
