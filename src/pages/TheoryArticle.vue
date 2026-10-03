<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import MathParts from '@/components/MathParts.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import TheoryCrumbs from '@/components/TheoryCrumbs.vue'
import { articleBySlug } from '@/data/theory'
import { GAMES } from '@/data/games'
import { gameOffered } from '@/data/classes'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const route = useRoute()
const router = useRouter()

const article = computed(() => articleBySlug(String(route.params.slug)))

// the crumbs' menus reuse this instance across articles (same route name), so a
// hand-typed unknown slug must redirect on every change, not only on mount;
// and the reader is scrolled back to the top of the new article
watchEffect(() => {
  if (!article.value) router.replace('/teoria')
  else window.scrollTo(0, 0)
})

// A class-2 kid reading ahead about fractions gets the article, but not a
// button into a game the class is not offered: a dead link is worse than none.
const practise = computed(() => {
  const path = article.value?.practise
  const id = GAMES.find((g) => g.route === path)?.id
  return id && gameOffered(id, classConfig.value) ? path : null
})

const note = (n) => (typeof n === 'string' ? { term: null, text: n } : n)
const segments = (n, d) => Array.from({ length: d }, (_, i) => i < n)
</script>

<template>
  <div v-if="article" class="kid-theory">
    <TheoryCrumbs :article="article" />
    <div class="kid-thead">
      <h1 class="kid-h1">{{ t('th_' + article.id) }}</h1>
      <span class="kid-class-pill">{{ tp('classLabel', article.cls) }}</span>
    </div>

    <div class="kid-tcards">
      <section v-for="card in article.cards" :key="card.h" class="kid-panel" :style="{ '--g': article.color, '--k-ink': article.ink }">
        <h2>{{ t(card.h) }}</h2>
        <div v-if="card.fig" class="kid-tfig"><GeoFigure :fig="card.fig" /></div>
        <div v-if="card.parts" class="kid-eq sm"><MathParts :parts="card.parts" /></div>
        <div v-if="card.bars" class="kid-strip" aria-hidden="true">
          <span v-for="(on, i) in segments(card.bars[0], card.bars[1])" :key="i" :class="{ on }"></span>
        </div>
        <div v-if="card.rows" class="kid-striprows">
          <template v-for="row in card.rows" :key="row.join('/')">
            <span class="lab"><MathParts :parts="[{ frac: row }]" /></span>
            <span class="kid-strip" aria-hidden="true">
              <span v-for="(on, i) in segments(row[0], row[1])" :key="i" :class="{ on }"></span>
            </span>
          </template>
        </div>
        <p v-for="n in card.notes" :key="note(n).text">
          <b v-if="note(n).term">{{ t(note(n).term) }}</b>{{ t(note(n).text) }}
        </p>
      </section>
    </div>

    <RouterLink v-if="practise" :to="practise" class="kid-btn kid-btn-primary">
      {{ t('th_' + article.id + '_cta') }} <ArrowRight :size="18" />
    </RouterLink>
  </div>
</template>
