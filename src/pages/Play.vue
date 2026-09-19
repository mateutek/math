<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ClassChip from '@/components/ClassChip.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { next, streakKey } from '@/store/village'
import settings, { classConfig } from '@/store/settings'
import { GROUPS } from '@/data/games'
import { TOPICS, gameMax, gameOffered } from '@/data/classes'
import { t, tp } from '@/i18n'

// true when the next building still lacks a material this group can earn
const needed = (pays) =>
  pays.some((k) => (next.value?.cost[k] ?? 0) > village.materials[k])

// a class that has not met an operation or a topic is not shown the games built
// on it, and a group left with none (Tematy below class 4) is not shown at all
const groups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    games: group.games.filter((game) => gameOffered(game.id, classConfig.value)),
  })).filter((group) => group.games.length),
)

// "do 100 · rekord 14": the range always, the record only once there is one.
// A topic has no range; it shows the level the kid last chose.
function caption(id) {
  const cfg = classConfig.value
  const range = TOPICS.includes(id)
    ? t('lvl' + settings.topicLevel[id])
    : tp(id === 'domino' ? 'rangeSums' : 'rangeTo', gameMax(id, cfg))
  const best = village.bestStreak[streakKey(id, cfg.id)]
  return best ? `${range} · ${tp('bestShort', best)}` : range
}
</script>

<template>
  <div class="kid-play">
    <!-- the phone board starts straight at the first group -->
    <h1 class="kid-h1 kid-wide-only">{{ t('playTitle') }}</h1>
    <ClassChip />
    <section v-for="group in groups" :key="group.key" class="kid-group" :class="{ wide: group.wide }">
      <h2>
        {{ t(group.key) }}
        <MaterialIcon v-for="k in group.pays" :key="k" :kind="k" :size="16" />
        <span v-if="needed(group.pays)" class="kid-badge">{{ t('needed') }}</span>
      </h2>
      <div class="kid-grid" :style="{ '--cols': group.cols }">
        <RouterLink
          v-for="game in group.games"
          :key="game.id"
          :to="game.route"
          class="kid-game"
          :class="{ icon: game.icon }"
          :style="{ '--g': game.color, '--ink': game.ink }"
        >
          <component :is="game.icon" v-if="game.icon" :size="28" class="sym" aria-hidden="true" />
          <span v-else class="sym" :class="{ wide: game.symbol.length > 1 }" aria-hidden="true">{{ game.symbol }}</span>
          <span class="lab">
            <template v-if="game.short">
              <span class="kid-phone-only">{{ t(game.id) }}</span>
              <span class="kid-wide-only">{{ t(game.short) }}</span>
            </template>
            <template v-else>{{ t(game.id) }}</template>
          </span>
          <span class="best">{{ caption(game.id) }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
