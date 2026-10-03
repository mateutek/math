<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import { useExplore } from '@/composables/useExplore'
import { anglesPicture } from '@/data/topicPictures'
import { angleKind } from '@/games/geometry'
import { t, tp } from '@/i18n'

// Angles: open any angle and see what kind it is; tilt a line and watch the
// angle beside it and the one opposite.
const { values: v, bump, edge } = useExplore('angles')
const pic = computed(() => anglesPicture(v.value))
// what each kind of angle is, by its name
const KINDS = { acute: 'ex_angAcute', right: 'ex_angRight', obtuse: 'ex_angObtuse', straight: 'ex_angStraight', reflex: 'ex_angReflex' }
const kind = computed(() => KINDS[angleKind(pic.value.deg)])
</script>

<template>
  <section class="kid-panel">
    <div class="kid-ophead">
      <h2>{{ t('th_angles_h1') }}</h2>
      <NumStepper :value="pic.deg" :text="`${pic.deg}°`" :name="t('ex_angle')" small v-bind="edge('k')" @step="bump('k', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.angle" /></div>
    <p class="kid-opbig">{{ t(kind) }}</p>
  </section>

  <section class="kid-panel">
    <div class="kid-ophead">
      <h2>{{ t('th_angles_h2') }}</h2>
      <NumStepper :value="pic.vars.a" :text="`${pic.vars.a}°`" :name="t('ex_angle')" small v-bind="edge('a')" @step="bump('a', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.line" /></div>
    <div class="kid-eq sm"><MathParts :parts="pic.lineEq" /></div>
    <p>{{ tp('ex_angLine', 0, pic.vars) }}</p>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('th_angles_h3') }}</h2>
    <div class="kid-tfig"><GeoFigure :fig="pic.cross" /></div>
    <p>{{ tp('ex_angCross', 0, pic.vars) }}</p>
  </section>
</template>
