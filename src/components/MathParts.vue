<script setup>
import { t } from '@/i18n'

const props = defineProps({
  // the tokens of src/games/topics.js
  parts: { type: Array, required: true },
  // the answer, put in the slot once the kid is out of tries; null until then
  reveal: { type: Number, default: null },
})

// Polish writes decimals with a comma
const fmt = (n) => String(n).replace('.', ',')
// any value that may be the '?' slot
const show = (x) => (x === '?' ? (props.reveal === null ? '?' : fmt(props.reveal)) : fmt(x))
const slot = (x) => ({ ans: x === '?', reveal: x === '?' && props.reveal !== null })
const sides = (s) => `a = ${show(s.a)}, b = ${show(s.b)}, c = ${show(s.c)}`
</script>

<template>
  <template v-for="(p, i) in parts" :key="i">
    <span v-if="typeof p === 'number' || p === '?'" :class="slot(p)">{{ show(p) }}</span>
    <span v-else-if="typeof p === 'string'" :class="{ op: p !== '=' }">{{ p }}</span>
    <span v-else-if="p.t" class="word">{{ t(p.t) }}</span>
    <span v-else-if="p.frac" class="kid-frac" role="img" :aria-label="show(p.frac[0]) + '/' + show(p.frac[1])">
      <span :class="slot(p.frac[0])">{{ show(p.frac[0]) }}</span>
      <span :class="slot(p.frac[1])">{{ show(p.frac[1]) }}</span>
    </span>
    <span v-else-if="p.pow" role="img" :aria-label="show(p.pow[0]) + '^' + show(p.pow[1])">{{ show(p.pow[0]) }}<sup :class="slot(p.pow[1])">{{ show(p.pow[1]) }}</sup></span>
    <span v-else-if="p.root !== undefined" class="kid-sqrt">√<span>{{ show(p.root) }}</span></span>
    <span v-else-if="p.pct !== undefined"><span :class="slot(p.pct)">{{ show(p.pct) }}</span>%</span>
    <!-- not to scale: one fixed right triangle, legs a and b, hypotenuse c -->
    <svg v-else-if="p.triangle" class="kid-tri" viewBox="0 0 150 100" role="img" :aria-label="sides(p.triangle)">
      <polygon points="34,80 130,80 34,14" />
      <polyline points="34,69 45,69 45,80" />
      <text x="27" y="52" text-anchor="end" :class="slot(p.triangle.a)">{{ show(p.triangle.a) }}</text>
      <text x="82" y="97" text-anchor="middle" :class="slot(p.triangle.b)">{{ show(p.triangle.b) }}</text>
      <text x="88" y="42" text-anchor="start" :class="slot(p.triangle.c)">{{ show(p.triangle.c) }}</text>
    </svg>
  </template>
</template>
