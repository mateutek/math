<script setup>
// Dev-only cheat panel. It never reaches a production build, so the strings
// here are plain English and deliberately not run through t().
import { ref, watch, onMounted, onUnmounted } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import village, { reward, reset, next } from '@/store/village'
import settings from '@/store/settings'
import { MATERIALS } from '@/data/buildings'
import { CLASSES } from '@/data/classes'

const playable = CLASSES.filter((c) => c.available)

const KEY = 'dev-panel-open'
const read = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const open = ref(read())
watch(open, (value) => {
  try {
    sessionStorage.setItem(KEY, value ? '1' : '0')
  } catch {
    // private mode or blocked storage: the panel just forgets
  }
})

const onKey = (event) => {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// grant exactly what the next building still lacks, through the same store
// action the games pay with, so persistence and validation stay in one place
function fundGoal() {
  const goal = next.value
  if (!goal) return
  for (const [kind, need] of Object.entries(goal.cost)) {
    const missing = need - village.materials[kind]
    if (missing > 0) reward(kind, missing)
  }
}

function resetAll() {
  if (window.confirm('Reset the whole village?')) reset()
}
</script>

<template>
  <div class="dev-root">
    <div v-if="open" class="dev-panel" aria-label="Dev cheat panel">
      <div v-for="kind in MATERIALS" :key="kind" class="dev-row">
        <MaterialIcon :kind="kind" :size="14" />
        <span class="dev-name">{{ kind }}</span>
        <span class="dev-num">{{ village.materials[kind] }}</span>
        <button v-for="n in [1, 10, 100]" :key="n" type="button" @click="reward(kind, n)">
          +{{ n }}
        </button>
      </div>
      <div class="dev-row">
        <span class="dev-name">class</span>
        <button
          v-for="c in playable"
          :key="c.id"
          type="button"
          :class="{ on: settings.schoolClass === c.id }"
          @click="settings.schoolClass = c.id"
        >
          {{ c.id === 0 ? 'Z' : c.id }}
        </button>
      </div>
      <div class="dev-acts">
        <button type="button" @click="settings.schoolClass = null">Forget class</button>
        <button type="button" :disabled="!next" @click="fundGoal">
          Fund next goal{{ next ? ` (${next.id} ${next.tier})` : '' }}
        </button>
        <button type="button" @click="resetAll">Reset village</button>
      </div>
    </div>
    <button type="button" class="dev-toggle" :aria-expanded="open" @click="open = !open">DEV</button>
  </div>
</template>

<style scoped>
.dev-root {
  position: fixed;
  left: 8px;
  /* phone: clear the fixed bottom tab bar (76px plus the safe-area inset) */
  bottom: calc(84px + env(safe-area-inset-bottom));
  /* above the app chrome (header and tabs sit at 20), below a reka-ui sheet */
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .dev-root { bottom: 12px; left: 12px; }
}

.dev-toggle {
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 5px 9px;
  border-radius: 6px;
  border: 1px dashed var(--k-brand, #7c3aed);
  background: var(--k-card, #fff);
  color: var(--foreground, #111);
  cursor: pointer;
  opacity: 0.75;
}

.dev-toggle:hover { opacity: 1; }

.dev-panel {
  width: 208px;
  padding: 8px;
  border: 1px dashed var(--k-card-border, #bbb);
  border-radius: 8px;
  background: var(--k-card, #fff);
  color: var(--foreground, #111);
  box-shadow: 0 6px 18px rgb(0 0 0 / 18%);
}

.dev-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.dev-name {
  width: 38px;
  color: var(--muted-foreground, #666);
}

.dev-num {
  width: 34px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dev-acts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
  border-top: 1px dashed var(--k-card-border, #bbb);
  padding-top: 6px;
}

.dev-panel button {
  font: inherit;
  padding: 3px 5px;
  border: 1px solid var(--k-card-border, #bbb);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.dev-row button { flex: 1; }

.dev-panel button:hover:not(:disabled) { border-color: var(--k-brand, #7c3aed); }
.dev-panel button.on { border-color: var(--k-brand, #7c3aed); font-weight: 700; }
.dev-panel button:disabled { opacity: 0.4; cursor: default; }
.dev-root :focus-visible { outline: 2px solid var(--k-brand, #7c3aed); outline-offset: 1px; }
</style>
