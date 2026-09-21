<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from 'lucide-vue-next'
import GameCard from '@/components/GameCard.vue'
import MathParts from '@/components/MathParts.vue'
import { useRound } from '@/composables/useRound'
import { LEVELS, topicTask, parseAnswer, sameNumber, triesFor } from '@/games/topics'
import { GAMES } from '@/data/games'
import settings from '@/store/settings'
import { needed } from '@/store/village'
import { t } from '@/i18n'

// One page for the five topic games of classes 4 to 8. The route name is the
// topic id; its row in GAMES has the colours. App.vue keys the router view by
// route name, so every topic gets a page of its own.
const game = GAMES.find((g) => g.id === useRoute().name)

const task = ref(null)
const answer = ref('')
const answerInput = ref(null)
const level = computed(() => settings.topicLevel[game.id])

const focusAnswer = () => nextTick(() => answerInput.value?.focus())

// A pick of N tiles gets N - 1 tries: the last one would be the only tile
// left, so guessing would pay as well as knowing. Typed answers keep three.
const round = useRound(game.id, () => {
  task.value = topicTask(game.id, level.value)
  answer.value = ''
  if (task.value.kind === 'number') focusAnswer()
}, () => (task.value ? triesFor(task.value) : 3))

// a new level is a different game: the streak belonged to the old one
function setLevel(n) {
  if (n === level.value) return
  settings.topicLevel[game.id] = n
  round.restart()
}

// A right answer pays what the village needs most. The level multiplies it
// only on a first try: after a miss a two-tile pick is a sure thing.
function settle(right) {
  if (right) {
    round.correct(needed.value, false, round.strikes ? 1 : level.value)
    round.newTask()
  } else {
    round.wrong()
    if (task.value.kind === 'number') focusAnswer()
  }
}

function isRight(value) {
  return sameNumber(value, task.value.answer)
}

function check() {
  if (round.out) return
  const value = parseAnswer(answer.value)
  // empty, or not a number at all: a slip of the finger, not a wrong answer
  if (value !== null) settle(isRight(value))
}

function pickOption(i) {
  if (!round.out) settle(i === task.value.answer)
}

// a right value is taken the moment it is typed, no Enter needed; an empty
// field (the reset for a new task, or a slip of the finger) is never right
watch(answer, () => {
  if (!round.out && task.value.kind === 'number' && answer.value !== '') {
    const value = parseAnswer(answer.value)
    if (value !== null && isRight(value)) settle(true)
  }
})
</script>

<template>
  <GameCard :round="round" :title="t(game.id)" :color="game.color" :ink="game.ink" timed>
    <div class="kid-levels" role="group" :aria-label="t('levelLabel')">
      <button v-for="n in LEVELS" :key="n" type="button" :aria-pressed="n === level" @click="setLevel(n)">
        {{ t('lvl' + n) }}
      </button>
    </div>

    <p v-if="task.prompt" class="kid-prompt">{{ t(task.prompt) }}</p>
    <div v-if="task.parts.length" class="kid-eq">
      <MathParts :parts="task.parts" :reveal="task.kind === 'number' && round.out ? task.answer : null" />
    </div>

    <div v-if="task.kind === 'number'" class="kid-field">
      <label class="kid-field-label" for="topic-answer">{{ t('answer') }}</label>
      <!-- text, not number: a number field refuses the Polish decimal comma -->
      <input
        id="topic-answer"
        ref="answerInput"
        v-model="answer"
        class="kid-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="?"
        :disabled="round.out"
        @keyup.enter="check"
      />
    </div>
    <div v-else class="kid-tiles" :class="{ two: task.options.length !== 3 }">
      <button
        v-for="(option, i) in task.options"
        :key="i"
        class="kid-tile"
        :class="{ reveal: round.out && i === task.answer }"
        :disabled="round.out"
        @click="pickOption(i)"
      >
        <MathParts :parts="option" />
      </button>
    </div>

    <template v-if="task.kind === 'number'" #action>
      <button class="kid-btn kid-btn-primary" :disabled="round.out" @click="check">
        <Check :size="20" /> {{ t('check') }}
      </button>
    </template>
  </GameCard>
</template>
