<template>
  <div class="mr-4 relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="-rotate-90"
    >
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        class="stroke-muted/30"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :class="colorClass"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-all duration-500 ease-linear"
      />
    </svg>
    <span class="absolute inset-0 flex items-center justify-center text-sm font-medium tabular-nums">
      {{ remaining }}
    </span>
  </div>
</template>

<script setup name="timer">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  duration: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['timeout'])

const size = 56
const strokeWidth = 6
const center = size / 2
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius

const remaining = ref(props.duration)
let interval = null

const progress = computed(() => (remaining.value / props.duration) * 100)

const dashOffset = computed(
  () => circumference - (progress.value / 100) * circumference
)

const colorClass = computed(() => {
  if (progress.value > 50) return 'stroke-green-500'
  if (progress.value > 25) return 'stroke-amber-500'
  return 'stroke-red-500'
})

function stop() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function start() {
  remaining.value = props.duration
  interval = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      remaining.value = 0
      stop()
      emit('timeout')
    }
  }, 1000)
}

onMounted(() => {
  start()
})

onUnmounted(() => {
  stop()
})
</script>
