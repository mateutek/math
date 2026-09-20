<script setup>
import settings from '@/store/settings'
import { t } from '@/i18n'
</script>

<template>
  <div class="kid-lang" role="group" :aria-label="t('language')">
    <button :class="{ on: settings.lang === 'pl' }" :aria-pressed="settings.lang === 'pl'" @click="settings.lang = 'pl'">PL</button>
    <button :class="{ on: settings.lang === 'en' }" :aria-pressed="settings.lang === 'en'" @click="settings.lang = 'en'">EN</button>
  </div>
</template>
