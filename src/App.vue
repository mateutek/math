<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Infinity as InfinityIcon, Timer } from 'lucide-vue-next'
import settings from '@/store/settings'

const route = useRoute()
const year = new Date().getFullYear()

// Operation config reused across the app: symbol, css class, accent color,
// route and Polish label. Op-chips link to `<route>/1`.
const ops = [
  { key: 'addition', symbol: '+', cls: 'add', color: '#22c55e', route: '/dodawanie', label: 'Dodawanie' },
  { key: 'subtraction', symbol: '−', cls: 'sub', color: '#f59e0b', route: '/odejmowanie', label: 'Odejmowanie' },
  { key: 'multiply', symbol: '×', cls: 'mul', color: '#6366f1', route: '/mnozenie', label: 'Mnożenie' },
  { key: 'divide', symbol: '÷', cls: 'div', color: '#ec4899', route: '/dzielenie', label: 'Dzielenie' },
  { key: 'divide2', symbol: '÷', cls: 'div', color: '#ec4899', route: '/dzielenie2', label: 'Bez reszty' },
]

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
        <span class="kid-wordmark">Math <span class="en">matematyka</span></span>
        <div class="kid-right">
          <button
            class="kid-zegar"
            role="switch"
            :aria-checked="settings.timerEnabled"
            @click="toggleTimer"
          >
            <span class="kid-switch" :aria-checked="settings.timerEnabled"></span>
            <Timer :size="16" :style="{ color: timerColor }" />
            Zegar
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
          <span class="lab">{{ o.label }}</span>
        </RouterLink>
      </div>

      <!-- active page renders its hero card here -->
      <RouterView />
    </main>

    <footer class="kid-foot">© Mateusz Woźniak — {{ year }}</footer>
  </div>
</template>
