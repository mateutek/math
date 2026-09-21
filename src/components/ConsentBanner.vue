<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { bannerVisible, needsConsent, setConsent } from '@/analytics'
import { t } from '@/i18n'

// shown once, right when the app mounts, if nothing was decided yet. The two
// buttons below and Privacy.vue's "change my choice" flip the same ref.
onMounted(() => {
  bannerVisible.value = needsConsent()
})
</script>

<template>
  <div v-if="bannerVisible" class="kid-consent" role="region" :aria-label="t('consentLabel')">
    <p>
      {{ t('consentText') }}
      <RouterLink to="/prywatnosc">{{ t('consentMore') }}</RouterLink>
    </p>
    <div class="btns">
      <button type="button" class="kid-btn kid-btn-primary" @click="setConsent('granted')">{{ t('consentAccept') }}</button>
      <button type="button" class="kid-btn kid-btn-ghost" @click="setConsent('denied')">{{ t('consentDecline') }}</button>
    </div>
  </div>
</template>
