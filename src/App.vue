<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Infinity as InfinityIcon, Timer } from 'lucide-vue-next'
import settings from '@/store/settings'
import { t } from '@/i18n'

const route = useRoute()
const year = new Date().getFullYear()

// Operation config reused across the app: symbol, css class, accent color and
// route. The chip label comes from i18n via the op key. Op-chips link to `<route>/1`.
const ops = [
  { key: 'addition', symbol: '+', cls: 'add', color: '#22c55e', route: '/dodawanie' },
  { key: 'subtraction', symbol: '−', cls: 'sub', color: '#f59e0b', route: '/odejmowanie' },
  { key: 'multiply', symbol: '×', cls: 'mul', color: '#6366f1', route: '/mnozenie' },
  { key: 'divide', symbol: '÷', cls: 'div', color: '#ec4899', route: '/dzielenie' },
  { key: 'divide2', symbol: '÷', cls: 'div', color: '#ec4899', route: '/dzielenie2' },
]

function setLang(lang) {
  settings.lang = lang
}

// Match the op route at a path boundary so `/dzielenie` does not also
// activate while on `/dzielenie2`.
const isActive = (opRoute) =>
  route.path === opRoute || route.path.startsWith(`${opRoute}/`)

function toggleTimer() {
  settings.timerEnabled = !settings.timerEnabled
}

const timerColor = computed(() =>
  settings.timerEnabled ? 'var(--k-brand)' : 'var(--muted-foreground)',
)
</script>

<template>
  <div class="kid-page">
    <!-- header -->
    <header class="kid-header">
      <div class="kid-header-in">
        <span class="kid-mark"><InfinityIcon :size="22" /></span>
        <span class="kid-wordmark">Math <span class="en">{{ t('subtitle') }}</span></span>
        <div class="kid-right">
          <div class="kid-lang" role="group" aria-label="Language">
            <button :class="{ on: settings.lang === 'pl' }" @click="setLang('pl')">PL</button>
            <button :class="{ on: settings.lang === 'en' }" @click="setLang('en')">EN</button>
          </div>
          <button
            class="kid-zegar"
            role="switch"
            :aria-checked="settings.timerEnabled"
            @click="toggleTimer"
          >
            <span class="kid-switch" :aria-checked="settings.timerEnabled"></span>
            <Timer :size="16" :style="{ color: timerColor }" />
            {{ t('timer') }}
          </button>
        </div>
      </div>
    </header>

    <main class="kid-main">
      <!-- operation chips -->
      <div class="kid-ops" style="grid-template-columns: repeat(5, 1fr)">
        <RouterLink
          v-for="o in ops"
          :key="o.key"
          :to="`${o.route}/1`"
          class="kid-chip"
          :class="[o.cls, { active: isActive(o.route) }]"
        >
          <span class="sym">{{ o.symbol }}</span>
          <span class="lab">{{ t(o.key) }}</span>
        </RouterLink>
      </div>

      <!-- active page renders its hero card here -->
      <RouterView />
    </main>

    <footer class="kid-foot">© Mateusz Woźniak — {{ year }}</footer>
  </div>
</template>
