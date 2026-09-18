<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Infinity as InfinityIcon, Home, Gamepad2 } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import NextGoal from '@/components/NextGoal.vue'
import RewardsCard from '@/components/RewardsCard.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import village, { affordable } from '@/store/village'
import { MATERIALS } from '@/data/buildings'
import { GAMES } from '@/data/games'
import { t } from '@/i18n'

// dev-only cheat panel; the gate lets the production build drop the import
const DevPanel = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/DevPanel.vue'))
  : null

const route = useRoute()
const year = new Date().getFullYear()

const onVillage = computed(() => route.path === '/')

const tabs = computed(() => [
  { to: '/', key: 'village', icon: Home, active: onVillage.value, dot: affordable.value },
  { to: '/graj', key: 'play', icon: Gamepad2, active: !onVillage.value, dot: false },
])

// the game being played, matched at a path boundary so `/dzielenie` does not
// also match `/dzielenie2`
const game = computed(() =>
  GAMES.find((g) => route.path === g.route || route.path.startsWith(`${g.route}/`)),
)

// the rewards card names the amount a correct answer pays, which is the level
const level = computed(() => Math.min(3, Math.max(1, Number(route.params.level) || 1)))
</script>

<template>
  <div class="kid-page">
    <header class="kid-header">
      <div class="kid-header-in">
        <span class="kid-mark"><InfinityIcon :size="22" /></span>
        <span class="kid-wordmark">Math <span class="en">{{ t('subtitle') }}</span></span>

        <!-- from 768px the tabs live here; below that see the fixed bar -->
        <nav class="kid-nav-top" aria-label="Main">
          <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
            <component :is="tab.icon" :size="18" /> {{ t(tab.key) }}
            <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
          </RouterLink>
        </nav>

        <RouterLink to="/" class="kid-mats">
          <span v-for="k in MATERIALS" :key="k" class="kid-mat" role="img" :aria-label="`${t(k)}: ${village.materials[k]}`">
            <MaterialIcon :kind="k" />
            <AnimatedInteger :value="village.materials[k]" aria-hidden="true" />
          </span>
        </RouterLink>
        <SettingsSheet />
      </div>
    </header>

    <main class="kid-main">
      <!-- the village page brings its own side column (goal and shop) -->
      <RouterView v-if="onVillage" />
      <div v-else class="kid-cols">
        <div class="kid-col-main"><RouterView /></div>
        <aside class="kid-col-side kid-desktop-only">
          <NextGoal />
          <RewardsCard v-if="game" :pays="game.pays" :level="level" />
        </aside>
      </div>
    </main>

    <footer class="kid-foot">© Mateusz Woźniak - {{ year }}</footer>

    <!-- phone tab bar; outside the sticky header so it stays pinned -->
    <nav class="kid-tabs" aria-label="Main">
      <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
        <component :is="tab.icon" :size="20" /> {{ t(tab.key) }}
        <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
      </RouterLink>
    </nav>

    <component :is="DevPanel" v-if="DevPanel" />
  </div>
</template>
