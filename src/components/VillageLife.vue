<script setup>
// The villagers and pets on the map. Their positions change every frame, so
// the loop writes each <img> straight to the DOM; nothing here is reactive
// state that would make the map re-render.
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { cast, spawn, tick } from '@/data/villageLife'
import ACTORS from '@/data/villageActors.json'
import { GROUND_DY, PATH_ROW, RIVER_COL, SCALE, cellX, cellY, rotCell, rotFace } from '@/data/villageMap'

const props = defineProps({
  rotation: { type: Number, required: true },
  tiers: { type: Object, required: true },
  depths: { type: Array, required: true }, // a + b of every object, ascending, after rotation
  place: { type: Function, required: true }, // map units -> world px
  u: { type: Number, required: true },
  url: { type: Function, required: true },
})

// how high the deck lifts a walker on the bridge cell, in map units, per tier
const BRIDGE_DECK = { 1: 2, 2: 3, 3: 5 }

const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const walkers = computed(() => cast(props.tiers))
const states = new Map()
const born = new Set()
const imgs = new Map()

// new ids get a state, gone ids lose theirs, everyone else keeps walking
let first = true
watch(
  walkers,
  (list) => {
    const ids = new Set(list.map((w) => w.id))
    for (const id of states.keys()) if (!ids.has(id)) states.delete(id)
    for (const w of list) {
      if (states.has(w.id)) continue
      const s = spawn(w, props.tiers, Math.random)
      if (!s) continue
      states.set(w.id, s)
      if (!first) born.add(w.id)
    }
    first = false
  },
  { immediate: true },
)
// the watcher runs before render, so this already knows who has a state
const shown = computed(() => walkers.value.filter((w) => states.has(w.id)))

const setImg = (id) => (el) => (el ? imgs.set(id, el) : imgs.delete(id))

// one more than the number of objects at or behind this depth, so a walker on
// the bridge cell sorts above the bridge it stands on
function zOf(d) {
  const ds = props.depths
  let lo = 0
  let hi = ds.length
  while (lo < hi) {
    const m = (lo + hi) >> 1
    if (ds[m] <= d) lo = m + 1
    else hi = m
  }
  return 2 * lo + 1
}

function draw(w, s) {
  const img = imgs.get(w.id)
  if (!img) return
  const [a, b] = s.to ? [s.from[0] + (s.to[0] - s.from[0]) * s.t, s.from[1] + (s.to[1] - s.from[1]) * s.t] : [s.a, s.b]
  const [ra, rb] = rotCell([a, b], props.rotation)
  const F = rotFace(s.face, props.rotation)
  const clip = still ? w.rest : s.clip
  const [vw, vh, ax, ay] = ACTORS[w.actor][clip][F]
  // the lift fades in over the cell before the bridge, so feet ride up onto the deck
  const onto = 1 - Math.min(1, Math.max(Math.abs(a - RIVER_COL), Math.abs(b - PATH_ROW)))
  const deck = (BRIDGE_DECK[props.tiers.bridge] || 0) * onto
  const [x, y] = props.place(cellX(ra, rb) - ax * SCALE, cellY(ra, rb) + GROUND_DY - ay * SCALE - deck)
  const st = img.style
  st.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  st.width = `${(vw * SCALE * props.u).toFixed(2)}px`
  st.height = `${(vh * SCALE * props.u).toFixed(2)}px`
  st.zIndex = zOf(Math.round(ra + rb))
  st.opacity = s.door ? '0' : '' // inside a building: the walker fades out (see kid.css)
  const src = props.url(`actors/${w.actor}_${clip}_${F}.${still ? 'png' : 'webp'}`)
  if (img.getAttribute('src') !== src) img.setAttribute('src', src)
}

const drawAll = () => {
  for (const w of walkers.value) if (states.has(w.id)) draw(w, states.get(w.id))
}

let raf = 0
let last = 0
function frame(now) {
  // a hidden tab pauses rAF; the clamp keeps everyone from jumping on return
  const dt = Math.min((now - last) / 1000, 0.1)
  last = now
  for (const w of walkers.value) {
    const s = states.get(w.id)
    if (!s) continue
    tick(s, w, props.tiers, dt, Math.random)
    draw(w, s)
  }
  raf = requestAnimationFrame(frame)
}

// reduced motion: no loop, just still figures redrawn when the map changes.
// place is a new function every parent render, so a resize that moves the
// origin without changing u still redraws
if (still) watch([() => props.rotation, () => props.place, () => props.tiers], drawAll, { flush: 'post' })

onMounted(() => {
  if (still) return drawAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <img
    v-for="w in shown"
    :key="w.id"
    :ref="setImg(w.id)"
    class="walker"
    :class="{ born: born.has(w.id) }"
    alt=""
    draggable="false"
    decoding="async"
  />
</template>
