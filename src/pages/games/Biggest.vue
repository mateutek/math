<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { biggestRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const round = useRound('biggest', (level) => {
  task.value = biggestRound(level)
})

function pick(n) {
  if (round.strikes === 3) return
  if (n !== task.value.answer) return round.wrong()
  round.correct('food')
  round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/najwieksza"
    color="var(--k-op-div2)"
    :ranges="['1-50', '1-200', '1-1000']"
    timed
  >
    <p class="kid-prompt">{{ t(task.want === 'max' ? 'pickMax' : 'pickMin') }}</p>
    <div class="kid-tiles">
      <button
        v-for="n in task.numbers"
        :key="n"
        class="kid-tile"
        :class="{ reveal: round.strikes === 3 && n === task.answer }"
        :disabled="round.strikes === 3"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
  </GameCard>
</template>
