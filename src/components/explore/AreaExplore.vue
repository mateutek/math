<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { areaPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Area: a rectangle counted in 1 cm squares; a triangle as half of the
// rectangle around it.
const { values: v, bump, edge } = useExplore('area')
const pic = computed(() => areaPicture(v.value))
// the triangle in its a × h rectangle, the top at a third of the way along
const tri = computed(() => {
  const { ta, th } = v.value
  const s = Math.min(26, 260 / ta, 160 / th)
  const [w, h] = [ta * s, th * s]
  return { w: w + 4, h: h + 4, box: `2,2 ${w + 2},2 ${w + 2},${h + 2} 2,${h + 2}`, tri: `2,${h + 2} ${w + 2},${h + 2} ${w / 3 + 2},2` }
})
</script>

<template>
  <section class="kid-panel">
    <h2>{{ t('th_area_h1') }}</h2>
    <div class="nums kid-opnums">
      <NumStepper :value="v.a" :text="`${v.a} cm`" :name="t('ex_length')" caption small v-bind="edge('a')" @step="bump('a', $event)" />
      <NumStepper :value="v.b" :text="`${v.b} cm`" :name="t('ex_width')" caption small v-bind="edge('b')" @step="bump('b', $event)" />
    </div>
    <div class="kid-unitgrid" :style="{ '--cols': v.a }" aria-hidden="true"><span v-for="i in pic.cells" :key="i"></span></div>
    <div class="kid-eq sm"><MathParts :parts="pic.rectEq" /></div>
    <p>{{ tp('ex_areaRect', pic.vars.ab, pic.vars) }}</p>
  </section>

  <section class="kid-panel">
    <h2>{{ t('th_area_h2') }}</h2>
    <div class="nums kid-opnums">
      <NumStepper :value="v.ta" :text="`${v.ta} cm`" :name="t('ex_baseLen')" caption small v-bind="edge('ta')" @step="bump('ta', $event)" />
      <NumStepper :value="v.th" :text="`${v.th} cm`" :name="t('ex_height')" caption small v-bind="edge('th')" @step="bump('th', $event)" />
    </div>
    <svg class="kid-areatri" :viewBox="`0 0 ${tri.w} ${tri.h}`" aria-hidden="true">
      <polygon :points="tri.box" class="box" />
      <polygon :points="tri.tri" class="tri" />
    </svg>
    <div class="kid-eq sm"><MathParts :parts="pic.triEq" /></div>
    <p>{{ tp('ex_areaTri', 0, pic.vars) }}</p>
  </section>
</template>
