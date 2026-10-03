<script setup>
import { ref, computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { orderPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// The order of operations: p + q × r worked out with and without brackets,
// side by side, so the two results can differ in front of the kid.
const { values: v, bump, edge } = useExplore('order')
const plain = computed(() => orderPicture(v.value, false))
const bracketed = computed(() => orderPicture(v.value, true))
const show = ref(true)
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.p" name="p" v-bind="edge('p')" @step="bump('p', $event)" />
      <span class="op">+</span>
      <NumStepper :value="v.q" name="q" v-bind="edge('q')" @step="bump('q', $event)" />
      <span class="op">×</span>
      <NumStepper :value="v.r" name="r" v-bind="edge('r')" @step="bump('r', $event)" />
    </div>
  </section>

  <section class="kid-panel">
    <h2>{{ t('ex_ordPlainH') }}</h2>
    <div class="kid-eq sm"><MathParts :parts="plain.eq" /></div>
    <p>{{ tp('ex_ordPlain', 0, { q: v.q, r: v.r, qr: v.q * v.r }) }}</p>
  </section>

  <section class="kid-panel">
    <div class="kid-ophead">
      <h2>{{ t('ex_ordBracketH') }}</h2>
      <button type="button" class="kid-crumb" :aria-pressed="show" @click="show = !show">( )</button>
    </div>
    <div class="kid-eq sm"><MathParts :parts="show ? bracketed.eq : plain.eq" /></div>
    <p>{{ show ? tp('ex_ordBracket', 0, { p: v.p, q: v.q, pq: v.p + v.q }) : t('ex_ordNoBracket') }}</p>
  </section>
</template>
