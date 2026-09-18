<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { classConfig } from '@/store/settings'
import { gameMax, gameOps } from '@/data/classes'
import { t, tp } from '@/i18n'

const props = defineProps({
  // a game id, or '' for the whole Play grid
  game: { type: String, default: '' },
})

const name = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// "+ − × ÷ · liczby do 100", or just the range when the game has no operators
const descriptor = computed(() => {
  const cfg = classConfig.value
  const id = props.game
  const range = id === 'domino'
    ? tp('rangeSums', gameMax(id, cfg))
    : tp('rangeNumbers', id ? gameMax(id, cfg) : cfg.max)
  const ops = id ? gameOps(id, cfg) : cfg.ops.join(' ')
  return ops ? `${ops} · ${range}` : range
})
</script>

<template>
  <div class="kid-class-chip">
    <span class="cls">{{ name }}</span>
    <span class="rg">{{ descriptor }}</span>
    <RouterLink to="/klasa" class="chg">{{ t('changeClass') }}</RouterLink>
  </div>
</template>
