// Self-check for the kid tour. Runs under plain node:
//   node src/data/tourSteps.check.js
// Reads i18n.js as TEXT (it imports the Vue settings store and cannot be
// loaded here), sliced into pl and en halves like theory.check.js does.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TOUR_STEPS, resolveSteps, pickVoice } from './tourSteps.js'

const EM_DASH = String.fromCharCode(0x2014)
const i18nSrc = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8')
const cut = i18nSrc.indexOf('\n  en: {')
const BLOCK = { pl: i18nSrc.slice(i18nSrc.indexOf('\n  pl: {'), cut), en: i18nSrc.slice(cut) }

function stringFor(lang, key) {
  const found = BLOCK[lang].match(new RegExp(`\\n    ${key}: '([^'\\\\]*)'`))
  return found ? found[1] : null
}

function needsKey(key) {
  for (const lang of ['pl', 'en']) {
    const value = stringFor(lang, key)
    assert.ok(value !== null, `${lang} has no "${key}"`)
    assert.ok(value.trim() !== '', `${lang} "${key}" is empty`)
    assert.ok(!value.includes(EM_DASH), `${lang} "${key}" has an em dash`)
  }
}

// every step and every phone fallback says something in both languages
for (const step of TOUR_STEPS) {
  assert.ok(step.key, 'a step has no data-tour key')
  needsKey(step.text)
  if (step.phone) needsKey(step.phoneText)
}

// the chrome around the steps, the offer and the parent page
;[
  'tourOfferTitle', 'tourOfferText', 'tourYes', 'tourSkip', 'tourReplay',
  'tourNext', 'tourBack', 'tourDone', 'tourRead', 'tourProgress',
  'parents', 'parentsLink', 'parentsLead', 'parentsClassesH',
  'parentsRewardsH', 'parentsRewardsP', 'parentsTheoryH', 'parentsTheoryP',
  'parentsTestsH', 'parentsTestsP', 'parentsPrivacyP',
].forEach(needsKey)

// desktop: everything visible, all nine steps in order
const all = resolveSteps(TOUR_STEPS, () => true)
assert.deepEqual(all.map((s) => s.key), TOUR_STEPS.map((s) => s.key))

// phone: theory, tests and the side column are hidden, the "more" button is
// not; theory and tests collapse into ONE step on it, the side step is dropped
const phoneHidden = new Set(['tab-theory', 'tab-tests', 'side'])
const phone = resolveSteps(TOUR_STEPS, (key) => !phoneHidden.has(key))
assert.deepEqual(phone.map((s) => s.key), [
  'class', 'games', 'materials', 'tab-village', 'tab-play', 'tab-more', 'settings',
])
assert.equal(phone.find((s) => s.key === 'tab-more').text, 'tourMore')

// nothing visible: no steps, no crash
assert.deepEqual(resolveSteps(TOUR_STEPS, () => false), [])

// voices: Android reports "pl_PL", desktop "pl-PL"; no match is null
assert.equal(pickVoice([{ lang: 'en-US' }, { lang: 'pl-PL' }], 'pl').lang, 'pl-PL')
assert.equal(pickVoice([{ lang: 'en_GB' }], 'en').lang, 'en_GB')
assert.equal(pickVoice([{ lang: 'de-DE' }], 'pl'), null)
assert.equal(pickVoice([], 'en'), null)

console.log('tourSteps: ok')
