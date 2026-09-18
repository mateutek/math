<script setup>
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import { CLEAN_BOARD_COINS } from '@/composables/useRound'
import { t, tp } from '@/i18n'

const props = defineProps({
  pays: { type: Array, required: true },
  // units a correct answer pays, which the class table sets
  pay: { type: Number, default: 1 },
})

const rows = computed(() => [
  ...props.pays.map((kind) => ({
    kind,
    op: t(`ops_${kind}`),
    text: tp(`mat_${kind}`, props.pay),
  })),
  {
    kind: 'coins',
    op: t('noMistake'),
    plain: true,
    text: tp('coinsPerBoard', CLEAN_BOARD_COINS),
  },
])
</script>

<template>
  <section class="kid-panel kid-rewards" :aria-label="t('rewardTitle')">
    <h2>{{ t('rewardTitle') }}</h2>
    <ul>
      <li v-for="row in rows" :key="row.kind">
        <span class="op" :class="{ txt: row.plain }">{{ row.op }}</span>
        <MaterialIcon :kind="row.kind" />
        {{ row.text }}
      </li>
    </ul>
  </section>
</template>
