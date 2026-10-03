<script setup>
import { computed } from 'vue'
import NumStepper from '@/components/NumStepper.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import { useExplore } from '@/composables/useExplore'
import { quadsPicture } from '@/data/topicPictures'
import { t } from '@/i18n'

// Quadrilaterals: step through the five and read what makes each one.
const { values: v, bump, edge } = useExplore('quads')
const pic = computed(() => quadsPicture(v.value))
// what makes each one, by its name
const NOTES = { square: 'ex_quad_square', rect: 'ex_quad_rect', rhombus: 'ex_quad_rhombus', para: 'ex_quad_para', trap: 'ex_quad_trap' }
</script>

<template>
  <section class="kid-panel wide">
    <div class="kid-ophead">
      <h2 class="kid-cap">{{ t('geo_' + pic.name) }}</h2>
      <NumStepper :value="v.s" :text="`${v.s + 1} / 5`" :name="t('ex_shape')" small v-bind="edge('s')" @step="bump('s', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.fig" /></div>
    <p>{{ t(NOTES[pic.name]) }}</p>
  </section>
</template>
