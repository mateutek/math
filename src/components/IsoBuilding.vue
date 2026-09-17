<script setup>
import { computed } from 'vue'

// PLACEHOLDER ART. Real building assets will replace this file later; keep
// every building drawing in here so the swap touches nothing else.
// a = half-width of the footprint, h = wall height, flat = flat roof.
const LOOK = {
  hut: { wall: '#f4c98a', roof: '#c2553d', a: 24, h: 22 },
  well: { wall: '#b8bcc6', roof: '#7cc6f2', a: 13, h: 10, flat: true },
  farm: { wall: '#a97142', roof: '#e8c84a', a: 34, h: 6, flat: true },
  bakery: { wall: '#f7e1b5', roof: '#a8552f', a: 26, h: 26 },
  school: { wall: '#f2a65a', roof: '#7a4a8c', a: 30, h: 30 },
  mill: { wall: '#e9e2d0', roof: '#8a5a3c', a: 20, h: 44 },
  market: { wall: '#f6d365', roof: '#e2574c', a: 32, h: 16 },
  library: { wall: '#c9d6ea', roof: '#3f5f8a', a: 30, h: 34 },
  tower: { wall: '#c4c8d0', roof: '#9aa0ab', a: 15, h: 64, flat: true },
  bridge: { wall: '#9a6b43', roof: '#c89b6a', a: 32, h: 8, flat: true },
  townhall: { wall: '#f3eee2', roof: '#2f6bed', a: 34, h: 38 },
  castle: { wall: '#bfc4cd', roof: '#8e95a3', a: 38, h: 46, flat: true },
}

const props = defineProps({
  id: { type: String, required: true },
  tier: { type: Number, default: 1 },
  ghost: { type: Boolean, default: false },
  next: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

const g = computed(() => {
  const look = LOOK[props.id]
  const k = 1 + 0.12 * (Math.max(props.tier, 1) - 1) // each tier is 12% bigger
  const a = look.a * k
  const h = look.h * k
  const cy = 24
  const L = [-a, cy]
  const R = [a, cy]
  const F = [0, cy + a / 2]
  const B = [0, cy - a / 2]
  const up = ([x, y]) => [x, y - h]
  const apex = [0, cy - h - a * 0.9]
  const pts = (...p) => p.map((q) => q.join(',')).join(' ')
  // point on the right / left wall: u along the wall (0..1), v pixels up
  const onRight = (u, v) => [u * a, cy + a / 2 - (u * a) / 2 - v]
  const onLeft = (u, v) => [-a + u * a, cy + (u * a) / 2 - v]
  const peak = look.flat ? [0, cy - h] : apex
  const tall = look.h >= 16
  return {
    look,
    left: pts(L, F, up(F), up(L)),
    right: pts(F, R, up(R), up(F)),
    top: pts(up(L), up(F), up(R), up(B)),
    roofBack: pts(up(L), up(B), up(R), apex),
    roofLeft: pts(up(L), up(F), apex),
    roofRight: pts(up(F), up(R), apex),
    door: tall && pts(onRight(0.38, 0), onRight(0.62, 0), onRight(0.62, h * 0.55), onRight(0.38, h * 0.55)),
    window: tall && props.tier >= 2 && pts(onLeft(0.3, h * 0.45), onLeft(0.6, h * 0.45), onLeft(0.6, h * 0.8), onLeft(0.3, h * 0.8)),
    peak,
    flag: props.tier >= 3 && pts([peak[0], peak[1] - 18], [peak[0] + 12, peak[1] - 14], [peak[0], peak[1] - 10]),
    smoke: !look.flat && [a * 0.45, cy - h - a * 0.4],
  }
})
</script>

<template>
  <g class="iso-b" :class="{ ghost, next, built: !ghost, sel: selected }">
    <polygon :points="g.left" :fill="g.look.wall" />
    <polygon :points="g.left" class="shade" />
    <polygon :points="g.right" :fill="g.look.wall" />
    <polygon v-if="g.look.flat" :points="g.top" :fill="g.look.roof" />
    <template v-else>
      <polygon :points="g.roofBack" :fill="g.look.roof" />
      <polygon :points="g.roofBack" class="shade2" />
      <polygon :points="g.roofLeft" :fill="g.look.roof" />
      <polygon :points="g.roofLeft" class="shade" />
      <polygon :points="g.roofRight" :fill="g.look.roof" />
    </template>
    <template v-if="!ghost">
      <polygon v-if="g.door" :points="g.door" fill="#6b4226" />
      <polygon v-if="g.window" :points="g.window" fill="#bfe3ff" />
      <template v-if="g.flag">
        <line :x1="g.peak[0]" :y1="g.peak[1]" :x2="g.peak[0]" :y2="g.peak[1] - 18" stroke="#5b4636" stroke-width="1.5" />
        <polygon :points="g.flag" fill="#e2574c" class="iso-flag" />
      </template>
      <circle v-if="g.smoke" :cx="g.smoke[0]" :cy="g.smoke[1]" r="4" class="iso-smoke" />
    </template>
  </g>
</template>
