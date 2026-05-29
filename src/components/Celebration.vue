<script setup name="celebration">
import { computed } from 'vue'
import { PartyPopper } from 'lucide-vue-next'

// Confetti burst + "Brawo!" banner shown on a correct answer. Re-keyed by the
// parent (via the `cheer` counter) so the confetti remounts and re-animates
// every time. Restrained: ~18 pieces, quick ease-out, fades fully.
const props = defineProps({
  // bump this counter on each correct answer; the parent should key this
  // component on it so the confetti re-runs (e.g. <Celebration :key="cheer" />)
  cheer: {
    type: Number,
    default: 0,
  },
  count: {
    type: Number,
    default: 18,
  },
  colors: {
    type: Array,
    default: () => ['#2f6bed', '#22c55e', '#f6a823', '#ec4899', '#6366f1'],
  },
  label: {
    type: String,
    default: 'Brawo!',
  },
})

// Generated once per mount (the parent remounts via :key="cheer").
const pieces = computed(() => {
  const { count, colors } = props
  const out = []
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const dist = 90 + Math.random() * 150
    const tx = Math.cos(ang) * dist
    const ty = Math.sin(ang) * dist - 40 // bias upward
    out.push({
      '--tx': tx.toFixed(0) + 'px',
      '--ty': ty.toFixed(0) + 'px',
      '--rot': (Math.random() * 720 - 360).toFixed(0) + 'deg',
      '--d': (0.7 + Math.random() * 0.6).toFixed(2) + 's',
      '--s': (7 + Math.random() * 8).toFixed(0) + 'px',
      '--br': Math.random() > 0.5 ? '2px' : '999px',
      '--c': colors[i % colors.length],
    })
  }
  return out
})
</script>

<template>
  <div class="kid-confetti" aria-hidden="true">
    <i v-for="(p, i) in pieces" :key="i" :style="p" />
  </div>
  <div class="kid-cheer">
    <PartyPopper :size="18" /> {{ label }}
  </div>
</template>
