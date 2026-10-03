<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { decimalsPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Decimals: hundredths filling a square, a column (a tenth) at a time.
const { values: v, bump, edge } = useExplore('decimals')
const pic = computed(() => decimalsPicture(v.value))
const shown = computed(() => String(v.value.h / 100).replace('.', ','))
const say = computed(() =>
  tp('ex_decSay', 0, {
    d: shown.value,
    all: tp('ex_hundredthsN', v.value.h),
    tens: tp('ex_tenthsN', pic.value.vars.tenths),
    ones: tp('ex_hundredthsN', pic.value.vars.hundredths),
  }),
)
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.h" :text="shown" :name="t('ex_decimal')" v-bind="edge('h')" @step="bump('h', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_decGridH') }}</h2>
    <div class="kid-hgrid" aria-hidden="true"><span v-for="(on, i) in pic.grid" :key="i" :class="{ on }"></span></div>
    <p>{{ say }}</p>
  </section>
</template>
