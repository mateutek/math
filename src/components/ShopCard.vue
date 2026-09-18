<script setup>
import { ArrowRight } from 'lucide-vue-next'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { trade, next } from '@/store/village'
import { MATERIALS, SHOP_RATE } from '@/data/buildings'
import { t, tp } from '@/i18n'

// Fixed row order on purpose: rows that re-sort while a kid taps the same
// button twice would move the button out from under the finger.
const goods = MATERIALS.filter((k) => k !== 'coins')

// the next building still lacks this material
const needed = (kind) => (next.value?.cost[kind] ?? 0) > village.materials[kind]
</script>

<template>
  <section class="kid-panel kid-shop" :aria-label="t('shop')">
    <div class="kid-shop-head">
      <h2>{{ t('shop') }}</h2>
      <span class="purse">
        <MaterialIcon kind="coins" :size="16" /> {{ tp('coinsHave', village.materials.coins) }}
      </span>
    </div>
    <div v-for="kind in goods" :key="kind" class="kid-shop-row">
      <span class="rate" aria-hidden="true">
        <MaterialIcon kind="coins" />1
        <ArrowRight :size="16" class="arrow" />
        <MaterialIcon :kind="kind" />{{ SHOP_RATE }}
      </span>
      <span class="name">
        {{ t('shop_' + kind) }}
        <span v-if="needed(kind)" class="kid-badge">{{ t('needed') }}</span>
      </span>
      <button
        class="kid-btn kid-shop-btn"
        :class="needed(kind) ? 'kid-btn-primary' : 'kid-btn-ghost'"
        :disabled="village.materials.coins < 1"
        :aria-label="`${t('trade')}: 1 ${t('coins')}, ${SHOP_RATE} ${t(kind)}`"
        @click="trade(kind)"
      >
        {{ t('trade') }}
      </button>
    </div>
  </section>
</template>
