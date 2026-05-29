<script setup>
import { DialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, default: '' },
  asChild: { type: Boolean, default: false },
  as: { type: String, default: 'h2' },
})
</script>

<template>
  <DialogTitle
    :as="as"
    :as-child="asChild"
    :class="cn('text-lg font-semibold text-foreground', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
