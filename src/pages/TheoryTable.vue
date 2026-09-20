<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import TimesTable from '@/components/TimesTable.vue'
import { t } from '@/i18n'
</script>

<template>
  <div class="kid-theory kid-tnav">
    <div class="col">
      <div class="kid-thead">
        <RouterLink to="/teoria" class="back kid-phone-only" :aria-label="t('back')">
          <ArrowLeft :size="22" />
        </RouterLink>
        <h1 class="kid-h1">{{ t('theoryTable') }}</h1>
      </div>
      <TimesTable />
    </div>
  </div>
</template>
