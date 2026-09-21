<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { biggestRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const round = useRound('biggest', (cfg) => {
  task.value = biggestRound(cfg)
})

function pick(n) {
  if (round.out) return
  if (n !== task.value.answer) return round.wrong()
  round.correct('food')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    :title="t('biggest')"
    color="var(--k-op-div2)"
    timed
  >
    <p class="kid-prompt">{{ t(task.want === 'max' ? 'pickMax' : 'pickMin') }}</p>
    <div class="kid-tiles">
      <button
        v-for="n in task.numbers"
        :key="n"
        class="kid-tile"
        :class="{ reveal: round.out && n === task.answer }"
        :disabled="round.out"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
  </GameCard>
</template>
