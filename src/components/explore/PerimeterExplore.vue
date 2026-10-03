<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import { useExplore } from '@/composables/useExplore'
import { perimeterPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Perimeter: a rectangle whose sides the kid sets, walked round once.
const { values: v, bump, edge } = useExplore('perimeter')
const pic = computed(() => perimeterPicture(v.value))
</script>

<template>
  <section class="kid-panel wide">
    <h2>{{ t('th_perimeter_h1') }}</h2>
    <div class="nums kid-opnums">
      <NumStepper :value="v.a" :text="`${v.a} cm`" :name="t('ex_length')" caption small v-bind="edge('a')" @step="bump('a', $event)" />
      <NumStepper :value="v.b" :text="`${v.b} cm`" :name="t('ex_width')" caption small v-bind="edge('b')" @step="bump('b', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.fig" /></div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
    <p>{{ tp(v.a === v.b ? 'ex_perSquare' : 'ex_perRect', 0, pic.vars) }}</p>
  </section>
</template>
