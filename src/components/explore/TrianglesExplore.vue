<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import { useExplore } from '@/composables/useExplore'
import { trianglesPicture, sidesPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Triangles: two angles fix the third; an isosceles base angle fixes the
// top; three segments make a triangle only when the long one is short enough.
const { values: v, bump, edge } = useExplore('triangles')
const { values: s, bump: bumpSide, edge: sideEdge } = useExplore('sides')
const pic = computed(() => trianglesPicture(v.value))
const sides = computed(() => sidesPicture(s.value))
</script>

<template>
  <section class="kid-panel">
    <h2>{{ t('th_triangles_h1') }}</h2>
    <div class="nums kid-opnums">
      <NumStepper :value="pic.vars.a" :text="`${pic.vars.a}°`" :name="t('ex_angleA')" caption small v-bind="edge('A')" @step="bump('A', $event)" />
      <NumStepper :value="pic.vars.b" :text="`${pic.vars.b}°`" :name="t('ex_angleB')" caption small v-bind="edge('B')" @step="bump('B', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.sum" /></div>
    <div class="kid-eq sm"><MathParts :parts="pic.sumEq" /></div>
    <p>{{ tp('ex_triSum', 0, pic.vars) }}</p>
  </section>

  <section class="kid-panel">
    <div class="kid-ophead">
      <h2>{{ t('th_triangles_h2') }}</h2>
      <NumStepper :value="pic.vars.bs" :text="`${pic.vars.bs}°`" :name="t('ex_baseAngle')" small v-bind="edge('base')" @step="bump('base', $event)" />
    </div>
    <div class="kid-tfig"><GeoFigure :fig="pic.iso" /></div>
    <div class="kid-eq sm"><MathParts :parts="pic.isoEq" /></div>
    <p>{{ tp('ex_triIso', 0, pic.vars) }}</p>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('th_triangles_h3') }}</h2>
    <div class="nums kid-opnums">
      <NumStepper :value="s.p" :name="t('ex_side1')" caption small v-bind="sideEdge('p')" @step="bumpSide('p', $event)" />
      <NumStepper :value="s.q" :name="t('ex_side2')" caption small v-bind="sideEdge('q')" @step="bumpSide('q', $event)" />
      <NumStepper :value="s.r" :name="t('ex_side3')" caption small v-bind="sideEdge('r')" @step="bumpSide('r', $event)" />
    </div>
    <div class="kid-opsides">
      <div class="kid-tfig"><GeoFigure :fig="sides.bars" /></div>
      <div v-if="sides.tri" class="kid-tfig"><GeoFigure :fig="sides.tri" /></div>
    </div>
    <div class="kid-eq sm"><MathParts :parts="sides.eq" /></div>
    <p>{{ tp(sides.ok ? 'ex_sidesYes' : 'ex_sidesNo', 0, sides.vars) }}</p>
  </section>
</template>
