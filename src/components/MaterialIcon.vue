<script setup>
defineProps({
  kind: { type: String, required: true },
  size: { type: Number, default: 18 },
})

// The chunky multi-fill icons the design boards draw: a body, a darker outline
// and one lighter accent per material. Day values live here as the var()
// fallback, the same way the map art does; kid.css owns the night values.
const C = {
  wood: {
    body: 'var(--k-mat-wood, #c07a3e)',
    line: 'var(--k-mat-wood-line, #5c3212)',
    cap: 'var(--k-mat-wood-cap, #f0c48e)',
  },
  stone: {
    body: 'var(--k-mat-stone, #9aa5b4)',
    line: 'var(--k-mat-stone-line, #3d4453)',
    cap: 'var(--k-mat-stone-facet, #cdd4de)',
  },
  food: {
    body: 'var(--k-mat-food, #eeb322)',
    line: 'var(--k-mat-food-line, #6e4a00)',
  },
  coins: {
    body: 'var(--k-mat-coins, #f2ae1c)',
    line: 'var(--k-mat-coins-line, #7a4c00)',
    cap: 'var(--k-mat-coins-core, #ffd660)',
  },
}
</script>

<template>
  <svg
    class="kid-mat-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'wood'">
      <path d="M6 7h11c1.7 0 3 2.2 3 5s-1.3 5-3 5H6z" :fill="C.wood.body" :stroke="C.wood.line" stroke-width="1.8" />
      <path d="M11 10h5M13 14h4" fill="none" :stroke="C.wood.line" stroke-width="1.5" />
      <ellipse cx="6" cy="12" rx="3" ry="5" :fill="C.wood.cap" :stroke="C.wood.line" stroke-width="1.8" />
      <ellipse cx="6" cy="12" rx="1" ry="2" :fill="C.wood.body" stroke="none" />
    </template>
    <template v-else-if="kind === 'stone'">
      <path d="M4 17l2-7 5-4 6 2 3 6-2 4H6z" :fill="C.stone.body" :stroke="C.stone.line" stroke-width="1.8" />
      <path d="M6 10l5-4 1 6z" :fill="C.stone.cap" stroke="none" />
      <path d="M11 6l1 6 8 2M12 12l-6 5" fill="none" :stroke="C.stone.line" stroke-width="1.5" />
    </template>
    <template v-else-if="kind === 'food'">
      <path d="M12 22V6" fill="none" :stroke="C.food.line" stroke-width="2" />
      <g :fill="C.food.body" :stroke="C.food.line" stroke-width="1.4">
        <ellipse cx="12" cy="4.6" rx="2" ry="3" />
        <ellipse cx="9.2" cy="9.4" rx="2.1" ry="3.3" transform="rotate(-35 9.2 9.4)" />
        <ellipse cx="14.8" cy="9.4" rx="2.1" ry="3.3" transform="rotate(35 14.8 9.4)" />
        <ellipse cx="9.2" cy="15" rx="2.1" ry="3.3" transform="rotate(-35 9.2 15)" />
        <ellipse cx="14.8" cy="15" rx="2.1" ry="3.3" transform="rotate(35 14.8 15)" />
      </g>
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" :fill="C.coins.body" :stroke="C.coins.line" stroke-width="1.8" />
      <circle cx="12" cy="12" r="5.2" :fill="C.coins.cap" :stroke="C.coins.line" stroke-width="1.4" />
    </template>
  </svg>
</template>
