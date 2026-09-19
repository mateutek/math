<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Flame } from 'lucide-vue-next'
import VillageMap from '@/components/VillageMap.vue'
import NextGoal from '@/components/NextGoal.vue'
import ShopCard from '@/components/ShopCard.vue'
import BuildingList from '@/components/BuildingList.vue'
import Celebration from '@/components/Celebration.vue'
import village from '@/store/village'
import { goalFor } from '@/store/villageLogic'
import { BUILDINGS } from '@/data/buildings'
import { t, tp } from '@/i18n'

const selected = ref(null)
const cheer = ref(0)

// The goal card takes a building id only when that building actually has a
// next tier to reach; picking a still-locked plot leaves the card on the
// village's own next goal.
const goalId = computed(() =>
  selected.value && goalFor(village, selected.value) ? selected.value : null,
)
</script>

<template>
  <div class="kid-cols">
    <div class="kid-col-main kid-village">
      <Celebration v-if="cheer" :key="cheer" />

      <div class="kid-village-head">
        <h1 class="kid-h1">{{ t('yourVillage') }}</h1>
        <span class="count">{{ tp('ofBuildings', BUILDINGS.length, { a: village.buildings.length }) }}</span>
        <!-- on the phone board this chip sits in the goal card instead -->
        <span v-if="village.dayStreak > 1" class="kid-fire kid-wide-only">
          <Flame :size="16" /> {{ tp('dayStreakChip', village.dayStreak) }}
        </span>
      </div>

      <VillageMap @select="selected = $event" @built="cheer += 1" />

      <p class="kid-village-hint kid-wide-only">
        <template v-if="village.buildings.length">{{ t('tapToUpgrade') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>

      <BuildingList />
    </div>

    <aside class="kid-col-side">
      <NextGoal :building-id="goalId" can-build @built="cheer += 1" />
      <ShopCard />
      <!-- the phone board closes with the hint, under the shop -->
      <p class="kid-village-hint kid-phone-only">
        <template v-if="village.buildings.length">{{ t('tapToUpgradePhone') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>
    </aside>
  </div>
</template>
