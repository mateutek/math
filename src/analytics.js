// Google Analytics 4, loaded only after a parent says yes (see ConsentBanner).
// Nothing is sent to Google before that, and ad features are off for good:
// this is an app for children. With GA_ID empty the whole thing is inert.
import { ref } from 'vue'

export const GA_ID = 'G-3YBQN8330X' // the G-... measurement ID of the Liczbowo web stream

const KEY = 'consent'

// Shared with ConsentBanner.vue (which shows itself when this flips true) and
// Privacy.vue (which can bring the banner back). A module-level ref is the
// smallest thing that works: no store, no event bus.
export const bannerVisible = ref(false)

let started = false

export function readConsent() {
  let value = null
  try {
    value = localStorage.getItem(KEY)
  } catch {
    // storage unavailable (private mode, disabled cookies): treat as unset
  }
  return value === 'granted' || value === 'denied' ? value : null
}

function startAnalytics() {
  if (started || !GA_ID) return
  started = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
  document.head.appendChild(script)
}

export function setConsent(value) {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // storage unavailable: the choice only holds for this page load
  }
  bannerVisible.value = false
  if (value !== 'granted') return
  startAnalytics()
  // the visitor is on this page right now; the next page views come from
  // router.afterEach
  trackPage(location.pathname, document.title)
}

// Removing the stored choice shows the banner again. If analytics was already
// running it keeps running for this page load (started stays true); only a
// reload actually stops it.
export function clearConsent() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing was stored anyway
  }
  bannerVisible.value = needsConsent()
}

// Called once at app start: resumes analytics for a visitor who already said yes.
export function startIfGranted() {
  if (readConsent() === 'granted') startAnalytics()
}

export function trackPage(path, title) {
  if (!started) return
  window.gtag('event', 'page_view', { page_path: path, page_title: title, page_location: location.href })
}

export function needsConsent() {
  return GA_ID !== '' && readConsent() === null
}
