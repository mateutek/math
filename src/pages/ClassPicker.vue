<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import settings from '@/store/settings'
import { CLASSES, configFor } from '@/data/classes'
import { GAMES } from '@/data/games'
import { t, tp } from '@/i18n'

const router = useRouter()

// the saved class stays selected when the picker is opened again
const picked = ref(configFor(settings.schoolClass).id)
const cfg = computed(() => configFor(picked.value))

const heading = computed(() =>
  picked.value === 0 ? t('practiceZero') : tp('practiceTitle', picked.value),
)

// the "W klasie N ćwiczysz" list, read straight off the class table
const practice = computed(() => [
  { sym: '+ −', ink: 'var(--k-ink-add, #15803d)', text: tp('practiceAdd', cfg.value.max) },
  ...(cfg.value.mulMax
    ? [{ sym: '× ÷', ink: 'var(--k-ink-mul, #4f46e5)', text: tp('practiceMul', cfg.value.mulMax) }]
    : []),
  { sym: '< >', ink: 'var(--k-ink-div2, #0f766e)', text: tp('practiceCompare', cfg.value.max) },
  { sym: '?', ink: 'var(--k-ink-missing, #1f4fc4)', text: tp('practiceMissing', cfg.value.max) },
  ...cfg.value.topics.map((id) => {
    const game = GAMES.find((g) => g.id === id)
    return { sym: game.symbol, ink: game.ink, text: t('practice_' + id) }
  }),
])

function start() {
  settings.schoolClass = picked.value
  router.push('/graj')
}
</script>

<template>
  <div class="kid-picker">
    <div class="intro">
      <h1>{{ t('classPickerTitle') }}</h1>
      <p>{{ t('classPickerLead') }}</p>
    </div>

    <div class="grid">
      <button
        v-for="c in CLASSES"
        :key="c.id"
        type="button"
        class="cls"
        :class="{ on: picked === c.id }"
        :aria-pressed="picked === c.id"
        :disabled="!c.available"
        @click="picked = c.id"
      >
        <span v-if="c.id === 0" class="word">{{ t('classZero') }}</span>
        <template v-else>
          <span class="num">{{ c.id }}</span>
          <span class="word sm">{{ t('classWord') }}</span>
        </template>
        <span class="cap">{{ t(c.cap) }}</span>
        <span v-if="!c.available" class="soon">{{ t('classSoon') }}</span>
      </button>
    </div>

    <section class="kid-panel practice">
      <h2>{{ heading }}</h2>
      <div class="rows">
        <template v-for="row in practice" :key="row.sym">
          <span class="sym" :style="{ color: row.ink }">{{ row.sym }}</span>
          <span>{{ row.text }}</span>
        </template>
      </div>
    </section>

    <button type="button" class="kid-btn kid-btn-primary go" @click="start">
      {{ t('classStart') }} <ArrowRight :size="18" />
    </button>
  </div>
</template>
