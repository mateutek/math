<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'reka-ui'
import { ARTICLES, THEORY_GROUPS } from '@/data/theory'
import { t } from '@/i18n'

// Teoria › section › page. The section and the page are menus: the section
// one jumps to another section's first page, the page one to its neighbours,
// so a reader switches theory without going back to the grid.
const props = defineProps({
  // the article on screen, or null for the multiplication table
  article: { type: Object, default: null },
})

// the table belongs with the operations, ahead of their articles
const TABLE = { id: 'table', to: '/teoria/tabliczka', symbol: '×', name: 'theoryTable', group: 'grpOps' }
const pages = [TABLE, ...ARTICLES.map((a) => ({ id: a.id, to: '/teoria/' + a.slug, symbol: a.symbol, name: 'th_' + a.id, group: a.group }))]

const current = computed(() => (props.article ? pages.find((p) => p.id === props.article.id) : TABLE))
const siblings = computed(() => pages.filter((p) => p.group === current.value.group))
const sections = THEORY_GROUPS.map((key) => ({ key, first: pages.find((p) => p.group === key) })).filter((s) => s.first)
</script>

<template>
  <nav class="kid-crumbs" :aria-label="t('crumbs')">
    <RouterLink to="/teoria">{{ t('theory') }}</RouterLink>
    <ChevronRight :size="16" class="crumb-sep" aria-hidden="true" />

    <DropdownMenuRoot :modal="false">
      <DropdownMenuTrigger class="kid-crumb">
        {{ t(current.group) }} <ChevronDown :size="15" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="kid-menu" align="start" :side-offset="6">
          <DropdownMenuItem v-for="s in sections" :key="s.key" as-child>
            <RouterLink :to="s.first.to" :class="{ active: s.key === current.group }">{{ t(s.key) }}</RouterLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
    <ChevronRight :size="16" class="crumb-sep" aria-hidden="true" />

    <DropdownMenuRoot :modal="false">
      <DropdownMenuTrigger class="kid-crumb here" aria-current="page">
        {{ t(current.name) }} <ChevronDown :size="15" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="kid-menu" align="start" :side-offset="6">
          <DropdownMenuItem v-for="p in siblings" :key="p.id" as-child>
            <RouterLink :to="p.to" :class="{ active: p.id === current.id }">
              <span class="sym" aria-hidden="true">{{ p.symbol }}</span>{{ t(p.name) }}
            </RouterLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </nav>
</template>
