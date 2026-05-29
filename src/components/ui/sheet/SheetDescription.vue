<script setup>
import { DialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, default: '' },
  asChild: { type: Boolean, default: false },
  as: { type: String, default: 'p' },
})
</script>

<template>
  <DialogDescription
    :as="as"
    :as-child="asChild"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
