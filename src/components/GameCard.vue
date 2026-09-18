<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import StarRow from '@/components/StarRow.vue'
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
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: round.flash === 'green', wrong: round.flash === 'red' }"
    :style="{ borderColor: color, borderWidth: '2px', '--k-display-op': color, '--k-ink': ink || color }"
  >
    <Celebration v-if="round.flash === 'green'" :key="round.cheer" />

    <div class="kid-status">
      <RouterLink to="/graj" class="kid-back" :aria-label="t('back')">
        <ArrowLeft :size="20" />
      </RouterLink>
      <h1 v-if="title" class="kid-h1 kid-wide-only">{{ title }}</h1>
      <div class="kid-score">
        <span class="num">{{ round.score }} / {{ round.total }}</span>
        <span class="cap">{{ t('points') }}</span>
      </div>
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
