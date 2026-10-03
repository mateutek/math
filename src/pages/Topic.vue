<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from 'lucide-vue-next'
import GameCard from '@/components/GameCard.vue'
import MathParts from '@/components/MathParts.vue'
import { useRound } from '@/composables/useRound'
import { LEVELS, topicTask, parseAnswer, sameNumber, triesFor } from '@/games/topics'
import { storyText } from '@/games/wordProblems'
import { GAMES } from '@/data/games'
import settings from '@/store/settings'
import { needed } from '@/store/village'
import { t } from '@/i18n'

// One page for the topic games of classes 4 to 8. The route name is the
// topic id; its row in GAMES has the colours. App.vue keys the router view by
// route name, so every topic gets a page of its own.
const game = GAMES.find((g) => g.id === useRoute().name)

const task = ref(null)
const answer = ref('')
const answerInput = ref(null)
const level = computed(() => settings.topicLevel[game.id])

// a long equation (x on both sides) steps down a size to fit a phone, and so
// does any mean: "średnia(48; 159; 66)" is long even with three numbers
const long = computed(() => task.value.parts.some((p) => p?.mean) || task.value.parts.length > 7)

const focusAnswer = () => nextTick(() => answerInput.value?.focus())

// A pick of N tiles gets N - 1 tries: the last one would be the only tile
// left, so guessing would pay as well as knowing. Typed answers keep three.
const round = useRound(game.id, () => {
  task.value = topicTask(game.id, level.value, settings.schoolClass)
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
// only on a first try: after a miss a two-tile pick is a sure thing. A word
// problem takes longer to read, so above the easy level it pays one more.
function settle(right) {
  if (right) {
    const times = level.value + (task.value.story && level.value > 1 ? 1 : 0)
    round.correct(needed.value, false, round.strikes ? 1 : times)
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

function flipSign() {
  answer.value = /^[-−]/.test(answer.value) ? answer.value.slice(1) : '−' + answer.value
  focusAnswer()
}

function pickOption(i) {
  if (!round.out) settle(i === task.value.answer)
}
</script>

<template>
  <GameCard :round="round" :title="t(game.id)" :color="game.color" :ink="game.ink" timed>
    <div class="kid-levels" role="group" :aria-label="t('levelLabel')">
      <button v-for="n in LEVELS" :key="n" type="button" :aria-pressed="n === level" @click="setLevel(n)">
        {{ t('lvl' + n) }}
      </button>
    </div>

    <p v-if="task.prompt" class="kid-prompt">{{ t(task.prompt) }}</p>
    <!-- a word problem: the sentence is made in the language on screen -->
    <p v-if="task.story" class="kid-story">{{ storyText(task, settings.lang) }}</p>
    <div v-if="task.parts.length" class="kid-eq" :class="{ sm: long }">
      <MathParts :parts="task.parts" :reveal="task.kind === 'number' && round.out ? task.answer : null" />
    </div>

    <div v-if="task.kind === 'number'" class="kid-field">
      <label class="kid-field-label" for="topic-answer">{{ t('answer') }}</label>
      <!-- text, not number: a number field refuses the Polish decimal comma -->
      <div class="kid-signed">
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
        <!-- the unit of a word problem's answer, so it is never typed -->
        <span v-if="task.unit" class="kid-unit">{{ task.unit }}</span>
        <!-- a phone's number pad has no minus, so topics with signs bring one;
             it is there for every task of the topic, so it gives no sign away -->
        <button v-if="game.signed" type="button" class="kid-btn kid-btn-ghost" :disabled="round.out" :aria-label="t('signToggle')" @click="flipSign">±</button>
      </div>
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
