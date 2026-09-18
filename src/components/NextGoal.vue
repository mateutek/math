<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Flame } from 'lucide-vue-next'
import MaterialIcon from '@/components/MaterialIcon.vue'
import IsoBuilding from '@/components/IsoBuilding.vue'
import village, { build, next } from '@/store/village'
import { goalFor, canAfford } from '@/store/villageLogic'
import { t, tp } from '@/i18n'

const props = defineProps({
  // a built building picked for upgrade; null means the next unbuilt one
  buildingId: { type: String, default: null },
  // village page shows a real Build button, other pages link to the village
  canBuild: { type: Boolean, default: false },
})
const emit = defineEmits(['built'])

const goal = computed(() => (props.buildingId ? goalFor(village, props.buildingId) : next.value))
const affordable = computed(() => !!goal.value && canAfford(village, goal.value.cost))
const bars = computed(() =>
  Object.entries(goal.value?.cost ?? {}).map(([kind, need]) => {
    const have = Math.min(village.materials[kind], need)
    return { kind, need, have, pct: (have / need) * 100, full: have === need }
  }),
)

// the hint names one shortfall: the material the goal lacks most of
const short = computed(() =>
  bars.value.filter((b) => !b.full).sort((a, b) => b.need - b.have - (a.need - a.have))[0],
)

function onBuild() {
  if (build(goal.value.id)) emit('built')
}
</script>

<template>
  <section class="kid-panel kid-goal" :class="{ side: !canBuild }" :aria-label="t('nextGoal')">
    <span class="kid-eyebrow">{{ t('nextGoal') }}</span>
    <template v-if="goal">
      <div class="kid-goal-head">
        <svg v-if="!canBuild" class="art" viewBox="-36 -36 72 80" aria-hidden="true">
          <IsoBuilding :id="goal.id" :tier="goal.tier" ghost next />
        </svg>
        <div class="txt">
          <h2>{{ t('b_' + goal.id) }}</h2>
          <span class="sub">{{ t('tier') }} {{ goal.tier }}</span>
        </div>
        <!-- on the wide layout this chip lives in the village heading instead -->
        <span v-if="village.dayStreak > 1" class="kid-fire kid-phone-only">
          <Flame :size="15" /> {{ tp('dayStreakChip', village.dayStreak) }}
        </span>
      </div>

      <div class="kid-bars">
        <div
          v-for="b in bars"
          :key="b.kind"
          class="kid-bar"
          role="img"
          :aria-label="`${t(b.kind)}: ${b.have}/${b.need}`"
        >
          <MaterialIcon :kind="b.kind" />
          <div class="track"><div class="fill" :class="{ full: b.full }" :style="{ width: b.pct + '%' }"></div></div>
          <span class="n">{{ b.have }}/{{ b.need }}</span>
        </div>
      </div>

      <button v-if="canBuild" class="kid-btn kid-btn-primary" :disabled="!affordable" @click="onBuild">
        {{ t(goal.tier === 1 ? 'build' : 'upgrade') }}
      </button>
      <RouterLink v-else-if="affordable" to="/" class="kid-btn kid-btn-primary">{{ t('readyToBuild') }}</RouterLink>

      <p v-if="short" class="kid-goal-hint">
        {{ tp('need_' + short.kind, short.need - short.have) }}
        <template v-if="canBuild">
          <RouterLink to="/graj">{{ t('play_' + short.kind) }}</RouterLink> {{ t('goalOrTrade') }}
        </template>
        <template v-else>{{ t('from_' + short.kind) }}</template>
      </p>
      <RouterLink v-if="!canBuild && !affordable" to="/" class="kid-btn kid-btn-ghost">{{ t('seeVillage') }}</RouterLink>
    </template>
    <p v-else class="kid-prompt">{{ t(buildingId ? 'maxTier' : 'villageDone') }}</p>
  </section>
</template>
