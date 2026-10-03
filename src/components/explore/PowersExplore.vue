<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { powersPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Powers: b to the e as a product; b² as a square of dots, and its root.
const { values: v, bump, edge } = useExplore('powers')
const pic = computed(() => powersPicture(v.value))
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.b" :name="t('ex_base2')" caption v-bind="edge('b')" @step="bump('b', $event)" />
      <NumStepper :value="v.e" :name="t('ex_exponent')" caption v-bind="edge('e')" @step="bump('e', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
    <p class="kid-opsay">{{ tp('ex_powSay', v.e, pic.vars) }}</p>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_powSquareH') }}</h2>
    <div class="kid-oparray" :class="{ dense: v.b > 6 }" :style="{ '--cols': v.b }" aria-hidden="true">
      <span v-for="i in pic.square" :key="i"></span>
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.root" /></div>
    <p>{{ tp('ex_powSquare', pic.vars.sq, pic.vars) }}</p>
  </section>
</template>
