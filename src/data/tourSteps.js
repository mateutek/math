// The kid tour of the Play page, as plain data so node can check it. `key` is
// the data-tour attribute the step points at, `text` its i18n key. A step with
// `phone` falls back to that element when its own is hidden (the phone bar
// keeps Theory and Tests behind one "more" button).
export const TOUR_STEPS = [
  { key: 'class', text: 'tourClass' },
  { key: 'games', text: 'tourGames' },
  { key: 'materials', text: 'tourMaterials' },
  { key: 'tab-village', text: 'tourVillage' },
  { key: 'tab-play', text: 'tourPlay' },
  { key: 'tab-theory', text: 'tourTheory', phone: 'tab-more', phoneText: 'tourMore' },
  { key: 'tab-tests', text: 'tourTests', phone: 'tab-more', phoneText: 'tourMore' },
  { key: 'side', text: 'tourSide' },
  { key: 'settings', text: 'tourSettings' },
]

// classes up to this one hear every step read out without asking
export const READ_ALOUD_MAX_CLASS = 3

// The steps this screen can show: own element if visible, else the phone
// fallback, else dropped. Two steps landing on the same fallback in a row
// become one.
export function resolveSteps(steps, isVisible) {
  const out = []
  for (const step of steps) {
    const picked = isVisible(step.key)
      ? { key: step.key, text: step.text }
      : step.phone && isVisible(step.phone)
        ? { key: step.phone, text: step.phoneText }
        : null
    if (picked && out.at(-1)?.key !== picked.key) out.push(picked)
  }
  return out
}

// a voice for 'pl' or 'en'; Android spells the tag with an underscore
export function pickVoice(voices, lang) {
  return voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang)) ?? null
}
