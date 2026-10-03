<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import MathParts from '@/components/MathParts.vue'
import GeoFigure from '@/components/GeoFigure.vue'
import TheoryCrumbs from '@/components/TheoryCrumbs.vue'
import OpExplorer from '@/components/OpExplorer.vue'
import FractionsExplore from '@/components/explore/FractionsExplore.vue'
import DecimalsExplore from '@/components/explore/DecimalsExplore.vue'
import PercentsExplore from '@/components/explore/PercentsExplore.vue'
import PowersExplore from '@/components/explore/PowersExplore.vue'
import NegativesExplore from '@/components/explore/NegativesExplore.vue'
import EquationsExplore from '@/components/explore/EquationsExplore.vue'
import AverageExplore from '@/components/explore/AverageExplore.vue'
import PythagorasExplore from '@/components/explore/PythagorasExplore.vue'
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

// cards whose helper line (a quad's diagonal) is switched on; a new article
// starts with all of them off
const shown = ref(new Set())
watch(article, () => (shown.value = new Set()))
function toggle(h) {
  const next = new Set(shown.value)
  if (!next.delete(h)) next.add(h)
  shown.value = next
}

// the pictures an article opens with, by its `explore`; the four operations
// share OpExplorer
const EXPLORERS = {
  fractions: FractionsExplore,
  decimals: DecimalsExplore,
  percents: PercentsExplore,
  powers: PowersExplore,
  negatives: NegativesExplore,
  equations: EquationsExplore,
  average: AverageExplore,
  pythagoras: PythagorasExplore,
}

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

    <div class="kid-tcards" :class="{ explore: article.explore }" :style="{ '--g': article.color, '--k-ink': article.ink }">
      <!-- keyed: a new article starts its pictures from their own numbers -->
      <component :is="EXPLORERS[article.explore]" v-if="EXPLORERS[article.explore]" :key="article.id" />
      <OpExplorer v-else-if="article.explore" :key="article.id" :kind="article.explore" />
      <!-- under the pictures, the article's own cards take the whole row -->
      <section v-for="card in article.cards" :key="card.h" class="kid-panel" :class="{ wide: article.explore }" :style="{ '--g': article.color, '--k-ink': article.ink }">
        <h2>{{ t(card.h) }}</h2>
        <div v-if="card.fig" class="kid-tfig" :class="{ show: shown.has(card.h) }">
          <GeoFigure :fig="card.fig" />
          <!-- touch has no hover, so it gets a switch; kid.css hides it where a mouse can hover -->
          <button v-if="card.fig.diagonal" type="button" class="kid-crumb" :aria-pressed="shown.has(card.h)" @click="toggle(card.h)">
            {{ t('showDiagonal') }}
          </button>
        </div>
        <div v-if="card.parts" class="kid-eq sm" :class="{ split: card.split }"><MathParts :parts="card.parts" /></div>
        <div v-if="card.bars" class="kid-strip" :class="{ split: card.split }" aria-hidden="true">
          <span
            v-for="(on, i) in segments(card.bars[0], card.bars[1])"
            :key="i"
            :class="[{ on }, card.split && on && (i < card.split[0] ? 'a' : 'b')]"
          ></span>
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
