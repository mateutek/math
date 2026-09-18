<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Flame } from 'lucide-vue-next'
import IsoBuilding from '@/components/IsoBuilding.vue'
import NextGoal from '@/components/NextGoal.vue'
import ShopCard from '@/components/ShopCard.vue'
import BuildingList from '@/components/BuildingList.vue'
import Celebration from '@/components/Celebration.vue'
import village, { next } from '@/store/village'
import { BUILDINGS } from '@/data/buildings'
import { t, tp } from '@/i18n'

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

// The two boards crop the map differently: the phone one shows less sky, and a
// viewBox cannot be set from CSS.
const WIDE = window.matchMedia('(min-width: 1024px)')
const wide = ref(WIDE.matches)
const onWide = (event) => (wide.value = event.matches)
WIDE.addEventListener('change', onWide)
onUnmounted(() => WIDE.removeEventListener('change', onWide))

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

// role="button" on an SVG group gets no built-in keyboard behaviour, so give
// it a real button's: Enter and Space both activate. keydown, not keyup,
// because Space scrolls the page on keydown and that is what must be
// prevented; ignore auto-repeat so a held key does not toggle back and forth.
function onPlotKey(event, plot) {
  if (event.repeat) return
  select(plot)
}
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

      <svg
        class="kid-map"
        :viewBox="wide ? '-296 -52 592 360' : '-296 -16 592 324'"
        role="img"
        :aria-label="t('yourVillage')"
      >
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
          @keydown.enter.prevent="onPlotKey($event, p)"
          @keydown.space.prevent="onPlotKey($event, p)"
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

      <p class="kid-village-hint kid-wide-only">
        <template v-if="village.buildings.length">{{ t('tapToUpgrade') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>

      <BuildingList />
    </div>

    <aside class="kid-col-side">
      <NextGoal :building-id="selected" can-build @built="cheer += 1" />
      <ShopCard />
      <!-- the phone board closes with the hint, under the shop -->
      <p class="kid-village-hint kid-phone-only">
        <template v-if="village.buildings.length">{{ t('tapToUpgradePhone') }}</template>
        <template v-else>{{ t('emptyVillage') }} <RouterLink to="/graj">{{ t('play') }}</RouterLink></template>
      </p>
    </aside>
  </div>
</template>
