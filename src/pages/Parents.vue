<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { CLASSES, configFor } from '@/data/classes'
import { practiceRows } from '@/data/practice'
import { t, tp } from '@/i18n'

const router = useRouter()

// same as the privacy page: a real history check, not a guess
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

// computed so the names follow a language switch on the bare header
const classes = computed(() => CLASSES.filter((c) => c.available).map((c) => ({
  id: c.id,
  name: c.id === 0 ? t('classZero') : tp('classLabel', c.id),
  rows: practiceRows(configFor(c.id)),
})))
</script>

<template>
  <div class="kid-privacy kid-parents">
    <button type="button" class="back" :aria-label="t('back')" @click="goBack">
      <ArrowLeft :size="22" />
    </button>
    <h1 class="kid-h1">{{ t('parents') }}</h1>
    <p>{{ t('parentsLead') }}</p>

    <section>
      <h2>{{ t('parentsRewardsH') }}</h2>
      <p>{{ t('parentsRewardsP') }}</p>
    </section>
    <section>
      <h2>{{ t('parentsTheoryH') }}</h2>
      <p>{{ t('parentsTheoryP') }}</p>
    </section>
    <section>
      <h2>{{ t('parentsTestsH') }}</h2>
      <p>{{ t('parentsTestsP') }}</p>
    </section>
    <section>
      <h2>{{ t('privacy') }}</h2>
      <p>{{ t('parentsPrivacyP') }} <RouterLink to="/prywatnosc">{{ t('privacyTitle') }}</RouterLink></p>
    </section>
    <section>
      <h2>{{ t('parentsClassesH') }}</h2>
      <!-- native disclosure: one class open at a time is enough to read -->
      <details v-for="c in classes" :key="c.id" class="kid-parents-class">
        <summary>{{ c.name }}</summary>
        <div class="rows">
          <template v-for="row in c.rows" :key="row.sym">
            <span class="sym" :style="{ color: row.ink }">{{ row.sym }}</span>
            <span>{{ row.text }}</span>
          </template>
        </div>
      </details>
    </section>
  </div>
</template>
