<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { percentsPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Percents: p cells of a hundred, and what p % of a base comes to.
const { values: v, bump, edge } = useExplore('percents')
const pic = computed(() => percentsPicture(v.value))
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="pic.vars.p" :text="`${pic.vars.p}%`" :name="t('ex_percent')" caption v-bind="edge('p5')" @step="bump('p5', $event)" />
      <span class="op">{{ t('of') }}</span>
      <NumStepper :value="pic.vars.base" :name="t('ex_base')" caption v-bind="edge('b')" @step="bump('b', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
  </section>

  <section class="kid-panel">
    <h2>{{ t('ex_pctGridH') }}</h2>
    <div class="kid-hgrid row" aria-hidden="true"><span v-for="(on, i) in pic.grid" :key="i" :class="{ on }"></span></div>
    <div class="kid-eq sm"><MathParts :parts="pic.frac" /></div>
    <p>{{ tp('ex_pctGrid', 0, pic.vars) }}</p>
  </section>

  <section class="kid-panel">
    <h2>{{ t('ex_pctOfH') }}</h2>
    <div class="kid-pctbar" aria-hidden="true">
      <span class="part" :style="{ width: pic.vars.p + '%' }">{{ pic.vars.part }}</span>
    </div>
    <div class="kid-pctscale" aria-hidden="true"><span>0</span><span>{{ pic.vars.base }}</span></div>
    <p>{{ tp('ex_pctOf', 0, pic.vars) }}</p>
  </section>
</template>
