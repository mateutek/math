<script setup>
import { XCircle, Circle } from 'lucide-vue-next'

defineProps({
  wrong: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <template v-for="n in 3" :key="n">
      <XCircle v-if="n - 1 < wrong" class="text-red-500" />
      <Circle v-else class="text-muted-foreground" />
    </template>
  </div>
</template>
