<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { bannerVisible, readConsent, clearConsent } from '@/analytics'
import { t } from '@/i18n'

const router = useRouter()

// vue-router's HTML5 history keeps { back, current, forward } in state, so
// this is a real history check, not a guess
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

// readConsent() itself is not reactive (it reads localStorage); bannerVisible
// is, and it flips on every consent change, so reading it here re-runs this
// after "Zmień decyzję" instead of showing a stale choice
const choiceKey = computed(() => {
  void bannerVisible.value
  const value = readConsent()
  return value === 'granted' ? 'privacyGranted' : value === 'denied' ? 'privacyDenied' : 'privacyUnset'
})
</script>

<template>
  <div class="kid-privacy">
    <button type="button" class="back" :aria-label="t('back')" @click="goBack">
      <ArrowLeft :size="22" />
    </button>
    <h1 class="kid-h1">{{ t('privacyTitle') }}</h1>
    <p class="kid-privacy-updated">{{ t('privacyUpdated') }}</p>

    <section>
      <h2>{{ t('privacyH1') }}</h2>
      <p>{{ t('privacyP1') }}</p>
    </section>
    <section>
      <h2>{{ t('privacyH2') }}</h2>
      <p>{{ t('privacyP2') }}</p>
    </section>
    <section>
      <h2>{{ t('privacyH3') }}</h2>
      <p>{{ t('privacyP3') }}</p>
    </section>
    <section>
      <h2>{{ t('privacyH4') }}</h2>
      <p>{{ t('privacyP4') }}</p>
    </section>
    <section>
      <h2>{{ t('privacyH5') }}</h2>
      <p>{{ t('privacyP5') }}</p>
    </section>
    <section>
      <h2>{{ t('privacyH6') }}</h2>
      <p>{{ t('privacyP6') }}</p>
    </section>

    <section class="kid-privacy-choice">
      <h2>{{ t('privacyChoice') }}</h2>
      <p>{{ t('privacyChoice') }}: {{ t(choiceKey) }}</p>
      <button type="button" class="kid-btn kid-btn-ghost" @click="clearConsent">{{ t('privacyChange') }}</button>
    </section>
  </div>
</template>
