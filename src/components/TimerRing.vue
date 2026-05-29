<template>
  <!-- Circular countdown (Zegar). Green > 50%, amber > 25%, else red. -->
  <div class="timer-ring" :style="{ width: `${SIZE}px`, height: `${SIZE}px` }">
    <svg :width="SIZE" :height="SIZE" :style="{ transform: 'rotate(-90deg)' }">
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        stroke="var(--muted)"
        :stroke-width="STROKE"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        :stroke-width="STROKE"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        class="timer-ring__arc"
      />
    </svg>
    <span class="timer-ring__num" :style="{ color }">{{ remaining }}</span>
  </div>
</template>

<script setup name="timer-ring">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  duration: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['timeout'])

// Geometry matches docs/math-kid/TimerRing.jsx exactly.
const SIZE = 60
const STROKE = 6
const RADIUS = 26
const circumference = 2 * Math.PI * RADIUS

const remaining = ref(props.duration)
let interval = null

const pct = computed(() =>
  props.duration > 0 ? (remaining.value / props.duration) * 100 : 0
)

const color = computed(() =>
  pct.value > 50
    ? 'var(--success)'
    : pct.value > 25
      ? 'var(--warning)'
      : 'var(--destructive)'
)

const offset = computed(() => circumference * (1 - pct.value / 100))

function stop() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function start() {
  remaining.value = props.duration
  interval = setInterval(() => {
    if (remaining.value <= 1) {
      remaining.value = 0
      stop()
      emit('timeout')
      return
    }
    remaining.value -= 1
  }, 1000)
}

// Component restarts whenever pages re-key it (:key="timerKey").
onMounted(start)
onUnmounted(stop)
</script>

<style scoped>
.timer-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.timer-ring__arc {
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.timer-ring__num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-size: 17px;
}
</style>
