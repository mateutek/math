<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { shelves } from '@/data/theory'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const shelf = computed(() => shelves(classConfig.value.id))
const className = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// the board's decoration: the first four rows of the table, with row 2 and
// column 3 lit and their crossing (the 6, index 7) picked out
const MINI = [1, 2, 3, 4, 5, 2, 4, 6, 8, 10, 3, 6, 9, 12, 15, 4, 8, 12, 16, 20]
const LIT = new Set([2, 5, 6, 8, 9, 12, 17])
</script>

<template>
  <div class="kid-theory kid-tnav">
    <!-- the desktop landing (the rail plus the table) arrives in a later task -->
    <div class="col kid-phone-only">
      <div class="kid-thead">
        <h1 class="kid-h1">{{ t('theory') }}</h1>
        <span class="kid-class-pill">{{ className }}</span>
      </div>
      <p class="kid-tlead">{{ t('theoryLead') }}</p>
      <RouterLink to="/teoria/tabliczka" class="kid-thero">
        <span class="txt">
          <span class="eyebrow">{{ t('theoryHelper') }}</span>
          <span class="name">{{ t('theoryTable') }}</span>
          <span class="sub">{{ t('theoryTableSub') }}</span>
        </span>
        <span class="mini" aria-hidden="true">
          <span v-for="(n, i) in MINI" :key="i" :class="{ on: LIT.has(i), pick: i === 7 }">{{ n }}</span>
        </span>
      </RouterLink>

      <section v-for="group in shelf.groups" :key="group.key" class="kid-tsec">
        <h2>{{ t(group.key) }}</h2>
        <div class="kid-tlist">
          <RouterLink
            v-for="a in group.articles"
            :key="a.id"
            :to="'/teoria/' + a.slug"
            class="kid-trow"
            :style="{ '--g': a.color, '--ink': a.ink }"
          >
            <span class="tile" aria-hidden="true">{{ a.symbol }}</span>
            <span class="txt">
              <span class="name">{{ t('th_' + a.id) }}</span>
              <span class="ex">{{ t('th_' + a.id + '_ex') }}</span>
            </span>
            <ChevronRight class="chev" :size="16" aria-hidden="true" />
          </RouterLink>
        </div>
      </section>

      <section v-if="shelf.later.length" class="kid-tsec">
        <h2>{{ t('theoryLater') }}</h2>
        <div class="kid-tlist">
          <RouterLink
            v-for="a in shelf.later"
            :key="a.id"
            :to="'/teoria/' + a.slug"
            class="kid-trow"
            :style="{ '--g': a.color, '--ink': a.ink }"
          >
            <span class="tile" aria-hidden="true">{{ a.symbol }}</span>
            <span class="txt">
              <span class="name">{{ t('th_' + a.id) }}</span>
              <span class="ex">{{ t('th_' + a.id + '_ex') }}</span>
            </span>
            <span class="pill">{{ tp('classShort', a.cls) }}</span>
            <ChevronRight class="chev" :size="16" aria-hidden="true" />
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
