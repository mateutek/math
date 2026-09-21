<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { expr } from '@/games/generators'
import { randomIntFromInterval } from '@/helpers/helpers'
import { GAMES } from '@/data/games'
import { t } from '@/i18n'

// One page for the five equation games. The route name is the game id, and its
// row in GAMES already says which sign to draw, in what colour, and what a
// right answer pays. App.vue keys the router view by route name, so every game
// gets a page of its own.
const game = GAMES.find((g) => g.id === useRoute().name)
// `divide` is the one game that wants a remainder, so it has a second field
const withRest = game.id === 'divide'

const task = ref(null)
const answer = ref('')
const rest = ref('')
const answerInput = ref(null)

const focusAnswer = () => nextTick(() => answerInput.value?.focus())

function remainderTask(cfg) {
  // does not go through expr(): a divisor out of the times table and a
  // dividend inside the class ceiling
  const b = randomIntFromInterval(2, 10)
  const a = randomIntFromInterval(b + 1, cfg.mulMax)
  return { a, b, result: Math.floor(a / b), rest: a % b }
}

const round = useRound(game.id, (cfg) => {
  task.value = withRest ? remainderTask(cfg) : expr(game.symbol, cfg)
  answer.value = ''
  rest.value = ''
  focusAnswer()
})

function isRight() {
  return parseInt(answer.value) === task.value.result && (!withRest || parseInt(rest.value) === task.value.rest)
}

function check() {
  // an empty field is a slip of the finger, not a wrong answer
  if (round.out || answer.value === '') return
  if (isRight()) {
    round.correct(game.pays[0])
    round.newTask()
  } else {
    round.wrong()
    focusAnswer()
  }
}

// a right value is taken the moment it is typed, no Enter needed; an empty
// field (the reset for a new task, or a slip of the finger) is never right
watch([answer, rest], () => {
  if (!round.out && answer.value !== '' && isRight()) {
    round.correct(game.pays[0])
    round.newTask()
  }
})
</script>

<template>
  <GameCard :round="round" :color="game.color" :ink="game.ink" timed>
    <div class="kid-eq">
      <AnimatedInteger :value="task.a" />
      <span class="op">{{ game.symbol }}</span>
      <AnimatedInteger :value="task.b" />
      <span>=</span>
      <span class="ans" :class="{ reveal: round.out }">
        {{ !round.out ? '?' : withRest ? `${task.result} r ${task.rest}` : task.result }}
      </span>
    </div>

    <div class="kid-fields">
      <div class="kid-field">
        <label class="kid-field-label" for="eq-answer">{{ t(withRest ? 'whole' : 'answer') }}</label>
        <input
          id="eq-answer"
          ref="answerInput"
          v-model="answer"
          class="kid-input"
          type="number"
          inputmode="numeric"
          placeholder="?"
          :disabled="round.out"
          @keyup.enter="check"
        />
      </div>
      <div v-if="withRest" class="kid-field">
        <label class="kid-field-label" for="eq-rest">{{ t('rest') }}</label>
        <input
          id="eq-rest"
          v-model="rest"
          class="kid-input"
          type="number"
          inputmode="numeric"
          placeholder="?"
          :disabled="round.out"
          @keyup.enter="check"
        />
      </div>
    </div>

    <template #action>
      <button class="kid-btn kid-btn-primary" :disabled="round.out" @click="check">
        <Check :size="20" /> {{ t('check') }}
      </button>
    </template>
  </GameCard>
</template>
