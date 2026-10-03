<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { pythagorasPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Pythagoras: a right triangle with a square on each side; the two small
// squares together are as big as the one on the long side.
const { values: v, bump, edge } = useExplore('pythagoras')
const pic = computed(() => pythagorasPicture(v.value))

// Model units, y up: the right angle at O, leg a along x, leg b up y; the
// squares on a and b hang outside the triangle, the one on c leans out.
const view = computed(() => {
  const { a, b } = pic.value
  const pts = {
    O: [0, 0], A: [a, 0], B: [0, b],
    a1: [a, -a], a2: [0, -a],
    b1: [-b, b], b2: [-b, 0],
    c1: [b, b + a], c2: [a + b, a],
  }
  const xs = Object.values(pts).map((p) => p[0])
  const ys = Object.values(pts).map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const s = 280 / Math.max(x1 - x0, y1 - y0)
  const P = (n) => [10 + (pts[n][0] - x0) * s, 10 + (y1 - pts[n][1]) * s]
  const poly = (...ns) => ns.map((n) => P(n).join(',')).join(' ')
  const mid = (...ns) => ns.reduce((m, n) => [m[0] + P(n)[0] / ns.length, m[1] + P(n)[1] / ns.length], [0, 0])
  return {
    w: (x1 - x0) * s + 20,
    h: (y1 - y0) * s + 20,
    tri: poly('O', 'A', 'B'),
    sqA: poly('O', 'A', 'a1', 'a2'),
    sqB: poly('O', 'B', 'b1', 'b2'),
    sqC: poly('A', 'c2', 'c1', 'B'),
    la: mid('O', 'A', 'a1', 'a2'),
    lb: mid('O', 'B', 'b1', 'b2'),
    lc: mid('A', 'c2', 'c1', 'B'),
  }
})
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.i" :text="`${pic.a}, ${pic.b}, ${pic.c}`" :name="t('ex_triangle')" caption v-bind="edge('i')" @step="bump('i', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_pySquaresH') }}</h2>
    <svg class="kid-pyth" :viewBox="`0 0 ${view.w} ${view.h}`" role="img" :aria-label="tp('ex_pySquares', 0, pic.vars)">
      <polygon :points="view.sqA" class="sa" />
      <polygon :points="view.sqB" class="sb" />
      <polygon :points="view.sqC" class="sc" />
      <polygon :points="view.tri" class="tri" />
      <text :x="view.la[0]" :y="view.la[1]">{{ pic.vars.aa }}</text>
      <text :x="view.lb[0]" :y="view.lb[1]">{{ pic.vars.bb }}</text>
      <text :x="view.lc[0]" :y="view.lc[1]">{{ pic.vars.cc }}</text>
    </svg>
    <p>{{ tp('ex_pySquares', 0, pic.vars) }}</p>
  </section>
</template>
