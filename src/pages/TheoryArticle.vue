<script setup>
import { computed, onBeforeMount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import MathParts from '@/components/MathParts.vue'
import { articleBySlug } from '@/data/theory'
import { GAMES } from '@/data/games'
import { gameOffered } from '@/data/classes'
import { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const route = useRoute()
const router = useRouter()

const article = computed(() => articleBySlug(String(route.params.slug)))

// a hand-typed URL is the only way to reach a slug that is not an article
onBeforeMount(() => {
  if (!article.value) router.replace('/teoria')
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
  <div v-if="article" class="kid-theory kid-tnav">
    <div class="col">
      <div class="kid-thead">
        <RouterLink to="/teoria" class="back kid-phone-only" :aria-label="t('back')">
          <ArrowLeft :size="22" />
        </RouterLink>
        <h1 class="kid-h1">{{ t('th_' + article.id) }}</h1>
        <span class="kid-class-pill">{{ tp('classLabel', article.cls) }}</span>
      </div>

      <section v-for="card in article.cards" :key="card.h" class="kid-panel" :style="{ '--g': article.color }">
        <h2>{{ t(card.h) }}</h2>
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

      <RouterLink v-if="practise" :to="practise" class="kid-btn kid-btn-primary">
        {{ t('th_' + article.id + '_cta') }} <ArrowRight :size="18" />
      </RouterLink>
    </div>
  </div>
</template>
