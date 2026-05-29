<script setup>
import { DialogTrigger } from 'reka-ui'

const props = defineProps({
  asChild: { type: Boolean, default: false },
  as: { type: String, default: 'button' },
})
</script>

<template>
  <DialogTrigger v-bind="props">
    <slot />
  </DialogTrigger>
</template>
