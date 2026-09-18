<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { ascendingRound } from '@/games/generators'
import { t } from '@/i18n'

const task = ref(null)
const done = ref([])

const round = useRound('ascending', (level) => {
  task.value = ascendingRound(level)
  done.value = []
})

function pick(n) {
  if (round.strikes === 3) return
  if (n !== task.value.sorted[done.value.length]) return round.wrong()
  done.value = [...done.value, n]
  if (done.value.length === task.value.sorted.length) {
    round.correct('food')
    round.newTask()
  }
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/rosnaco"
    :title="t('ascending')"
    color="var(--k-op-div2)"
    :ranges="['1-50', '1-200', '1-1000']"
    timed
  >
    <p class="kid-prompt">{{ t('ascendingPrompt') }}</p>
    <div class="kid-tiles">
      <button
        v-for="n in task.numbers"
        :key="n"
        class="kid-tile"
        :class="{ done: done.includes(n) }"
        :disabled="done.includes(n) || round.strikes === 3"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
    <p class="kid-trail" :class="{ reveal: round.strikes === 3 }">
      {{ (round.strikes === 3 ? task.sorted : done).join(' < ') }}
    </p>
  </GameCard>
</template>
