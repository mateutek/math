<script setup>
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import { CLEAN_BOARD_COINS } from '@/composables/useRound'
import { t, tp } from '@/i18n'

const props = defineProps({
  pays: { type: Array, required: true },
  // units a correct answer pays, which the class table sets
  pay: { type: Number, default: 1 },
  // a topic game: the material is whatever the village needs, not an operator's
  topic: { type: Boolean, default: false },
})

const rows = computed(() => [
  ...props.pays.map((kind) => ({
    kind,
    op: props.topic ? t('topicOp') : t(`ops_${kind}`),
    plain: props.topic,
    text: tp(`mat_${kind}`, props.pay),
  })),
  // a full star row turns into a coin
  { kind: 'coins', op: '5 ★', plain: true, text: tp('mat_coins', 1) },
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
      <li v-for="row in rows" :key="row.op">
        <span class="op" :class="{ txt: row.plain }">{{ row.op }}</span>
        <MaterialIcon :kind="row.kind" />
        {{ row.text }}
      </li>
    </ul>
  </section>
</template>
