<script setup>
// Soft white gusts that curl across the map now and then. Pure CSS animation;
// the only JS is a timer that adds a gust and an animationend that removes it.
import { ref, onMounted, onUnmounted } from 'vue'

// left-to-right lines in a 200 x 60 box, each with one or two curls
const PATHS = [
  'M2 42 C40 42 70 34 100 34 C128 34 138 14 122 9 C108 5 102 24 126 27 C150 30 172 26 198 18',
  'M2 24 C30 24 52 30 74 26 C92 22 90 8 78 10 C66 12 72 30 96 34 C120 38 130 22 148 18 C162 14 176 18 198 36',
  'M2 36 C26 30 46 14 62 20 C74 25 66 40 54 34 C44 28 56 12 84 14 C116 16 140 40 168 38 C180 37 190 32 198 26',
]
const MAX = 3

const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const gusts = ref([])
let id = 0
let timer = 0

function blow() {
  // a hidden tab never plays the animation, so gusts would pile up for the return
  if (!document.hidden && gusts.value.length < MAX) {
    gusts.value.push({
      id: id++,
      d: PATHS[Math.floor(Math.random() * PATHS.length)],
      flip: Math.random() < 0.5, // mirrored so the line reads the other way up
      style: {
        left: `${Math.random() * 75}%`,
        top: `${Math.random() * 85}%`,
        width: `${15 + Math.random() * 10}%`,
      },
    })
  }
  timer = setTimeout(blow, 1500 + Math.random() * 2500)
}

const drop = (g) => (gusts.value = gusts.value.filter((x) => x !== g))

onMounted(() => {
  if (!still) timer = setTimeout(blow, 1500 + Math.random() * 2500)
})
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="kid-wind" aria-hidden="true">
    <svg
      v-for="g in gusts"
      :key="g.id"
      viewBox="0 0 200 60"
      :class="{ flip: g.flip }"
      :style="g.style"
      @animationend="drop(g)"
    >
      <path :d="g.d" pathLength="1" />
    </svg>
  </div>
</template>
