<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Lightbulb } from 'lucide-vue-next'
import MathParts from '@/components/MathParts.vue'
import { GAMES } from '@/data/games'
import { gameOffered } from '@/data/classes'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'
import { TRICK_ROWS } from '@/data/theory'

// the desktop board's default pick
const a = ref(7)
const b = ref(8)
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// rows easy enough that their trick is worth showing even when picked as the
// other factor (so 7 x 10 reads the times-10 trick, not nothing)
const EASY = [1, 10]

// desktop picks a cell, the phone chips pick a row; one component covers both
function pick(row, col) {
  a.value = row
  b.value = col
}

// on = the picked cell, twin = the swapped pair (b x a), line = its row and
// column, diag = the square numbers
function cellClass(row, col) {
  if (row === a.value && col === b.value) return 'on'
  if (row === b.value && col === a.value && a.value !== b.value) return 'twin'
  if (row === a.value || col === b.value) return 'line'
  return row === col ? 'diag' : 'flat'
}

const product = computed(() => a.value * b.value)
// which row's trick to tell, and which number to feed it: swap to the easier
// row when the picked row has no tip of its own, otherwise use the pick as is
const trickPick = computed(() => {
  if (EASY.includes(b.value) && !EASY.includes(a.value)) return { row: b.value, n: a.value, swapped: true }
  if (TRICK_ROWS.includes(a.value)) return { row: a.value, n: b.value, swapped: false }
  return null
})
// the numbers a trick sentence may use: the fed number, the product, and the
// stepping stones on the way to it (five times, ten times)
const trick = computed(() => {
  const pick = trickPick.value
  if (!pick) return null
  const { row, n, swapped } = pick
  const vars = { b: n, p: a.value * b.value, f: 5 * n, t: 10 * n }
  const sentence = tp('th_trick' + row, n, vars)
  return swapped ? `${tp('th_trickSwap', a.value, { a: a.value, b: b.value })} ${sentence}` : sentence
})
const repeated = computed(() => Array.from({ length: a.value }, () => b.value))
// the table teaches multiplying, so its button goes where that is practised
const practise = computed(() => {
  const game = GAMES.find((g) => g.id === 'multiply')
  return gameOffered(game.id, classConfig.value) ? game.route : null
})
</script>

<template>
  <div class="kid-tcols">
    <div class="tab">
      <div class="kid-ttab" role="group" :aria-label="t('theoryTable')">
        <div class="row">
          <span class="corner" aria-hidden="true">×</span>
          <button
            v-for="c in NUMBERS"
            :key="'h' + c"
            type="button"
            class="head"
            :class="{ on: c === b, twin: c === a && a !== b }"
            :aria-pressed="c === b"
            @click="pick(a, c)"
          >{{ c }}</button>
        </div>
        <div v-for="r in NUMBERS" :key="r" class="row">
          <button
            type="button"
            class="head"
            :class="{ on: r === a, twin: r === b && a !== b }"
            :aria-pressed="r === a"
            @click="pick(r, b)"
          >{{ r }}</button>
          <button
            v-for="c in NUMBERS"
            :key="c"
            type="button"
            :class="cellClass(r, c)"
            :aria-label="tp('timesAria', r, { b: c, p: r * c })"
            :aria-pressed="r === a && c === b"
            @click="pick(r, c)"
          >{{ r * c }}</button>
        </div>
      </div>

      <div class="pick kid-phone-only">
        <p id="kid-pick-label" class="kid-tpick">{{ t('theoryPick') }}</p>
        <div class="kid-tchips" role="group" aria-labelledby="kid-pick-label">
          <button
            v-for="n in NUMBERS"
            :key="n"
            type="button"
            :aria-pressed="n === a"
            @click="pick(n, b)"
          >{{ n }}</button>
        </div>
      </div>
    </div>

    <div class="kid-panel kid-texp">
      <span class="kid-eyebrow">{{ t('theoryPicked') }}</span>
      <div class="kid-eq sm"><MathParts :parts="[a, '×', b, '=', product]" /></div>
      <div class="fact">
        <span class="lab">{{ t('theorySameAsAdd') }}</span>
        <span class="val">{{ repeated.join(' + ') }} = {{ product }}</span>
      </div>
      <div class="fact">
        <span class="lab">{{ t('theorySwap') }}</span>
        <span class="val">{{ b }} × {{ a }} = {{ product }}</span>
      </div>
      <p v-if="trick" class="kid-tip"><Lightbulb :size="18" aria-hidden="true" />{{ trick }}</p>
      <RouterLink v-if="practise" :to="practise" class="kid-btn kid-btn-primary">
        {{ t('th_mulAdd_cta') }}
      </RouterLink>
    </div>
  </div>
</template>
