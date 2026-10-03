<script setup>
import { computed } from 'vue'
import { t } from '@/i18n'

const props = defineProps({
  // the tokens of src/games/topics.js
  parts: { type: Array, required: true },
  // the answer, put in the slot once the kid is out of tries (or on a printed
  // answer key, where compare's is a sign); null until then. A list fills a
  // task with several top-level slots (17 ÷ 5 = ? r ?), one value each.
  reveal: { type: [Number, String, Array], default: null },
})

// Polish writes decimals with a comma
// and a real minus sign, not a hyphen
const fmt = (n) => String(n).replace('.', ',').replace('-', '−')
// 3x, x for 1x
const xTerm = (k) => (k === 1 ? '' : fmt(k)) + 'x'
// any value that may be the '?' slot
// i is the token's index, for picking its value out of a list reveal
const show = (x, i) => {
  if (x !== '?') return fmt(x)
  if (props.reveal === null) return '?'
  return fmt(Array.isArray(props.reveal) ? props.reveal[nth.value[i]] : props.reveal)
}
// which top-level slot each token is: 0, 1, ... for '?', null otherwise
const nth = computed(() => {
  let k = 0
  return props.parts.map((p) => (p === '?' ? k++ : null))
})
const slot = (x) => ({ ans: x === '?', reveal: x === '?' && props.reveal !== null })
const sides = (s) => `a = ${show(s.a)}, b = ${show(s.b)}, c = ${show(s.c)}`
</script>

<template>
  <template v-for="(p, i) in parts" :key="i">
    <span v-if="typeof p === 'number' || p === '?'" :class="slot(p)">{{ show(p, i) }}</span>
    <span v-else-if="typeof p === 'string'" :class="p === '(' || p === ')' ? 'paren' : { op: p !== '=' }">{{ p }}</span>
    <span v-else-if="p.t" class="word">{{ t(p.t) }}</span>
    <span v-else-if="p.frac" class="kid-frac" role="img" :aria-label="show(p.frac[0]) + '/' + show(p.frac[1])">
      <span :class="slot(p.frac[0])">{{ show(p.frac[0]) }}</span>
      <span :class="slot(p.frac[1])">{{ show(p.frac[1]) }}</span>
    </span>
    <span v-else-if="p.pow" role="img" :aria-label="show(p.pow[0]) + '^' + show(p.pow[1])">{{ show(p.pow[0]) }}<sup :class="slot(p.pow[1])">{{ show(p.pow[1]) }}</sup></span>
    <span v-else-if="p.root !== undefined" class="kid-sqrt">√<span>{{ show(p.root) }}</span></span>
    <span v-else-if="p.pct !== undefined"><span :class="slot(p.pct)">{{ show(p.pct) }}</span>%</span>
    <span v-else-if="p.x !== undefined" class="var">{{ xTerm(p.x) }}</span>
    <!-- a semicolon between the numbers: the comma is the decimal point -->
    <span v-else-if="p.mean" class="kid-mean" role="img" :aria-label="t('meanOf') + ' ' + p.mean.map((v) => show(v)).join('; ')">
      <span class="word">{{ t('meanOf') }}</span>(<template v-for="(v, j) in p.mean" :key="j"><span :class="slot(v)">{{ show(v) }}</span><template v-if="j < p.mean.length - 1">; </template></template>)
    </span>
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
