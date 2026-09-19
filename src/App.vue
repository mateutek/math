<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Home, Gamepad2, BookOpen } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import NextGoal from '@/components/NextGoal.vue'
import RewardsCard from '@/components/RewardsCard.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import village, { affordable, needed } from '@/store/village'
import settings, { classConfig } from '@/store/settings'
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
const onTheory = computed(() => route.path === '/teoria' || route.path.startsWith('/teoria/'))
// the class picker brings its own bare frame: logo and wordmark, nothing else
const bare = computed(() => route.meta.bare === true)
// theory lays out its own rail and columns, so it takes the same bare branch
const full = computed(() => route.meta.full === true)

const tabs = computed(() => [
  { to: '/', key: 'village', icon: Home, active: onVillage.value, dot: affordable.value },
  { to: '/graj', key: 'play', icon: Gamepad2, active: !onVillage.value && !onTheory.value, dot: false },
  { to: '/teoria', key: 'theory', icon: BookOpen, active: onTheory.value, dot: false },
])

// which of the three columns the sliding blue pill stands in
const pill = computed(() => (onVillage.value ? '' : onTheory.value ? 'third' : 'second'))

// the game being played, matched at a path boundary so `/dzielenie` does not
// also match `/dzielenie2`
const game = computed(() =>
  GAMES.find((g) => route.path === g.route || route.path.startsWith(`${g.route}/`)),
)
</script>

<template>
  <div class="kid-page" :class="{ bare }">
    <!-- up while the branch is being tested on production; delete with its
         string and its CSS rule when the release is done -->
    <p class="kid-wip">{{ t('wip') }}</p>
    <header class="kid-header">
      <div class="kid-header-in">
        <span class="kid-mark"><img :src="'/logo-mark.svg'" width="34" height="34" alt="" /></span>
        <span class="kid-wordmark">Math <span class="en">{{ t('subtitle') }}</span></span>

        <!-- from 768px the tabs live here; below that see the fixed bar -->
        <nav v-if="!bare" class="kid-nav-top" aria-label="Main">
          <span class="kid-tab-pill" :class="pill" aria-hidden="true"></span>
          <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
            <component :is="tab.icon" :size="18" /> {{ t(tab.key) }}
            <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
          </RouterLink>
        </nav>

        <RouterLink v-if="!bare" to="/" class="kid-mats">
          <span v-for="k in MATERIALS" :key="k" class="kid-mat" role="img" :aria-label="`${t(k)}: ${village.materials[k]}`">
            <MaterialIcon :kind="k" />
            <AnimatedInteger :value="village.materials[k]" aria-hidden="true" />
          </span>
        </RouterLink>
        <SettingsSheet v-if="!bare" />
      </div>
    </header>

    <main class="kid-main">
      <!-- the village page and the theory pages bring their own columns -->
      <RouterView v-if="onVillage || bare || full" />
      <div v-else class="kid-cols">
        <!-- keyed: the equation games share one page component, and each needs
             its own instance, not a patched copy of the last one -->
        <div class="kid-col-main"><RouterView :key="route.name" /></div>
        <aside class="kid-col-side kid-desktop-only">
          <NextGoal />
          <!-- a topic has no material of its own: it pays what the village
               needs, times the level the kid is playing at -->
          <RewardsCard
            v-if="game"
            :pays="game.pays.length ? game.pays : [needed]"
            :pay="classConfig.pay * (settings.topicLevel[game.id] ?? 1)"
            :topic="!game.pays.length"
          />
        </aside>
      </div>
    </main>

    <footer v-if="!bare" class="kid-foot">© Conrivo - {{ year }}</footer>

    <!-- phone tab bar; outside the sticky header so it stays pinned -->
    <nav v-if="!bare" class="kid-tabs" aria-label="Main">
      <span class="kid-tab-pill" :class="pill" aria-hidden="true"></span>
      <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
        <component :is="tab.icon" :size="20" /> {{ t(tab.key) }}
        <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
      </RouterLink>
    </nav>

    <component :is="DevPanel" v-if="DevPanel" />
  </div>
</template>
