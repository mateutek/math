<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { compareRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const round = useRound('compare', (cfg) => {
  task.value = compareRound(cfg)
})

function pick(sign) {
  if (round.strikes === 3) return
  if (sign !== task.value.answer) return round.wrong()
  round.correct('food')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    game="compare"
    :title="t('compare')"
    color="var(--k-op-div2)"
    timed
  >
    <p class="kid-prompt">{{ t('comparePrompt') }}</p>
    <div class="kid-eq sm">
      <span>{{ task.left.text }}</span>
      <span class="ans" :class="{ reveal: round.strikes === 3 }">
        {{ round.strikes === 3 ? task.answer : '?' }}
      </span>
      <span>{{ task.right.text }}</span>
    </div>
    <div class="kid-tiles">
      <button
        v-for="sign in ['<', '=', '>']"
        :key="sign"
        class="kid-tile"
        :disabled="round.strikes === 3"
        @click="pick(sign)"
      >
        {{ sign }}
      </button>
    </div>
  </GameCard>
</template>
