import { ref } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import settings from '@/store/settings'
import { TOUR_STEPS, READ_ALOUD_MAX_CLASS, resolveSteps, pickVoice } from '@/data/tourSteps'
import { t } from '@/i18n'

// set by the class picker on a first-ever pick; the Play page shows the offer
export const offerTour = ref(false)

export const tourSeen = () => localStorage.getItem('tourSeen') === '1'
export const markTourSeen = () => localStorage.setItem('tourSeen', '1')

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
// Chrome fills the voice list lazily and answers [] to the first call; asking
// at import gives it time, and voiceFor() asks again on every step
synth?.getVoices()

const voiceFor = () => pickVoice(synth?.getVoices() ?? [], settings.lang)

function say(text) {
  const voice = voiceFor()
  if (!voice) return
  synth.cancel()
  const line = new SpeechSynthesisUtterance(text)
  line.voice = voice
  line.lang = voice.lang
  synth.speak(line)
}

// the first element carrying data-tour=key that is actually on screen
// (display:none, as the phone/desktop-only classes use, has no client rects)
function shown(key) {
  return [...document.querySelectorAll(`[data-tour="${key}"]`)]
    .find((el) => el.getClientRects().length > 0) ?? null
}

let active = null

export function startTour() {
  if (active?.isActive()) return
  const steps = resolveSteps(TOUR_STEPS, (key) => shown(key) !== null)
  if (!steps.length) return
  const autoRead = settings.schoolClass !== null && settings.schoolClass <= READ_ALOUD_MAX_CLASS

  const tour = driver({
    showProgress: true,
    progressText: t('tourProgress'),
    nextBtnText: t('tourNext'),
    prevBtnText: t('tourBack'),
    doneBtnText: t('tourDone'),
    // kid-root brings the theme's --k-* variables into the body-level popover
    popoverClass: 'kid-root kid-tour',
    steps: steps.map((s) => ({ element: () => shown(s.key), popover: { description: t(s.text) } })),
    onPopoverRender(popover, { state }) {
      const text = t(steps[state.activeIndex].text)
      // no voice for this language on this device: text only
      if (voiceFor()) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'kid-tour-say'
        btn.setAttribute('aria-label', t('tourRead'))
        btn.textContent = '🔊'
        btn.addEventListener('click', () => say(text))
        popover.footer.prepend(btn)
      }
      if (autoRead) say(text)
      else synth?.cancel()
    },
    onDestroyed() {
      synth?.cancel()
    },
  })
  active = tour
  tour.drive()
}
