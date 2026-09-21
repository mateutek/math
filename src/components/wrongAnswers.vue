<script setup>
import { tp } from '@/i18n'

defineProps({
  wrong: {
    type: Number,
    default: 0,
  },
  // how many wrong answers end the task; the row shows one dot per try
  max: {
    type: Number,
    default: 3,
  },
})
</script>

<template>
  <div class="kid-strikes" role="img" :aria-label="tp('strikesLabel', wrong, { max })">
    <span v-for="i in max" :key="i" class="dot" :class="{ hit: i - 1 < wrong }"></span>
  </div>
</template>
