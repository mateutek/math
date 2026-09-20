<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ARTICLES } from '@/data/theory'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const route = useRoute()
const className = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// /teoria itself lands on the table, which is what DesktopTheory draws
const onTable = computed(() => route.path === '/teoria' || route.path === '/teoria/tabliczka')
const current = (slug) => route.params.slug === slug
</script>

<template>
  <aside class="kid-desktop-only" :aria-label="t('grpTopics')">
    <h1 class="kid-h1">{{ t('theory') }}</h1>
    <p class="kid-class-cap"><span class="cls">{{ className }}</span>{{ t('theoryYourClass') }}</p>
    <div class="kid-tlist">
      <RouterLink
        to="/teoria/tabliczka"
        class="kid-trow"
        :class="{ on: onTable }"
        :aria-current="onTable ? 'page' : undefined"
        :style="{ '--g': 'var(--k-brand)', '--ink': 'var(--k-ink-missing, #1f4fc4)' }"
      >
        <span class="tile" aria-hidden="true">×</span>
        <span class="txt">
          <span class="name">{{ t('theoryTable') }}</span>
          <span class="ex">{{ t('theoryHelper') }}</span>
        </span>
      </RouterLink>
      <RouterLink
        v-for="a in ARTICLES"
        :key="a.id"
        :to="'/teoria/' + a.slug"
        class="kid-trow"
        :class="{ on: current(a.slug) }"
        :aria-current="current(a.slug) ? 'page' : undefined"
        :style="{ '--g': a.color, '--ink': a.ink }"
      >
        <span class="tile" aria-hidden="true">{{ a.symbol }}</span>
        <span class="txt">
          <span class="name">{{ t('th_' + a.id) }}</span>
          <span class="ex">{{ t('th_' + a.id + '_ex') }}</span>
        </span>
        <span v-if="a.cls > classConfig.id" class="pill">{{ tp('classShort', a.cls) }}</span>
      </RouterLink>
    </div>
  </aside>
</template>
