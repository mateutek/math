<script setup>
import { computed } from 'vue'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const name = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// "+ − × ÷ · liczby do 100", or just the range when the class has no operators
const descriptor = computed(() => {
  const cfg = classConfig.value
  const range = tp('rangeNumbers', cfg.max)
  const ops = cfg.ops.join(' ')
  return ops ? `${ops} · ${range}` : range
})
</script>

<template>
  <p class="kid-class-cap"><span class="cls">{{ name }}</span>{{ descriptor }}</p>
</template>
