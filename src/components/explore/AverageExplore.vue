<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { averagePicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// The mean: n bars of 1 to 10, each with its own − and +, and the level
// they would all stand at if they were evened out.
const { values: v, bump, edge } = useExplore('average')
const pic = computed(() => averagePicture(v.value))
const KEYS = ['v1', 'v2', 'v3', 'v4', 'v5']
const shown = computed(() => {
  const m = Math.round(pic.value.mean * 100) / 100
  return (Math.abs(pic.value.mean - m) < 1e-9 ? '' : '≈ ') + String(m).replace('.', ',')
})
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.n" :name="t('ex_count')" caption v-bind="edge('n')" @step="bump('n', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_avgBarsH') }}</h2>
    <div class="kid-avgbars" :style="{ '--n': v.n, '--mean': pic.mean }">
      <div v-for="(val, i) in pic.vals" :key="i" class="col">
        <div class="track" aria-hidden="true"><span class="bar" :style="{ '--v': val }"></span></div>
        <NumStepper :value="val" :name="tp('ex_nth', i + 1)" small v-bind="edge(KEYS[i])" @step="bump(KEYS[i], $event)" />
      </div>
      <span class="level" aria-hidden="true"></span>
    </div>
    <p>{{ tp('ex_avgSay', 0, { m: shown }) }}</p>
  </section>
</template>
