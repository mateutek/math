<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { tilesRound } from '@/games/generators'
import { t } from '@/i18n'

const exprs = ref([])
const results = ref([])
const picked = ref(null)
const done = ref(new Set())
const clean = ref(true)

const round = useRound('tiles', (level) => {
  const board = tilesRound(level)
  exprs.value = board.exprs
  results.value = board.results
  picked.value = null
  done.value = new Set()
  clean.value = true
  return board.exprs.length // one point per pair
})

function pickResult(value) {
  const e = picked.value
  if (!e || round.strikes === 3) return
  picked.value = null
  if (e.result !== value) {
    clean.value = false
    return round.wrong()
  }
  // results are unique within a board, so the value identifies the pair
  done.value = new Set(done.value).add(value)
  const last = done.value.size === exprs.value.length
  round.correct(e.material, last && clean.value)
  if (last) round.newTask()
}
</script>

<template>
  <GameCard
    :round="round"
    base="/gry/kafelki"
    :title="t('tiles')"
    color="var(--k-op-mul)"
    :ranges="['+ −', '+ − ×', '+ − × ÷']"
  >
    <p class="kid-prompt">{{ t('tilesPrompt') }}</p>
    <div class="kid-tiles">
      <button
        v-for="e in exprs"
        :key="e.text"
        class="kid-tile"
        :class="{ on: picked === e, done: done.has(e.result) }"
        :aria-pressed="picked === e"
        :disabled="done.has(e.result) || round.strikes === 3"
        @click="picked = e"
      >
        {{ e.text }}
      </button>
    </div>
    <div class="kid-split" aria-hidden="true"></div>
    <div class="kid-tiles six">
      <button
        v-for="r in results"
        :key="r"
        class="kid-tile res"
        :class="{ done: done.has(r) }"
        :disabled="done.has(r) || !picked || round.strikes === 3"
        @click="pickResult(r)"
      >
        {{ r }}
      </button>
    </div>
  </GameCard>
</template>
