<script setup>
import { CircleX, Circle } from 'lucide-vue-next'

defineProps({
  wrong: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="kid-strikes">
    <template v-for="i in 3" :key="i">
      <CircleX
        v-if="i - 1 < wrong"
        :size="22"
        :style="{ color: 'var(--k-wrong)' }"
      />
      <Circle
        v-else
        :size="22"
        :style="{ color: 'var(--k-card-border)' }"
      />
    </template>
  </div>
</template>
