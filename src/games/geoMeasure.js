// Measuring a laid-out figure, for the self-checks only (geometry.check.js and
// theory.check.js). Pure node. It shares nothing with the generators but
// layout() itself: what it measures is what GeoFigure.vue draws.
import { layout } from './geometry.js'

export const near = (a, b) => Math.abs(a - b) < 1e-6
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]]
const len = (v) => Math.hypot(v[0], v[1])
const cross = (u, v) => u[0] * v[1] - u[1] * v[0]

// the angle counter-clockwise from ray v->p to ray v->q, 0 to 360
export function ccw(v, p, q) {
  const a = Math.atan2(p[1] - v[1], p[0] - v[0])
  const b = Math.atan2(q[1] - v[1], q[0] - v[0])
  return ((((b - a) * 180) / Math.PI) % 360 + 360) % 360
}
export const shoelace = (ps) => Math.abs(ps.reduce((s, p, i) => s + cross(p, ps[(i + 1) % ps.length]), 0)) / 2
export const perimeter = (ps) => ps.reduce((s, p, i) => s + len(sub(ps[(i + 1) % ps.length], p)), 0)

// what a four-cornered outline is, read off its corners alone; null for a
// quadrilateral with no parallel sides
export function quadName(ps) {
  const sides = ps.map((p, i) => sub(ps[(i + 1) % 4], p))
  const parallel = [near(cross(sides[0], sides[2]), 0), near(cross(sides[1], sides[3]), 0)].filter(Boolean).length
  const equal = sides.every((s) => near(len(s), len(sides[0])))
  const right = near(sides[0][0] * sides[1][0] + sides[0][1] * sides[1][1], 0)
  if (parallel === 0) return null
  if (parallel === 1) return 'trap'
  return equal ? (right ? 'square' : 'rhombus') : right ? 'rect' : 'para'
}

// The outline's corners, in order, as drawn.
export const outline = (fig) => {
  const L = layout(fig)
  return L.poly ? L.poly.map((n) => L.pts[n]) : null
}

// Everything wrong with a figure, as sentences; [] when it is true to itself.
// Each labelled angle and length must be what the drawing shows, the '?' (if
// any) measures as `answer`, square marks sit on right angles, equal-length
// marks on equal sides, and an outline is convex and counter-clockwise.
export function figureErrors(fig, answer = null) {
  const L = layout(fig)
  const P = (n) => L.pts[n]
  const value = (label) => (label === '?' ? answer : label)
  const errors = []
  for (const arc of L.arcs) {
    const drawn = ccw(P(arc.at), P(arc.from), P(arc.to))
    if (!(drawn > 0 && drawn < 360)) errors.push(`a ${drawn}° arc`)
    if (arc.label !== null && !near(drawn, value(arc.label))) errors.push(`${arc.label}° drawn as ${drawn}°`)
    // nothing so thin a kid cannot see it
    if (fig.shape !== 'angle' && drawn < 20 - 1e-9) errors.push(`a ${drawn}° sliver`)
  }
  for (const e of L.edges) {
    if (!near(len(sub(P(e.b), P(e.a))), value(e.label))) errors.push(`${e.label} cm drawn wrong`)
  }
  for (const r of L.rights) {
    if (!near(ccw(P(r.at), P(r.from), P(r.to)), 90)) errors.push('a square mark on no right angle')
  }
  const tick = (t) => len(sub(P(t[1]), P(t[0])))
  if (L.ticks.some((t) => !near(tick(t), tick(L.ticks[0])))) errors.push('marked sides differ')
  if (L.poly) {
    const ps = L.poly.map(P)
    ps.forEach((p, i) => {
      const turn = cross(sub(ps[(i + 1) % ps.length], p), sub(ps[(i + 2) % ps.length], ps[(i + 1) % ps.length]))
      if (!(turn > 0)) errors.push('the outline is not convex counter-clockwise')
    })
  }
  return errors
}
