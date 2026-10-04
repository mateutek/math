<script setup>
import { nextTick } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import { offerTour, markTourSeen, startTour } from '@/composables/useTour'
import { t } from '@/i18n'

// any way out of the dialog (Yes, Skip, Escape, overlay) answers it for good
function answer(yes) {
  markTourSeen()
  offerTour.value = false
  if (yes) nextTick(startTour)
}
</script>

<template>
  <DialogRoot :open="offerTour" @update:open="(open) => !open && answer(false)">
    <DialogPortal>
      <DialogOverlay class="kid-offer-overlay" />
      <DialogContent class="kid-root kid-offer">
        <DialogTitle class="kid-offer-title">{{ t('tourOfferTitle') }}</DialogTitle>
        <DialogDescription class="kid-offer-text">{{ t('tourOfferText') }}</DialogDescription>
        <div class="kid-offer-btns">
          <button type="button" class="kid-btn kid-btn-ghost" @click="answer(false)">{{ t('tourSkip') }}</button>
          <button type="button" class="kid-btn kid-btn-primary" @click="answer(true)">{{ t('tourYes') }}</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
