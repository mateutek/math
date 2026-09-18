<script setup>
import { RouterLink } from 'vue-router'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { next } from '@/store/village'
import { GROUPS } from '@/data/games'
import { t } from '@/i18n'

// true when the next building still lacks a material this group can earn
const needed = (pays) =>
  pays.some((k) => (next.value?.cost[k] ?? 0) > village.materials[k])
</script>

<template>
  <h1 class="kid-h1">{{ t('playTitle') }}</h1>
  <section v-for="group in GROUPS" :key="group.key" class="kid-group">
    <h2>
      {{ t(group.key) }}
      <MaterialIcon v-for="k in group.pays" :key="k" :kind="k" :size="16" />
      <span v-if="needed(group.pays)" class="kid-badge">{{ t('needed') }}</span>
    </h2>
    <div class="kid-grid">
      <RouterLink
        v-for="game in group.games"
        :key="game.id"
        :to="`${game.route}/1`"
        class="kid-game"
        :style="{ '--g': game.color, '--ink': game.ink }"
      >
        <component :is="game.icon" v-if="game.icon" :size="28" class="sym" aria-hidden="true" />
        <span v-else class="sym" aria-hidden="true">{{ game.symbol }}</span>
        <span class="lab">{{ t(game.id) }}</span>
        <span v-if="village.bestStreak[game.id]" class="best">
          {{ t('best') }}: {{ village.bestStreak[game.id] }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>
