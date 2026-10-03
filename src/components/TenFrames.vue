<script setup>
// Two ten-frames from src/data/opPictures.js: 20 cells, each 'start',
// 'added', 'gone' (crossed out) or 'empty'. The parent sets the colours
// through --start and --added on an ancestor.
defineProps({
  cells: { type: Array, required: true },
})
</script>

<template>
  <div class="kid-frames" aria-hidden="true">
    <div v-for="f in [0, 1]" :key="f" class="frame">
      <span v-for="(c, i) in cells.slice(f * 10, f * 10 + 10)" :key="i" :class="c">{{ c === 'gone' ? '×' : '' }}</span>
    </div>
  </div>
</template>
