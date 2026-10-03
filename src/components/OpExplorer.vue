<script setup>
import { ref, computed } from 'vue'
import MathParts from '@/components/MathParts.vue'
import NumStepper from '@/components/NumStepper.vue'
import NumberLine from '@/components/NumberLine.vue'
import TenFrames from '@/components/TenFrames.vue'
import { settle, rangeOf, LAST_STEP, addPicture, subPicture, barsPicture, mulPicture, divPicture, KIDS } from '@/data/opPictures'
import { t, tp } from '@/i18n'

// The interactive pictures at the top of an operation article: the kid
// picks the numbers (within what the class practises) and every picture,
// sum and sentence follows. The cards sit in the article's own card grid.
const props = defineProps({
  // 'add' | 'sub' | 'mul' | 'div'
  kind: { type: String, required: true },
})

const main = ref(settle(props.kind))
const bars = ref(settle('bars'))
// where a stepped sum is (see LAST_STEP): it opens finished
const step = ref(LAST_STEP)
const turned = ref(false)
const round = ref(0)

// move one number by one; the rest settle into their ranges again, and a
// new sum starts its pictures from the finished state
function bump(group, key, delta) {
  const g = group === 'bars' ? bars : main
  g.value = settle(group, { ...g.value, [key]: g.value[key] + delta })
  if (group !== 'bars') {
    step.value = LAST_STEP
    round.value = 0
  }
}
const edge = (group, key) => {
  const v = group === 'bars' ? bars.value : main.value
  const [lo, hi] = rangeOf(group, v, key)
  return { atMin: v[key] <= lo, atMax: v[key] >= hi }
}

const pic = computed(() => {
  const v = main.value
  if (props.kind === 'add') return addPicture(v, step.value)
  if (props.kind === 'sub') return subPicture(v, step.value)
  if (props.kind === 'mul') return mulPicture(v, turned.value)
  return divPicture(v, round.value)
})
const barsPic = computed(() => barsPicture(bars.value))

const stepped = computed(() => props.kind === 'add' || props.kind === 'sub')
const next = () => (step.value = step.value === LAST_STEP ? 0 : step.value + 1)
const back = () => (step.value = Math.max(0, step.value - 1))
const deal = () => (round.value = pic.value.done ? 0 : round.value + 1)

// the sentences under the pictures, with their plural forms
const say = computed(() => {
  const v = pic.value.vars
  if (props.kind === 'add') return { line: tp('op_addLine', 0, v), frames: t('op_addFrames') }
  if (props.kind === 'sub') return { take: tp('op_subTake', 0, v), line: tp('op_subLine', 0, v) }
  if (props.kind === 'mul') {
    return {
      array: tp('op_mulArray', 0, { ...v, rowsSay: tp('op_rowsN', v.rows), per: tp('op_perDots', v.cols) }),
      groups: tp('op_mulGroups', 0, { baskets: tp('op_basketsN', v.r), per: tp('op_perApples', v.c) }),
      hops: tp('op_mulHops', v.r, v),
    }
  }
  return {
    share: tp('op_divShare', 0, { ...v, sweets: tp('op_sweetsN', v.n) }),
    bags: tp('op_divBags', 0, { ...v, sweets: tp('op_sweetsN', v.n) }),
    rest: tp('op_divRest', 0, { d: v.d, from: tp('op_fromSweets', v.total), bags: tp('op_fullBags', v.q), left: tp('op_leftN', v.r) }),
  }
})
</script>

<template>
  <!-- the numbers, the sum they make, and the step buttons -->
  <section class="kid-panel kid-opctl wide">
    <div class="nums">
      <template v-if="kind === 'add'">
        <NumStepper :value="main.a" :name="t('op_n1')" v-bind="edge('add', 'a')" @step="bump('add', 'a', $event)" />
        <span class="op">+</span>
        <NumStepper :value="main.b" :name="t('op_n2')" v-bind="edge('add', 'b')" @step="bump('add', 'b', $event)" />
      </template>
      <template v-else-if="kind === 'sub'">
        <NumStepper :value="main.m" :name="t('op_n1')" v-bind="edge('sub', 'm')" @step="bump('sub', 'm', $event)" />
        <span class="op">−</span>
        <NumStepper :value="main.s" :name="t('op_n2')" v-bind="edge('sub', 's')" @step="bump('sub', 's', $event)" />
      </template>
      <template v-else-if="kind === 'mul'">
        <NumStepper :value="main.r" :name="t('op_rows')" v-bind="edge('mul', 'r')" @step="bump('mul', 'r', $event)" />
        <span class="op">×</span>
        <NumStepper :value="main.c" :name="t('op_cols')" v-bind="edge('mul', 'c')" @step="bump('mul', 'c', $event)" />
      </template>
      <template v-else>
        <!-- the sweets move by a whole round, so the sharing always comes out even -->
        <NumStepper :value="pic.n" :name="t('op_sweets')" caption v-bind="edge('div', 'q')" @step="bump('div', 'q', $event)" />
        <span class="op">:</span>
        <NumStepper :value="main.d" :name="t('op_kids')" caption v-bind="edge('div', 'd')" @step="bump('div', 'd', $event)" />
      </template>
    </div>
    <div v-if="kind !== 'div'" class="kid-eq sm" aria-live="polite"><MathParts :parts="pic.eq" /></div>
    <div v-if="stepped" class="steps">
      <button type="button" class="kid-btn kid-btn-ghost" @click="back">{{ t('op_back') }}</button>
      <button type="button" class="kid-btn kid-btn-primary" @click="next">{{ t(step === LAST_STEP ? 'op_again' : 'op_next') }}</button>
    </div>
  </section>

  <template v-if="kind === 'add'">
    <section class="kid-panel">
      <h2>{{ t('op_lineH') }}</h2>
      <NumberLine :line="pic.line" />
      <p>{{ say.line }}</p>
    </section>
    <section class="kid-panel kid-opcolors">
      <h2>{{ t('op_framesH') }}</h2>
      <TenFrames :cells="pic.cells" />
      <div class="kid-oplegend">
        <span class="start">{{ tp('op_legendStart', main.a) }}</span>
        <span class="added">{{ tp('op_legendAdded', main.b) }}</span>
      </div>
      <p>{{ say.frames }}</p>
    </section>
  </template>

  <template v-else-if="kind === 'sub'">
    <section class="kid-panel kid-opcolors sub">
      <h2>{{ t('op_takeH') }}</h2>
      <TenFrames :cells="pic.cells" />
      <p>{{ say.take }}</p>
    </section>
    <section class="kid-panel">
      <h2>{{ t('op_backH') }}</h2>
      <NumberLine :line="pic.line" />
      <p>{{ say.line }}</p>
    </section>
    <section class="kid-panel wide">
      <h2>{{ t('op_diffH') }}</h2>
      <div class="kid-opbars">
        <span class="who">{{ t('op_ola') }}</span>
        <div class="bar" aria-hidden="true"><span v-for="(c, i) in barsPic.ola" :key="i" :class="c"></span></div>
        <NumStepper :value="bars.o" :name="t('op_ola')" small v-bind="edge('bars', 'o')" @step="bump('bars', 'o', $event)" />
        <span class="who">{{ t('op_tomek') }}</span>
        <div class="bar" aria-hidden="true"><span v-for="(c, i) in barsPic.tomek" :key="i" :class="c"></span></div>
        <NumStepper :value="bars.t" :name="t('op_tomek')" small v-bind="edge('bars', 't')" @step="bump('bars', 't', $event)" />
      </div>
      <div class="kid-eq sm"><MathParts :parts="barsPic.eq" /></div>
      <p>{{ tp('op_diff', bars.o, { t: bars.t }) }}</p>
    </section>
  </template>

  <template v-else-if="kind === 'mul'">
    <section class="kid-panel">
      <div class="kid-ophead">
        <h2>{{ t('op_arrayH') }}</h2>
        <button type="button" class="kid-crumb" @click="turned = !turned">{{ t('op_turn') }} ↻</button>
      </div>
      <div class="kid-oparray" :class="{ dense: Math.max(main.r, main.c) > 6 }" :style="{ '--cols': pic.cols }" aria-hidden="true">
        <span v-for="(light, i) in pic.dots" :key="i" :class="{ light }"></span>
      </div>
      <div class="kid-eq sm"><MathParts :parts="pic.eq" /></div>
      <p>{{ say.array }}</p>
    </section>
    <section class="kid-panel">
      <h2>{{ t('op_groupsH') }}</h2>
      <div class="kid-opgroups" :class="{ dense: main.c > 4 }" :style="{ '--per': Math.min(main.r, 5) }" aria-hidden="true">
        <div v-for="(g, i) in pic.groups" :key="i"><span v-for="j in g" :key="j"></span></div>
      </div>
      <div class="kid-eq sm"><MathParts :parts="[...pic.sum, '=', main.r * main.c]" /></div>
      <p>{{ say.groups }}</p>
    </section>
    <section class="kid-panel wide kid-opmul">
      <h2>{{ tp('op_hopsH', main.c) }}</h2>
      <NumberLine :line="pic.line" />
      <p>{{ say.hops }}</p>
    </section>
  </template>

  <template v-else>
    <section class="kid-panel">
      <div class="kid-ophead">
        <h2>{{ t('op_shareH') }}</h2>
        <button type="button" class="kid-crumb" @click="deal">{{ t(pic.done ? 'op_again' : 'op_deal') }}</button>
      </div>
      <div class="kid-oppool" aria-hidden="true"><span v-for="i in pic.pool" :key="i"></span></div>
      <div class="kid-opkids" :style="{ '--kids': main.d }">
        <div v-for="(got, i) in pic.kids" :key="i">
          <div class="plate" aria-hidden="true"><span v-for="j in got" :key="j"></span></div>
          <span class="name">{{ KIDS[i] }}</span>
        </div>
      </div>
      <div class="kid-eq sm" aria-live="polite">
        <MathParts v-if="pic.done || pic.vars.dealt === 0" :parts="pic.eq" />
        <span v-else class="kid-opsoft">{{ tp('op_dealt', pic.vars.dealt) }}</span>
      </div>
      <p>{{ say.share }}</p>
    </section>
    <section class="kid-panel">
      <h2>{{ t('op_bagsH') }}</h2>
      <div class="kid-opbags" aria-hidden="true">
        <div v-for="(g, i) in pic.bags" :key="i"><span v-for="j in g" :key="j"></span></div>
      </div>
      <div class="kid-eq sm"><MathParts :parts="[pic.n, ':', main.d, '=', main.q]" /></div>
      <p>{{ say.bags }}</p>
    </section>
    <section class="kid-panel wide">
      <div class="kid-ophead">
        <h2>{{ t('op_restH') }}</h2>
        <NumStepper :value="main.r" :name="t('op_rest')" small v-bind="edge('div', 'r')" @step="bump('div', 'r', $event)" />
      </div>
      <div class="kid-opbags" aria-hidden="true">
        <div v-for="(g, i) in pic.bags" :key="i"><span v-for="j in g" :key="j"></span></div>
        <div class="left"><span v-for="j in pic.left" :key="j"></span></div>
      </div>
      <div class="kid-eq sm"><MathParts :parts="pic.restEq" /></div>
      <p>{{ say.rest }}</p>
    </section>
  </template>
</template>
