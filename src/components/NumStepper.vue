<script setup>
import { tp } from '@/i18n'

// A number with − and + beside it, for the operation pictures. The parent
// owns the number and its range; this only says which way to move.
defineProps({
  value: { type: Number, required: true },
  // the number as shown, when it is not the bare value (0,37 or 35%)
  text: { type: String, default: null },
  // what the number is, for the buttons' labels and an optional caption
  name: { type: String, required: true },
  caption: { type: Boolean, default: false },
  atMin: { type: Boolean, default: false },
  atMax: { type: Boolean, default: false },
  small: { type: Boolean, default: false },
})
defineEmits(['step'])
</script>

<template>
  <div class="kid-stepper" :class="{ small }">
    <span v-if="caption" class="cap">{{ name }}</span>
    <div class="row">
      <button type="button" :aria-label="tp('op_less', 0, { name })" :disabled="atMin" @click="$emit('step', -1)">−</button>
      <span class="val" aria-live="polite">{{ text ?? value }}</span>
      <button type="button" :aria-label="tp('op_more', 0, { name })" :disabled="atMax" @click="$emit('step', 1)">+</button>
    </div>
  </div>
</template>
