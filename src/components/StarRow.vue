<script setup>
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { tp } from '@/i18n'

const FULL_STREAK_STARS = 5

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

const filled = computed(() => Math.min(props.streak, FULL_STREAK_STARS))
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
