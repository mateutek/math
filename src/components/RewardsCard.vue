<script setup>
import MaterialIcon from '@/components/MaterialIcon.vue'
import { t } from '@/i18n'

defineProps({
  pays: { type: Array, required: true },
})
</script>

<template>
  <section class="kid-panel kid-rewards" :aria-label="t('rewardTitle')">
    <h2>{{ t('rewardTitle') }}</h2>
    <ul>
      <li v-for="kind in pays" :key="kind"><MaterialIcon :kind="kind" /> {{ t(kind) }}</li>
    </ul>
    <p>{{ t('rewardLevel') }}</p>
    <p><MaterialIcon kind="coins" :size="16" /> {{ t('rewardCoins') }}</p>
  </section>
</template>
