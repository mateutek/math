<script setup>
import { computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import { useExplore } from '@/composables/useExplore'
import { comparePicture } from '@/data/topicPictures'
import { t, tp } from '@/i18n'

// Comparing: two numbers as tens rods and ones cubes; the tens decide first.
const { values: v, bump, edge } = useExplore('compare')
const pic = computed(() => comparePicture(v.value))
const NOTES = { tens: 'ex_cmpTens', ones: 'ex_cmpOnes', same: 'ex_cmpSame' }
</script>

<template>
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <NumStepper :value="v.x" :name="t('op_n1')" v-bind="edge('x')" @step="bump('x', $event)" />
      <span class="op">{{ pic.sign }}</span>
      <NumStepper :value="v.y" :name="t('op_n2')" v-bind="edge('y')" @step="bump('y', $event)" />
    </div>
  </section>

  <section class="kid-panel wide">
    <h2>{{ t('ex_cmpH') }}</h2>
    <div class="kid-place">
      <div v-for="(n, i) in [pic.left, pic.right]" :key="i" class="num" aria-hidden="true">
        <div class="rods"><span v-for="r in n.tens" :key="r" class="rod"></span></div>
        <div class="cubes"><span v-for="c in n.ones" :key="c" class="cube"></span></div>
      </div>
    </div>
    <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
    <p>{{ tp(NOTES[pic.by], 0, { x: v.x, y: v.y, xt: pic.left.tens, yt: pic.right.tens, xo: pic.left.ones, yo: pic.right.ones }) }}</p>
  </section>
</template>
