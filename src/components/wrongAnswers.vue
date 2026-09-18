<script setup>
import { tp } from '@/i18n'

defineProps({
  wrong: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="kid-strikes" role="img" :aria-label="tp('strikesLabel', wrong)">
    <span v-for="i in 3" :key="i" class="dot" :class="{ hit: i - 1 < wrong }"></span>
  </div>
</template>
