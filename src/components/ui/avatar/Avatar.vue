<script setup>
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { avatarVariant } from '.'

const props = defineProps({
  size: { type: String, default: 'sm' },
  shape: { type: String, default: 'circle' },
  class: { type: null, default: '' },
})
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape }), props.class)">
    <slot />
  </AvatarRoot>
</template>
