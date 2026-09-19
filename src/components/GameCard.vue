<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { X, RefreshCw } from 'lucide-vue-next'
import StarRow from '@/components/StarRow.vue'
import EarnedRow from '@/components/EarnedRow.vue'
import Celebration from '@/components/Celebration.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import TimerRing from '@/components/TimerRing.vue'
import settings from '@/store/settings'
import { t } from '@/i18n'

defineProps({
  round: { type: Object, required: true },
  // shown from 1024px only; the phone boards have no game title
  title: { type: String, default: '' },
  color: { type: String, default: 'var(--k-brand)' },
  // darker shade of `color`, used where the card colour fails contrast on white
  ink: { type: String, default: '' },
  timed: { type: Boolean, default: false },
})

// The on-screen keyboard covers the bottom of the page and only the *visual*
// viewport knows: neither iOS nor current Android shrinks the layout viewport,
// so no media query sees it. While it is up, the card is pinned to exactly the
// part of the screen that is left (and kid.css packs it tighter), so the field
// and both buttons stay in sight.
const kb = ref(null)
const vv = window.visualViewport

function onViewport() {
  // a keyboard takes a good third of a phone; a pinch-zoom (scale != 1) is not one
  const open = vv.scale === 1 && window.innerHeight - vv.height > 150
  kb.value = open ? { top: `${vv.offsetTop}px`, height: `${vv.height}px` } : null
}

onMounted(() => {
  vv?.addEventListener('resize', onViewport)
  vv?.addEventListener('scroll', onViewport)
})
onUnmounted(() => {
  vv?.removeEventListener('resize', onViewport)
  vv?.removeEventListener('scroll', onViewport)
})
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: round.flash === 'green', wrong: round.flash === 'red', kb }"
    :style="{ borderColor: color, borderWidth: '2px', '--k-display-op': color, '--k-ink': ink || color, ...kb }"
  >
    <Celebration v-if="round.flash === 'green'" :key="round.cheer" />

    <!-- closes the game; pinned to the card's corner, outside the status row -->
    <RouterLink to="/graj" class="kid-back" :aria-label="t('close')">
      <X :size="20" />
    </RouterLink>

    <div class="kid-status">
      <h1 v-if="title" class="kid-h1 kid-wide-only">{{ title }}</h1>
      <EarnedRow :earned="round.earned" />
      <div v-if="timed && settings.timerEnabled && round.strikes < 3" class="kid-timer-slot">
        <TimerRing
          :key="round.timerKey"
          :duration="round.cfg.seconds"
          @timeout="round.wrong()"
        />
      </div>
      <StarRow :streak="round.streak" :just-won="round.flash === 'green'" />
    </div>

    <slot />

    <div class="kid-strikes-row">
      <WrongAnswers :wrong="round.strikes" />
      <div class="kid-actions">
        <button class="kid-btn kid-btn-ghost" @click="round.newTask()">
          <RefreshCw :size="18" /> {{ t('newBtn') }}
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>
