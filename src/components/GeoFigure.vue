<script setup>
import { computed } from 'vue'
import { layout } from '@/games/geometry'
import { t } from '@/i18n'

// One geometry figure as SVG, drawn from layout(): the same points
// geometry.check.js measures. Model units are centimetres with y up; they are
// scaled to fit, so a figure is true to its angles and its proportions.
const props = defineProps({
  fig: { type: Object, required: true },
  // the answer, put in the '?' once the kid is out of tries; null until then
  reveal: { type: Number, default: null },
})

const W = 260 // the drawing area inside the padding, in viewBox units
const H = 150
const PAD = 30
const ARC = 18 // arc radius and label distance, in viewBox units
const fmt = (n) => String(n).replace('.', ',')

const view = computed(() => {
  const L = layout(props.fig)
  const all = Object.values(L.pts)
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const s = Math.min(W / Math.max(x1 - x0, 1e-9), H / Math.max(y1 - y0, 1e-9))
  const pts = Object.fromEntries(Object.entries(L.pts).map(([k, [x, y]]) => [k, [PAD + (x - x0) * s, PAD + (y1 - y) * s]]))
  const P = (n) => pts[n]
  const w = (x1 - x0) * s + 2 * PAD
  const h = (y1 - y0) * s + 2 * PAD
  // the middle of everything drawn, to push labels away from it
  const mid = [w / 2, h / 2]
  // screen angles: y is down, so a counter-clockwise turn in the model has
  // its angle measured with the y flipped back
  const dir = (from, to) => Math.atan2(-(to[1] - from[1]), to[0] - from[0])
  const at = (v, r, a) => [v[0] + r * Math.cos(a), v[1] - r * Math.sin(a)]

  const label = (x) => (x === '?' ? (props.reveal === null ? '?' : fmt(props.reveal)) : fmt(x))

  const arcs = L.arcs.map((a) => {
    const v = P(a.at)
    const t1 = dir(v, P(a.from))
    let sweep = dir(v, P(a.to)) - t1
    sweep = ((sweep % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const right = Math.abs(sweep - Math.PI / 2) < 1e-6
    const [sx, sy] = at(v, ARC, t1)
    const [ex, ey] = at(v, ARC, t1 + sweep)
    const [lx, ly] = at(v, ARC + 15, t1 + sweep / 2)
    // a right angle gets its square mark instead of an arc
    const r = ARC * 0.6
    const sq = [at(v, r, t1), at(at(v, r, t1), r, t1 + Math.PI / 2), at(v, r, t1 + Math.PI / 2)]
    return {
      d: right
        ? `M${sq[0]} L${sq[1]} L${sq[2]}`
        : `M${sx},${sy} A${ARC},${ARC} 0 ${sweep > Math.PI ? 1 : 0} 0 ${ex},${ey}`,
      text: a.label === null ? null : `${label(a.label)}°`,
      ask: a.label === '?',
      lx,
      ly,
    }
  })

  const rights = L.rights.map((r) => {
    const v = P(r.at)
    const a = dir(v, P(r.from))
    const b = dir(v, P(r.to))
    const k = ARC * 0.55
    const p1 = at(v, k, a)
    const p2 = at(v, k, b)
    return `M${p1} L${p1[0] + p2[0] - v[0]},${p1[1] + p2[1] - v[1]} L${p2}`
  })

  const edges = L.edges.map((e) => {
    const a = P(e.a)
    const b = P(e.b)
    const k = e.t ?? 0.5
    const m = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
    let n = [-(b[1] - a[1]), b[0] - a[0]]
    const nl = Math.hypot(...n) || 1
    n = [n[0] / nl, n[1] / nl]
    // outward: away from the middle (a height: towards it); on a line
    // through the middle, up
    const away = ((m[0] - mid[0]) * n[0] + (m[1] - mid[1]) * n[1]) * (e.inner ? -1 : 1)
    if (away < -1e-6 || (Math.abs(away) <= 1e-6 && n[1] > 0)) n = [-n[0], -n[1]]
    // a label beside a steep line grows away from it, not across it
    const anchor = n[0] > 0.5 ? 'start' : n[0] < -0.5 ? 'end' : 'middle'
    return { x: m[0] + n[0] * 10, y: m[1] + n[1] * 10, anchor, text: `${label(e.label)} cm` }
  })

  // a short stroke across the middle of each equal side
  const ticks = L.ticks.map(([a, b]) => {
    const p = P(a)
    const q = P(b)
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
    const n = [(-(q[1] - p[1]) / l) * 5, ((q[0] - p[0]) / l) * 5]
    return `M${m[0] - n[0]},${m[1] - n[1]} L${m[0] + n[0]},${m[1] + n[1]}`
  })

  return {
    box: `0 0 ${w} ${h}`,
    poly: L.poly ? L.poly.map((n) => P(n).join(',')).join(' ') : null,
    segs: L.segs.map(([a, b, dashed]) => ({ a: P(a), b: P(b), dashed })),
    hints: L.hints.map(([a, b]) => ({ a: P(a), b: P(b) })),
    arcs,
    rights,
    edges,
    ticks,
    // what a screen reader hears: the numbers on the figure, never the answer
    aria: [
      t(`geoShape_${props.fig.shape}`),
      ...L.edges.map((e) => (e.label === '?' ? '?' : `${fmt(e.label)} cm`)),
      ...L.arcs.filter((a) => a.label !== null).map((a) => (a.label === '?' ? '?' : `${fmt(a.label)}°`)),
    ].join(', '),
  }
})
</script>

<template>
  <svg class="kid-geo" :viewBox="view.box" role="img" :aria-label="view.aria">
    <polygon v-if="view.poly" :points="view.poly" class="shape" />
    <line v-for="(s, i) in view.segs" :key="'s' + i" :x1="s.a[0]" :y1="s.a[1]" :x2="s.b[0]" :y2="s.b[1]" :class="{ dash: s.dashed }" />
    <!-- shown by the theory card on hover or its toggle (kid.css .kid-tfig) -->
    <line v-for="(s, i) in view.hints" :key="'h' + i" :x1="s.a[0]" :y1="s.a[1]" :x2="s.b[0]" :y2="s.b[1]" class="hint" />
    <path v-for="(d, i) in view.ticks" :key="'t' + i" :d="d" class="tick" />
    <path v-for="(d, i) in view.rights" :key="'r' + i" :d="d" class="mark" />
    <path v-for="(a, i) in view.arcs" :key="'a' + i" :d="a.d" class="mark" />
    <template v-for="(a, i) in view.arcs" :key="'l' + i">
      <text v-if="a.text" :x="a.lx" :y="a.ly" :class="{ ans: a.ask, reveal: a.ask && reveal !== null }">{{ a.text }}</text>
    </template>
    <text v-for="(e, i) in view.edges" :key="'e' + i" :x="e.x" :y="e.y" :text-anchor="e.anchor">{{ e.text }}</text>
  </svg>
</template>
