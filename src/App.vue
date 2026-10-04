<script setup>
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Home, Gamepad2, BookOpen, Printer, ChevronUp, Smartphone } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'reka-ui'
import AnimatedInteger from '@/components/animatedInteger.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import NextGoal from '@/components/NextGoal.vue'
import RewardsCard from '@/components/RewardsCard.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import LangSwitch from '@/components/LangSwitch.vue'
import ConsentBanner from '@/components/ConsentBanner.vue'
import village, { affordable, needed } from '@/store/village'
import settings, { classConfig } from '@/store/settings'
import { MATERIALS } from '@/data/buildings'
import { payFor } from '@/data/classes'
import { GAMES } from '@/data/games'
import { startIfGranted } from '@/analytics'
import { t } from '@/i18n'

// app start: resumes analytics if a parent already said yes on an earlier visit
startIfGranted()

// dev-only cheat panel; the gate lets the production build drop the import
const DevPanel = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/DevPanel.vue'))
  : null

const route = useRoute()
const year = new Date().getFullYear()

const onVillage = computed(() => route.path === '/')
const onTheory = computed(() => route.path === '/teoria' || route.path.startsWith('/teoria/'))
const onTests = computed(() => route.path === '/testy')
// the class picker brings its own bare frame: logo and wordmark, nothing else
const bare = computed(() => route.meta.bare === true)
// theory lays out its own rail and columns, so it takes the same bare branch
const full = computed(() => route.meta.full === true)

const tabs = computed(() => [
  { to: '/', key: 'village', icon: Home, active: onVillage.value, dot: affordable.value },
  { to: '/graj', key: 'play', icon: Gamepad2, active: !onVillage.value && !onTheory.value && !onTests.value, dot: false },
  { to: '/teoria', key: 'theory', icon: BookOpen, active: onTheory.value, dot: false },
  { to: '/testy', key: 'tests', icon: Printer, active: onTests.value, dot: false },
])

// which of the four columns the sliding blue pill stands in
const pill = computed(() =>
  onVillage.value ? '' : onTheory.value ? 'third' : onTests.value ? 'fourth' : 'second',
)
// the phone bar has three: Theory and Tests share the last one, as a menu,
// and the tab shows whichever of the two the kid is on
const learnTabs = computed(() => tabs.value.slice(2))
const learn = computed(() => learnTabs.value.find((x) => x.active) ?? learnTabs.value[0])
const phonePill = computed(() => (pill.value === 'fourth' ? 'third' : pill.value))

// the game being played, matched at a path boundary so `/dzielenie` does not
// also match `/dzielenie2`
const game = computed(() =>
  GAMES.find((g) => route.path === g.route || route.path.startsWith(`${g.route}/`)),
)

// "Liczbowo · Wioska": the name, then the tab the kid is on. Follows the language.
// document.documentElement.lang keeps screen readers on the right voice and
// keeps /en's lang="en" true once the app takes over from the built HTML.
watchEffect(() => {
  const tab = bare.value ? null : tabs.value.find((x) => x.active)
  const name = t('appNameA') + t('appNameB')
  document.title = tab ? `${name} · ${t(tab.key)}` : name
  document.documentElement.lang = settings.lang
})
</script>

<template>
  <div class="kid-page" :class="{ bare }">
    <!-- up while the branch is being tested on production; delete with its
         string and its CSS rule when the release is done -->
    <p class="kid-wip">{{ t('wip') }}</p>
    <header class="kid-header">
      <div class="kid-header-in">
        <span class="kid-mark"><img :src="'/logo-mark.svg'" width="34" height="34" alt="" /></span>
        <span class="kid-wordmark">{{ t('appNameA') }}<span class="b">{{ t('appNameB') }}</span></span>

        <!-- from 768px the tabs live here; below that see the fixed bar -->
        <nav v-if="!bare" class="kid-nav-top" aria-label="Main">
          <span class="kid-tab-pill" :class="pill" aria-hidden="true"></span>
          <RouterLink v-for="tab in tabs" :key="tab.key" :to="tab.to" class="kid-tab" :data-tour="'tab-' + tab.key" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
            <component :is="tab.icon" :size="18" /> {{ t(tab.key) }}
            <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
          </RouterLink>
        </nav>

        <RouterLink v-if="!bare" to="/" class="kid-mats" data-tour="materials">
          <span v-for="k in MATERIALS" :key="k" class="kid-mat" role="img" :aria-label="`${t(k)}: ${village.materials[k]}`">
            <MaterialIcon :kind="k" />
            <AnimatedInteger :value="village.materials[k]" aria-hidden="true" />
          </span>
        </RouterLink>
        <SettingsSheet v-if="!bare" />
        <!-- the bare header (class picker) hides the settings sheet, so this is
             the only place a first-run visitor can change the language -->
        <div v-if="bare" class="kid-right"><LangSwitch /></div>
      </div>
    </header>

    <main class="kid-main">
      <!-- the village page and the theory pages bring their own columns -->
      <RouterView v-if="onVillage || bare || full" />
      <div v-else class="kid-cols">
        <!-- keyed: the equation games share one page component, and each needs
             its own instance, not a patched copy of the last one -->
        <div class="kid-col-main"><RouterView :key="route.name" /></div>
        <aside class="kid-col-side kid-desktop-only" data-tour="side">
          <NextGoal />
          <!-- a topic has no material of its own: it pays what the village
               needs, times the level the kid is playing at -->
          <RewardsCard
            v-if="game"
            :pays="game.pays.length ? game.pays : [needed]"
            :pay="payFor(game.id, classConfig) * (settings.topicLevel[game.id] ?? 1)"
            :topic="!game.pays.length"
          />
        </aside>
      </div>
    </main>

    <footer v-if="!bare" class="kid-foot">© <a href="https://conrivo.pl" target="_blank" rel="noopener">Conrivo</a> - {{ year }} · <RouterLink to="/dla-rodzicow">{{ t('parents') }}</RouterLink></footer>

    <!-- phone tab bar; outside the sticky header so it stays pinned -->
    <nav v-if="!bare" class="kid-tabs" aria-label="Main">
      <span class="kid-tab-pill" :class="phonePill" aria-hidden="true"></span>
      <RouterLink v-for="tab in tabs.slice(0, 2)" :key="tab.key" :to="tab.to" :data-tour="'tab-' + tab.key" class="kid-tab" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
        <component :is="tab.icon" :size="20" /> {{ t(tab.key) }}
        <span v-if="tab.dot" class="kid-dot" aria-hidden="true"></span>
      </RouterLink>
      <DropdownMenuRoot :modal="false">
        <DropdownMenuTrigger data-tour="tab-more" class="kid-tab kid-tab-more" :class="{ active: learn.active }">
          <component :is="learn.icon" :size="20" /> {{ t(learn.key) }}
          <ChevronUp :size="14" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent class="kid-menu" side="top" align="end" :side-offset="10">
            <DropdownMenuItem v-for="tab in learnTabs" :key="tab.key" as-child>
              <RouterLink :to="tab.to" :class="{ active: tab.active }" :aria-current="tab.active ? 'page' : undefined">
                <component :is="tab.icon" :size="18" /> {{ t(tab.key) }}
              </RouterLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </nav>

    <!-- outside the router view, on every page, including bare ones -->
    <ConsentBanner />

    <!-- phones on their side get this instead of a squashed board; CSS alone
         decides when (see .kid-rotate), so turning back loses nothing -->
    <div class="kid-rotate" role="alert"><Smartphone :size="56" aria-hidden="true" /><p>{{ t('rotatePhone') }}</p></div>

    <component :is="DevPanel" v-if="DevPanel" />
  </div>
</template>
