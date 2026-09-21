<script setup>
import { ref } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { useRound } from '@/composables/useRound'
import { tilesRound } from '@/games/generators'
import { t } from '@/i18n'

const exprs = ref([])
const results = ref([])
// one tile may be held on each side, picked in either order
const picked = ref(null) // an expression
const pickedValue = ref(null) // a result
const done = ref(new Set())
const clean = ref(true)

const round = useRound('tiles', (cfg) => {
  const board = tilesRound(cfg)
  exprs.value = board.exprs
  results.value = board.results
  picked.value = null
  pickedValue.value = null
  done.value = new Set()
  clean.value = true
  return board.exprs.length // one point per pair
})

// tapping a held tile again lets go of it; the second side settles the pair
function pickExpr(e) {
  picked.value = picked.value === e ? null : e
  settle()
}

function pickResult(value) {
  pickedValue.value = pickedValue.value === value ? null : value
  settle()
}

function settle() {
  const e = picked.value
  const value = pickedValue.value
  if (!e || value === null || round.out) return
  picked.value = null
  pickedValue.value = null
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
    :title="t('tiles')"
    color="var(--k-op-mul)"
  >
    <p class="kid-prompt">{{ t('tilesPrompt') }}</p>
    <div class="kid-tiles">
      <button
        v-for="e in exprs"
        :key="e.text"
        class="kid-tile"
        :class="{ on: picked === e, done: done.has(e.result) }"
        :aria-pressed="picked === e"
        :disabled="done.has(e.result) || round.out"
        @click="pickExpr(e)"
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
        :class="{ on: pickedValue === r, done: done.has(r) }"
        :aria-pressed="pickedValue === r"
        :disabled="done.has(r) || round.out"
        @click="pickResult(r)"
      >
        {{ r }}
      </button>
    </div>
  </GameCard>
</template>
