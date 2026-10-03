<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { shelves } from '@/data/theory'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const shelf = computed(() => shelves(classConfig.value.id))
const className = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// The grid of every page, by section: the kid's own sections first (the
// multiplication table leads the operations), then "Na później" for what is
// above the class, each tile naming the class it is for.
const TABLE = { id: 'table', to: '/teoria/tabliczka', symbol: '×', name: 'theoryTable', sub: 'theoryHelper', color: 'var(--k-brand)', ink: 'var(--k-ink-missing, #1f4fc4)' }
const tile = (a) => ({ id: a.id, to: '/teoria/' + a.slug, symbol: a.symbol, name: 'th_' + a.id, ex: 'th_' + a.id + '_ex', color: a.color, ink: a.ink, cls: a.cls })

const sections = computed(() => {
  const list = shelf.value.groups.map((g) => ({
    key: g.key,
    tiles: [...(g.key === 'grpOps' ? [TABLE] : []), ...g.articles.map(tile)],
    later: false,
  }))
  if (!list.some((s) => s.key === 'grpOps')) list.unshift({ key: 'grpOps', tiles: [TABLE], later: false })
  if (shelf.value.later.length) list.push({ key: 'theoryLater', tiles: shelf.value.later.map(tile), later: true })
  return list
})
</script>

<template>
  <div class="kid-theory">
    <div class="kid-thead">
      <h1 class="kid-h1">{{ t('theory') }}</h1>
      <span class="kid-class-pill">{{ className }}</span>
    </div>
    <p class="kid-tlead">{{ t('theoryLead') }}</p>

    <section v-for="section in sections" :key="section.key" class="kid-group">
      <h2>{{ t(section.key) }}</h2>
      <div class="kid-grid kid-tgrid" :style="{ '--cols': 4 }">
        <RouterLink
          v-for="a in section.tiles"
          :key="a.id"
          :to="a.to"
          class="kid-game"
          :style="{ '--g': a.color, '--ink': a.ink }"
        >
          <span class="sym" :class="{ wide: a.symbol.length > 1 }" aria-hidden="true">{{ a.symbol }}</span>
          <span class="lab">{{ t(a.name) }}</span>
          <span class="best">{{ section.later ? tp('classShort', a.cls) : t(a.sub ?? a.ex) }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
