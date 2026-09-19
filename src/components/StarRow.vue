<script setup>
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { STARS_PER_COIN as FULL_STREAK_STARS } from '@/composables/useRound'
import { tp } from '@/i18n'

const props = defineProps({
  streak: {
    type: Number,
    default: 0,
  },
  justWon: {
    type: Boolean,
    default: false,
  },
})

// A full row is spent on a coin: it shows while the win still flashes, then
// the row starts again from empty.
const filled = computed(() => {
  const left = props.streak % FULL_STREAK_STARS
  return left === 0 && props.streak > 0 && props.justWon ? FULL_STREAK_STARS : left
})
</script>

<template>
  <div class="kid-streak" role="img" :aria-label="tp('streakLabel', streak)">
    <span
      v-for="i in FULL_STREAK_STARS"
      :key="i"
      class="star"
      :class="{
        on: i - 1 < filled,
        pop: justWon && i - 1 === filled - 1,
      }"
    >
      <Star :size="22" :stroke-width="0" :style="{ fill: 'currentColor' }" />
    </span>
  </div>
</template>
