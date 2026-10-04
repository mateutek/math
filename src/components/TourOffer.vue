<script setup>
import { nextTick, ref } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import { offerTour, markTourSeen, startTour } from '@/composables/useTour'
import { bannerVisible } from '@/analytics'
import { t } from '@/i18n'

const yesBtn = ref(null)

// any way out of the dialog (Yes, Skip, Escape, overlay) answers it for good
function answer(yes) {
  markTourSeen()
  offerTour.value = false
  if (yes) nextTick(startTour)
}
</script>

<template>
  <!-- waits for the consent answer so the tour never runs over the banner -->
  <DialogRoot :open="offerTour && !bannerVisible" @update:open="(open) => !open && answer(false)">
    <DialogPortal>
      <DialogOverlay class="kid-offer-overlay" />
      <DialogContent class="kid-root kid-offer" @open-auto-focus="(e) => { e.preventDefault(); yesBtn?.focus() }">
        <DialogTitle class="kid-offer-title">{{ t('tourOfferTitle') }}</DialogTitle>
        <DialogDescription class="kid-offer-text">{{ t('tourOfferText') }}</DialogDescription>
        <div class="kid-offer-btns">
          <button type="button" class="kid-btn kid-btn-ghost" @click="answer(false)">{{ t('tourSkip') }}</button>
          <button ref="yesBtn" type="button" class="kid-btn kid-btn-primary" @click="answer(true)">{{ t('tourYes') }}</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
