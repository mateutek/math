<script setup>
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  delayMs: { type: Number, default: undefined },
  class: { type: null, default: '' },
})
</script>

<template>
  <AvatarFallback
    :delay-ms="delayMs"
    :class="cn('h-full w-full flex items-center justify-center bg-muted', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
