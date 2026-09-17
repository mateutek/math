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
  base: { type: String, required: true },
  color: { type: String, default: 'var(--k-brand)' },
  ranges: { type: Array, default: () => ['', '', ''] },
  timed: { type: Boolean, default: false },
})

const timerDurations = [30, 20, 15]
</script>

<template>
  <div
    class="kid-card"
    :class="{ correct: round.flash === 'green', wrong: round.flash === 'red' }"
    :style="{ borderColor: color, borderWidth: '2px', '--k-display-op': color }"
  >
    <Celebration v-if="round.flash === 'green'" :key="round.cheer" />

    <div class="kid-status">
      <RouterLink to="/graj" class="kid-back" :aria-label="t('back')">
        <ArrowLeft :size="20" />
      </RouterLink>
      <div class="kid-score">
        <span class="num">{{ round.score }} / {{ round.total }}</span>
        <span class="cap">{{ t('points') }}</span>
      </div>
      <div v-if="timed && settings.timerEnabled && round.strikes < 3" class="kid-timer-slot">
        <TimerRing
          :key="round.timerKey"
          :duration="timerDurations[round.level - 1]"
          @timeout="round.wrong()"
        />
      </div>
      <StarRow :streak="round.streak" :just-won="round.flash === 'green'" />
    </div>

    <div class="kid-levels">
      <RouterLink
        v-for="n in 3"
        :key="n"
        class="kid-pill"
        :class="{ active: round.level === n }"
        :to="`${base}/${n}`"
      >
        <span class="pl">{{ t('level') }} {{ n }}</span>
        <span class="rg">{{ ranges[n - 1] }}</span>
      </RouterLink>
    </div>

    <slot />

    <div style="display: flex; justify-content: center">
      <WrongAnswers :wrong="round.strikes" />
    </div>

    <div class="kid-actions">
      <button class="kid-btn kid-btn-ghost" @click="round.newTask()">
        <RefreshCw :size="18" /> {{ t('newBtn') }}
      </button>
      <slot name="action" />
    </div>
  </div>
</template>
