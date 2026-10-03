<script setup>
import { ref, computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { equationsPicture, EQ_LAST_STEP } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Equations on a balance: a boxes of x and b weights against c weights.
// Step by step the same comes off both pans, then the rest is shared out.
const step = ref(0)
const { values: v, bump, edge } = useExplore('equations', () => (step.value = 0))
const pic = computed(() => equationsPicture(v.value, step.value))
const next = () => (step.value = step.value === EQ_LAST_STEP ? 0 : step.value + 1)
const back = () => (step.value = Math.max(0, step.value - 1))
// the right pan's weights in a groups, one for each box, from the last step
const groups = computed(() => {
  const { weights, groups: g } = pic.value.right
  return Array.from({ length: g }, () => weights / g)
})
const NOTES = ['ex_eq0', 'ex_eq1', 'ex_eq2']
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.a" :name="t('ex_boxes')" caption v-bind="edge('a')" @step="bump('a', $event)" />
      <NumStepper :value="v.b" :name="t('ex_weights')" caption v-bind="edge('b')" @step="bump('b', $event)" />
      <NumStepper :value="v.x" :text="`x = ${v.x}`" :name="t('ex_hidden')" caption v-bind="edge('x')" @step="bump('x', $event)" />
    </div>
    <div class="kid-eq sm" aria-live="polite"><MathParts :parts="pic.eq" /></div>
    <div class="steps">
      <button type="button" class="kid-btn kid-btn-ghost" @click="back">{{ t('op_back') }}</button>
      <button type="button" class="kid-btn kid-btn-primary" @click="next">{{ t(step === EQ_LAST_STEP ? 'op_again' : 'op_next') }}</button>
    </div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_balanceH') }}</h2>
    <div class="kid-balance" aria-hidden="true">
      <div class="pan">
        <span v-for="i in pic.left.boxes" :key="'x' + i" class="box">x</span>
        <span v-for="i in pic.left.weights" :key="'w' + i" class="w"></span>
        <span v-for="i in pic.left.taken" :key="'t' + i" class="w gone">×</span>
      </div>
      <span class="eqsign">=</span>
      <div class="pan">
        <template v-if="pic.right.groups > 1">
          <span v-for="(n, g) in groups" :key="'g' + g" class="group"><span v-for="i in n" :key="i" class="w"></span></span>
        </template>
        <template v-else>
          <span v-for="i in pic.right.weights" :key="'w' + i" class="w"></span>
        </template>
        <span v-for="i in pic.right.taken" :key="'t' + i" class="w gone">×</span>
      </div>
    </div>
    <p>{{ tp(NOTES[step], 0, pic.vars) }}</p>
  </section>
</template>
