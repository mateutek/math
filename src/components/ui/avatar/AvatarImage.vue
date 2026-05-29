<script setup>
import { AvatarImage } from 'reka-ui'

defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
})
</script>

<template>
  <AvatarImage :src="src" :alt="alt" class="h-full w-full object-cover" />
</template>
