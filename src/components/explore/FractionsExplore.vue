<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { fractionsPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Fractions: pick n of d and see the part; scale both by k and see the same
// part cut finer.
const { values: v, bump, edge } = useExplore('fractions')
const pic = computed(() => fractionsPicture(v.value))
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.n" :name="t('ex_numerator')" caption v-bind="edge('n')" @step="bump('n', $event)" />
      <span class="op">/</span>
      <NumStepper :value="v.d" :name="t('ex_denominator')" caption v-bind="edge('d')" @step="bump('d', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="[{ frac: [v.n, v.d] }]" /></div>
  </section>

  <section class="kid-panel">
    <h2>{{ t('ex_fracPartH') }}</h2>
    <div class="kid-strip" aria-hidden="true"><span v-for="(on, i) in pic.bar" :key="i" :class="{ on }"></span></div>
    <p>{{ tp('ex_fracPart', 0, pic.vars) }}</p>
  </section>

  <section class="kid-panel">
    <div class="kid-ophead">
      <h2>{{ t('ex_fracEqH') }}</h2>
      <NumStepper :value="v.k" :text="`× ${v.k}`" :name="t('ex_times')" small v-bind="edge('k')" @step="bump('k', $event)" />
    </div>
    <div class="kid-strip" aria-hidden="true"><span v-for="(on, i) in pic.bar" :key="i" :class="{ on }"></span></div>
    <div class="kid-strip thin" aria-hidden="true"><span v-for="(on, i) in pic.scaled" :key="i" :class="{ on }"></span></div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
    <p>{{ tp('ex_fracEq', 0, pic.vars) }}</p>
  </section>
</template>
