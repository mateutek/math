<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import NumberLine from '@/components/NumberLine.vue'
import { useExplore } from '@/composables/useExplore'
import { negativesPicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Negative numbers: a + b as one jump on a line that always shows zero.
const { values: v, bump, edge } = useExplore('negatives')
const pic = computed(() => negativesPicture(v.value))
const minus = (n) => String(n).replace('-', '−')
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.a" :text="minus(v.a)" :name="t('op_n1')" v-bind="edge('a')" @step="bump('a', $event)" />
      <span class="op">+</span>
      <NumStepper :value="v.b" :text="minus(v.b)" :name="t('op_n2')" v-bind="edge('b')" @step="bump('b', $event)" />
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('op_lineH') }}</h2>
    <NumberLine :line="pic.line" />
    <p>{{ tp(v.b < 0 ? 'ex_negLeft' : 'ex_negRight', 0, { a: minus(v.a), b: Math.abs(v.b), res: minus(pic.vars.res) }) }}</p>
  </section>
</template>
