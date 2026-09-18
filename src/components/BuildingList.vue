<script setup>
import { computed } from 'vue'
import village, { next } from '@/store/village'
import { BUILDINGS } from '@/data/buildings'
import { t } from '@/i18n'

const rows = computed(() =>
  BUILDINGS.map((def) => ({
    id: def.id,
    tier: village.buildings.find((b) => b.id === def.id)?.tier ?? 0,
    isNext: next.value?.id === def.id,
  })),
)
</script>

<template>
  <section class="kid-panel kid-blist kid-desktop-only" :aria-label="t('buildings')">
    <h2>{{ t('buildings') }}</h2>
    <ul>
      <li v-for="r in rows" :key="r.id" :class="{ built: r.tier > 0, next: r.isNext }">
        <span class="dot" aria-hidden="true"></span>
        {{ t('b_' + r.id) }}
        <span v-if="r.tier" class="tag">{{ t('tierShort') }} {{ r.tier }}</span>
        <span v-else-if="r.isNext" class="tag now">{{ t('now') }}</span>
      </li>
    </ul>
  </section>
</template>
