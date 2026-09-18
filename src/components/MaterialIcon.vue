<script setup>
defineProps({
  kind: { type: String, required: true },
  size: { type: Number, default: 18 },
})

// The material's own colour, with a darker stroke so it reads on white. Day
// values live here as the var() fallback; kid.css overrides them at night,
// where the icon flips over to a dark body with a light outline.
const FILL = {
  wood: 'var(--k-mat-wood, #e2b98a)',
  stone: 'var(--k-mat-stone, #c9d0da)',
  food: 'var(--k-mat-food, #f3d868)',
  coins: 'var(--k-mat-coins, #f8cf6a)',
}
const STROKE = {
  wood: 'var(--k-mat-wood-line, #9a5a26)',
  stone: 'var(--k-mat-stone-line, #5f6878)',
  food: 'var(--k-mat-food-line, #8a6a00)',
  coins: 'var(--k-mat-coins-line, #a66a00)',
}
</script>

<template>
  <svg
    class="kid-mat-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="FILL[kind]"
    :stroke="STROKE[kind]"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'wood'">
      <ellipse cx="6" cy="12" rx="3" ry="5" />
      <path d="M6 7h11c1.7 0 3 2.2 3 5s-1.3 5-3 5H6" />
      <path d="M12 11h4" />
    </template>
    <template v-else-if="kind === 'stone'">
      <path d="M4 17l2-7 5-4 6 2 3 6-2 4H6z" />
      <path d="M11 6l1 6 8 2" />
    </template>
    <template v-else-if="kind === 'food'">
      <path d="M12 21V6" />
      <path d="M12 10c-3 0-4-2-4-4 3 0 4 2 4 4z" />
      <path d="M12 10c3 0 4-2 4-4-3 0-4 2-4 4z" />
      <path d="M12 16c-3 0-4-2-4-4 3 0 4 2 4 4z" />
      <path d="M12 16c3 0 4-2 4-4-3 0-4 2-4 4z" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </template>
  </svg>
</template>
