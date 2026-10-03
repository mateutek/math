<script setup>
import TimesTable from '@/components/TimesTable.vue'
import TheoryCrumbs from '@/components/TheoryCrumbs.vue'
import { t } from '@/i18n'
</script>

<template>
  <div class="kid-theory">
    <TheoryCrumbs />
    <h1 class="kid-h1">{{ t('theoryTable') }}</h1>
    <TimesTable />
  </div>
</template>
