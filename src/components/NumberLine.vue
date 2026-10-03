<script setup>
import { computed } from 'vue'

// A number line from src/data/opPictures.js: ticks, a dot where the sum
// starts and one where it has got to, and the jumps between, each an arc
// with its +n or −n. A jump the step has not reached is drawn faint.
const props = defineProps({
  line: { type: Object, required: true },
})

const W = 314
const BASE = 64

const view = computed(() => {
  const { lo, hi } = props.line
  const x = (n) => 12 + (n - lo) * ((W - 24) / Math.max(1, hi - lo))
  return {
    ticks: props.line.ticks.map((t) => ({ ...t, x: x(t.n) })),
    // many short jumps cannot each carry a label: the first one says it for all
    jumps: props.line.jumps.map((j, i, all) => {
      const x1 = x(j.from)
      const x2 = x(j.to)
      // a longer jump rises higher, within what the box has room for
      const h = Math.min(30, Math.max(12, Math.abs(x2 - x1) * 0.35))
      const label = all.length > 5 && i > 0 ? '' : j.label
      return { ...j, label, d: `M ${x1} ${BASE} Q ${(x1 + x2) / 2} ${BASE - 2 * h} ${x2} ${BASE}`, lx: (x1 + x2) / 2, ly: BASE - h - 7 }
    }),
    start: x(props.line.start),
    end: x(props.line.end),
    moved: props.line.end !== props.line.start,
  }
})
</script>

<template>
  <svg class="kid-nline" :viewBox="`0 0 ${W} 96`" aria-hidden="true">
    <line x1="2" :y1="BASE" :x2="W - 2" :y2="BASE" class="axis" />
    <template v-for="(t, i) in view.ticks" :key="'t' + i">
      <line :x1="t.x" :y1="BASE - 5" :x2="t.x" :y2="BASE + 5" class="axis" />
      <text :x="t.x" :y="BASE + 22" :class="{ key: t.key }">{{ t.n }}</text>
    </template>
    <template v-for="(j, i) in view.jumps" :key="'j' + i">
      <path :d="j.d" class="jump" :class="{ off: !j.on }" />
      <text :x="j.lx" :y="j.ly" class="jlab" :class="{ off: !j.on }">{{ j.label }}</text>
    </template>
    <circle :cx="view.start" :cy="BASE" r="7" class="start" />
    <circle v-if="view.moved" :cx="view.end" :cy="BASE" r="7" class="end" />
  </svg>
</template>
