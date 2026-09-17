<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import IsoBuilding from '@/components/IsoBuilding.vue'
import NextGoal from '@/components/NextGoal.vue'
import ShopCard from '@/components/ShopCard.vue'
import BuildingList from '@/components/BuildingList.vue'
import Celebration from '@/components/Celebration.vue'
import village, { next } from '@/store/village'
import { BUILDINGS } from '@/data/buildings'
import { t } from '@/i18n'

const SIZE = 6
const PATH_ROW = 3
const POND = ['4,0', '5,0', '5,1']
const FILL = { grass: '#a5d98a', grass2: '#9ad07e', path: '#ead9ac', pond: '#86c8ee' }

const place = ([col, row]) => `translate(${(col - row) * 48} ${(col + row) * 24})`

// ground tiles, already in back-to-front order (row by row, col by col)
const ground = []
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const kind = POND.includes(`${col},${row}`)
      ? 'pond'
      : row === PATH_ROW
        ? 'path'
        : (col + row) % 2
          ? 'grass2'
          : 'grass'
    ground.push({ key: `${col},${row}`, at: place([col, row]), fill: FILL[kind] })
  }
}

const selected = ref(null)
const cheer = ref(0)

// back-to-front so nearer buildings overlap farther ones
const plots = computed(() =>
  BUILDINGS.map((def) => ({
    ...def,
    tier: village.buildings.find((b) => b.id === def.id)?.tier ?? 0,
  })).sort((p, q) => p.plot[0] + p.plot[1] - (q.plot[0] + q.plot[1])),
)

function select(plot) {
  if (!plot.tier) return
  selected.value = selected.value === plot.id ? null : plot.id
}
</script>

<template>
  <div class="kid-cols">
    <div class="kid-col-main kid-village">
      <Celebration v-if="cheer" :key="cheer" />

      <div class="kid-village-head">
        <h1 class="kid-h1">{{ t('yourVillage') }}</h1>
        <span class="count">{{ village.buildings.length }} / {{ BUILDINGS.length }}</span>
      </div>

      <svg class="kid-map" viewBox="-296 -52 592 360" role="img" :aria-label="t('yourVillage')">
        <!-- earth edge under the front two sides of the map -->
        <polygon points="-288,144 0,288 0,302 -288,158" fill="#b58a5a" />
        <polygon points="0,288 288,144 288,158 0,302" fill="#9c7448" />
        <g v-for="tile in ground" :key="tile.key" :transform="tile.at">
          <polygon points="0,0 48,24 0,48 -48,24" :fill="tile.fill" />
        </g>
        <g
          v-for="p in plots"
          :key="p.id"
          :transform="place(p.plot)"
          :role="p.tier ? 'button' : undefined"
          :tabindex="p.tier ? 0 : undefined"
          :aria-label="t('b_' + p.id)"
          :aria-pressed="p.tier ? selected === p.id : undefined"
          @click="select(p)"
          @keyup.enter="select(p)"
        >
          <IsoBuilding
            :id="p.id"
            :tier="p.tier"
            :ghost="!p.tier"
            :next="next?.id === p.id"
            :selected="selected === p.id"
          />
        </g>
      </svg>

      <p class="kid-village-hint">
        <template v-if="village.buildings.length">{{ t('tapToUpgrade') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>

      <BuildingList />
    </div>

    <aside class="kid-col-side">
      <NextGoal :building-id="selected" can-build @built="cheer += 1" />
      <ShopCard />
    </aside>
  </div>
</template>
