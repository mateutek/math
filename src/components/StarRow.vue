<script setup>
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'

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
  <div class="kid-streak" :title="`Seria: ${streak}`">
    <span
      v-for="i in FULL_STREAK_STARS"
      :key="i"
      class="star"
      :class="{
        on: i - 1 < filled,
        pop: justWon && i - 1 === filled - 1,
      }"
    >
      <Star
        :size="19"
        :stroke-width="2"
        :style="{ fill: i - 1 < filled ? 'currentColor' : 'none' }"
      />
    </span>
  </div>
</template>
