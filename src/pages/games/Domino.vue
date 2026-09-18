<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { dominoRound } from '@/games/generators'
import { t } from '@/i18n'

// which of the 9 cells in a 3x3 half hold a pip, per number
const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]]

const task = ref(null)
const round = useRound('domino', (cfg) => {
  task.value = dominoRound(cfg)
})

const isAnswer = (o) => o[0] + o[1] === task.value.total

function pick(o) {
  if (round.strikes === 3) return
  if (!isAnswer(o)) return round.wrong()
  round.correct('wood')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    game="domino"
    :title="t('domino')"
    color="var(--k-op-add)"
    ink="var(--k-ink-add, #15803d)"
    timed
  >
    <p class="kid-prompt">{{ t('dominoPrompt') }}</p>
    <div class="kid-eq">
      <span>{{ task.a }}</span><span class="op">+</span><span>{{ task.b }}</span>
    </div>
    <div class="kid-tiles two">
      <button
        v-for="(o, i) in task.options"
        :key="i"
        class="kid-tile kid-domino"
        :class="{ reveal: round.strikes === 3 && isAnswer(o) }"
        :aria-label="`${o[0]} | ${o[1]}`"
        :disabled="round.strikes === 3"
        @click="pick(o)"
      >
        <span class="bone">
          <span v-for="(n, h) in o" :key="h" class="half">
            <i v-for="c in 9" :key="c" :class="{ pip: PIPS[n].includes(c - 1) }" />
          </span>
        </span>
      </button>
    </div>
  </GameCard>
</template>
