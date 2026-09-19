<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { Maximize, Minimize, Minus, Plus, RotateCw, X } from 'lucide-vue-next'
import village, { build, next } from '@/store/village'
import { goalFor, canAfford } from '@/store/villageLogic'
import settings from '@/store/settings'
import { PROJ, LIFT, PATH_COL, PATH_ROW, cellX, cellY, mapItems, rotCell } from '@/data/villageMap'
import { t } from '@/i18n'

const emit = defineEmits(['select', 'built'])

// 1 shows the whole land; the town is read at 3 and up, so that is where it opens
const ZOOMS = [1, 2, 3, 4, 6]
const START = 2
const LABELS_FROM = 4 // names only once a building is big enough to carry one
const url = (file) => `${import.meta.env.BASE_URL}village/${file}`

const zoom = ref(START)
const selected = ref(null)
const full = ref(false)
const root = ref(null)
const viewport = ref(null)
// the viewport's own pixel size, which sets the scale; kept in sync by a
// ResizeObserver because the map is fluid and CSS owns its width
const box = ref({ w: PROJ.CANVAS_W, h: PROJ.CANVAS_H })

const z = computed(() => ZOOMS[zoom.value])
const u = computed(
  () => Math.min(box.value.w / PROJ.CANVAS_W, box.value.h / PROJ.CANVAS_H) * z.value,
)
const mapW = computed(() => Math.max(box.value.w, PROJ.CANVAS_W * u.value))
const mapH = computed(() => Math.max(box.value.h, PROJ.CANVAS_H * u.value))
const ox = computed(() => (mapW.value - PROJ.CANVAS_W * u.value) / 2)
const oy = computed(() => (mapH.value - PROJ.CANVAS_H * u.value) / 2)
const px = (x) => ox.value + (x + PROJ.ORIGIN_X) * u.value
const py = (y) => oy.value + (y + PROJ.ORIGIN_Y) * u.value

const tiers = computed(() =>
  Object.fromEntries(village.buildings.map((b) => [b.id, b.tier])),
)
const items = computed(() => mapItems(settings.mapRotation, tiers.value, next.value?.id ?? null))

// the board's eight stars, as percentages of the map box
const STARS = [
  [6, 10, 2], [20, 5, 1.5], [30, 18, 2], [46, 7, 1.5],
  [62, 12, 2], [74, 4, 1.5], [88, 16, 2], [95, 30, 1.5],
]

// every item carries its own box in map units: designer sprites are all sizes
const sprite = (s) => ({
  left: `${px(s.x).toFixed(2)}px`,
  top: `${py(s.y).toFixed(2)}px`,
  width: `${(s.w * u.value).toFixed(2)}px`,
  height: `${(s.h * u.value).toFixed(2)}px`,
})

const ground = computed(() => items.value.ground.map((s) => ({ ...s, box: sprite(s) })))
const objects = computed(() =>
  items.value.objects.map((s) => ({
    ...s,
    box: sprite(s),
    lit: s.id && s.id === selected.value,
  })),
)

// the selection diamond, one per cell of the selected building
const diamonds = computed(() =>
  (items.value.buildings.find((b) => b.id === selected.value)?.cells ?? []).map(([a, b]) => ({
    key: `${a},${b}`,
    left: `${px(cellX(a, b) - PROJ.TILE_W / 2).toFixed(2)}px`,
    top: `${py(cellY(a, b)).toFixed(2)}px`,
    width: `${(PROJ.TILE_W * u.value).toFixed(2)}px`,
    height: `${(PROJ.TILE_H * u.value).toFixed(2)}px`,
  })),
)

const statusKey = { built: 'stBuilt', next: 'stNext', plan: 'stPlan' }

// One real button per building. Its own box is only the focus ring around the
// whole footprint; what you can actually click is one upright slab per cell,
// the board's 40 x (top + 20) column, so a tall tower never swallows the plot
// next to it. Nearer buildings come last, so they win where slabs overlap.
const hits = computed(() =>
  items.value.buildings
    .map((b) => {
      const slabs = b.cells.map(([a, y]) => ({
        l: px(cellX(a, y) - 20),
        t: py(cellY(a, y) - b.top * LIFT),
        w: 40 * u.value,
        h: (b.top * LIFT + 20) * u.value,
      }))
      const left = Math.min(...slabs.map((s) => s.l))
      const top = Math.min(...slabs.map((s) => s.t))
      return {
        id: b.id,
        depth: Math.max(...b.cells.map((c) => c[0] + c[1])),
        label: [t('b_' + b.id), b.tier ? `${t('tier')} ${b.tier}` : '', t(statusKey[b.status])]
          .filter(Boolean)
          .join(', '),
        style: {
          left: `${left.toFixed(2)}px`,
          top: `${top.toFixed(2)}px`,
          width: `${(Math.max(...slabs.map((s) => s.l + s.w)) - left).toFixed(2)}px`,
          height: `${(Math.max(...slabs.map((s) => s.t + s.h)) - top).toFixed(2)}px`,
        },
        slabs: slabs.map((s, i) => ({
          key: i,
          left: `${(s.l - left).toFixed(2)}px`,
          top: `${(s.t - top).toFixed(2)}px`,
          width: `${s.w.toFixed(2)}px`,
          height: `${s.h.toFixed(2)}px`,
        })),
      }
    })
    .sort((p, q) => p.depth - q.depth),
)

const labels = computed(() =>
  items.value.buildings
    .filter((b) => b.status !== 'next')
    .map((b) => ({
      id: b.id,
      name: t('b_' + b.id),
      built: b.status === 'built',
      style: {
        left: `${px(cellX(b.label[0], b.label[1])).toFixed(1)}px`,
        top: `${py(cellY(b.label[0], b.label[1]) - b.labelLevel * LIFT - 4).toFixed(1)}px`,
      },
    })),
)

const pin = computed(() => {
  const b = items.value.buildings.find((x) => x.status === 'next')
  if (!b) return null
  return {
    text: `${t('nextIs')} ${t('b_' + b.id)}`,
    style: {
      left: `${px(cellX(b.label[0], b.label[1])).toFixed(1)}px`,
      top: `${py(cellY(b.label[0], b.label[1]) - (b.labelLevel + 1.6) * LIFT).toFixed(1)}px`,
    },
  }
})

const card = computed(() => {
  const b = items.value.buildings.find((x) => x.id === selected.value)
  if (!b) return null
  const goal = goalFor(village, b.id)
  return {
    id: b.id,
    name: t('b_' + b.id),
    status: t(statusKey[b.status]),
    chip: b.status,
    line: b.tier ? `${t('tier')} ${b.tier}` : t(b.status === 'next' ? 'stNextInfo' : 'stPlanInfo'),
    action: goal ? t(goal.tier === 1 ? 'build' : 'upgrade') : '',
    can: !!goal && canAfford(village, goal.cost),
  }
})

// --- interaction -----------------------------------------------------------
let drag = null
let moved = false

function pick(id) {
  if (moved) {
    moved = false
    return
  }
  selected.value = selected.value === id ? null : id
  emit('select', selected.value)
}

function clear() {
  selected.value = null
  emit('select', null)
}

function onAction() {
  if (build(card.value.id)) emit('built')
}

// Resize the world (zoom, a new viewport size) without losing your place: the
// spot in the middle stays in the middle, as a fraction of the scrollable
// surface. `box` is still the old viewport size here, which is what makes this
// right inside the ResizeObserver, where the element has already changed.
function keepCentre(change) {
  const el = viewport.value
  const cx = el?.scrollWidth ? (el.scrollLeft + box.value.w / 2) / el.scrollWidth : 0.5
  const cy = el?.scrollHeight ? (el.scrollTop + box.value.h / 2) / el.scrollHeight : 0.5
  change()
  nextTick(() => {
    if (!el) return
    el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2
  })
}

function zoomTo(i) {
  const step = Math.max(0, Math.min(ZOOMS.length - 1, i))
  if (step !== zoom.value) keepCentre(() => (zoom.value = step))
}

// The wheel zooms, it does not scroll: dragging is how the map pans. A trackpad
// sends a stream of small deltas, so they add up to one step per 100, the size
// of one notch on a mouse wheel.
let wheel = 0
function onWheel(e) {
  wheel += e.deltaY * (e.deltaMode === 1 ? 33 : 1) // Firefox counts a mouse wheel in lines
  if (Math.abs(wheel) < 100) return
  zoomTo(zoom.value + (wheel < 0 ? 1 : -1))
  wheel = 0
}

// Full screen. The `full` class alone already fills the window, so this works
// on iPhone Safari, which has no element fullscreen; everywhere else the
// browser's own fullscreen hides its chrome on top of that.
function toggleFull() {
  full.value = !full.value
  if (full.value) root.value.requestFullscreen?.()?.catch(() => {})
  else if (document.fullscreenElement) document.exitFullscreen()
}
// the browser's own Esc leaves native fullscreen without asking us
const onFullChange = () => {
  if (!document.fullscreenElement) full.value = false
}

function onEsc() {
  if (selected.value) clear()
  else if (full.value) toggleFull()
}

// The land is bigger than the viewport, so bring what matters to the middle:
// the picked building, else the next goal, else the crossroads.
function focus() {
  const el = viewport.value
  if (!el) return
  const b =
    items.value.buildings.find((x) => x.id === selected.value) ??
    items.value.buildings.find((x) => x.status === 'next')
  const [a, y] = b?.label ?? rotCell([PATH_COL, PATH_ROW], settings.mapRotation)
  el.scrollLeft = px(cellX(a, y)) - el.clientWidth / 2
  el.scrollTop = py(cellY(a, y)) - el.clientHeight / 2
}

function rotate() {
  settings.mapRotation = (settings.mapRotation + 1) % 4
}
// every cell just moved (the dev panel turns the map too); without this the
// view lands on some other field
watch(() => settings.mapRotation, () => nextTick(focus))

function onDown(e) {
  if (e.pointerType !== 'mouse' || !viewport.value) return
  moved = false
  drag = { x: e.clientX, y: e.clientY, l: viewport.value.scrollLeft, t: viewport.value.scrollTop }
}

function onMove(e) {
  if (!drag || !viewport.value) return
  if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) moved = true
  viewport.value.scrollLeft = drag.l - (e.clientX - drag.x)
  viewport.value.scrollTop = drag.t - (e.clientY - drag.y)
}

const onUp = () => (drag = null)

// a focused building must be on screen, and the viewport is the scroller
const onFocus = (e) => e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })

let ro
onMounted(() => {
  let opened = false
  ro = new ResizeObserver(([entry]) => {
    const size = { w: entry.contentRect.width, h: entry.contentRect.height }
    // the first measure is the first moment the world has its real size
    if (opened) return keepCentre(() => (box.value = size))
    opened = true
    box.value = size
    nextTick(focus)
  })
  ro.observe(viewport.value)
  document.addEventListener('fullscreenchange', onFullChange)
  // warm the cache for the other three facings of every piece on the map, so
  // the first turn does not flash. Once, in idle time, and never awaited.
  const warm = () => {
    const files = new Set([...items.value.ground, ...items.value.objects].map((s) => s.file))
    for (const file of files) {
      for (const facing of 'NESW') new Image().src = url(file.replace(/_[NESW](?=\.png$)/, `_${facing}`))
    }
  }
  ;(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500)))(warm)
})
onUnmounted(() => {
  ro?.disconnect()
  document.removeEventListener('fullscreenchange', onFullChange)
})
</script>

<template>
  <div ref="root" class="kid-map" :class="{ full }" @keydown.esc="onEsc">
    <div v-if="settings.night" class="kid-map-sky" aria-hidden="true">
      <span
        v-for="(s, i) in STARS"
        :key="i"
        class="star"
        :class="{ tw: i % 3 === 0 }"
        :style="{ left: s[0] + '%', top: s[1] + '%', width: s[2] * 2 + 'px', height: s[2] * 2 + 'px', '--twd': i * 0.4 + 's' }"
      ></span>
      <span class="moon"></span>
    </div>

    <div
      ref="viewport"
      class="kid-map-vp"
      :class="{ pannable: z > 1 }"
      @wheel.prevent="onWheel"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointerleave="onUp"
    >
      <div class="kid-map-world" :style="{ width: mapW + 'px', height: mapH + 'px' }">
        <div class="kid-map-art" aria-hidden="true">
          <img
            v-for="s in ground"
            :key="s.key"
            :src="url(s.file)"
            alt=""
            draggable="false"
            decoding="async"
            :style="s.box"
          />
          <svg
            v-for="d in diamonds"
            :key="d.key"
            class="kid-map-diamond"
            viewBox="0 0 48 24"
            :style="{ left: d.left, top: d.top, width: d.width, height: d.height }"
          >
            <polygon class="fill" points="24,1 47,12 24,23 1,12" />
            <polygon class="rim" points="24,1 47,12 24,23 1,12" />
          </svg>
          <img
            v-for="s in objects"
            :key="s.key"
            :src="url(s.file)"
            alt=""
            draggable="false"
            decoding="async"
            :class="[s.state, { lit: s.lit }]"
            :style="s.box"
          />
        </div>

        <ul v-if="z >= LABELS_FROM" class="kid-map-labels" aria-hidden="true">
          <li v-for="l in labels" :key="l.id" :class="{ built: l.built }" :style="l.style">
            {{ l.name }}
          </li>
        </ul>
        <span v-if="pin" class="kid-map-pin" aria-hidden="true" :style="pin.style">{{ pin.text }}</span>

        <div class="kid-map-hits" :aria-label="t('mapLabel')" role="group">
          <button
            v-for="h in hits"
            :key="h.id"
            type="button"
            :aria-label="h.label"
            :aria-pressed="selected === h.id"
            :style="h.style"
            @click="pick(h.id)"
            @focus="onFocus"
          >
            <i v-for="s in h.slabs" :key="s.key" :style="s"></i>
          </button>
        </div>
      </div>
    </div>

    <section v-if="card" class="kid-map-card" :aria-label="card.name">
      <div class="head">
        <div class="txt">
          <h3>{{ card.name }}</h3>
          <span class="chip" :class="card.chip">{{ card.status }}</span>
        </div>
        <button type="button" class="close" :aria-label="t('close')" @click="clear">
          <X :size="18" />
        </button>
      </div>
      <p>{{ card.line }}</p>
      <button
        v-if="card.action"
        type="button"
        class="kid-btn kid-btn-primary"
        :disabled="!card.can"
        @click="onAction"
      >
        {{ card.action }}
      </button>
    </section>

    <div class="kid-map-pill">
      <button type="button" :aria-label="t('zoomOut')" :disabled="zoom === 0" @click="zoomTo(zoom - 1)">
        <Minus :size="18" />
      </button>
      <span class="n">{{ z }}&times;</span>
      <button
        type="button"
        :aria-label="t('zoomIn')"
        :disabled="zoom === ZOOMS.length - 1"
        @click="zoomTo(zoom + 1)"
      >
        <Plus :size="18" />
      </button>
    </div>

    <div class="kid-map-pill rotate">
      <button type="button" :aria-label="t('rotateMap')" @click="rotate">
        <RotateCw :size="18" />
      </button>
    </div>

    <div class="kid-map-pill screen">
      <button
        type="button"
        :aria-label="t(full ? 'exitFullScreen' : 'fullScreen')"
        :aria-pressed="full"
        @click="toggleFull"
      >
        <component :is="full ? Minimize : Maximize" :size="18" />
      </button>
    </div>
  </div>
</template>
