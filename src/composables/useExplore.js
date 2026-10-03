import { ref } from 'vue'
import { settle, rangeOf } from '@/data/opPictures'
import '@/data/topicPictures'

// The numbers of one picture on a theory article: settled into their ranges
// (src/data/opPictures.js, topicPictures.js), moved one step at a time, and
// whether each is at an end of its range, for NumStepper.
export function useExplore(kind, onChange) {
  const values = ref(settle(kind))
  function bump(key, delta) {
    values.value = settle(kind, { ...values.value, [key]: values.value[key] + delta })
    onChange?.()
  }
  function edge(key) {
    const [lo, hi] = rangeOf(kind, values.value, key)
    return { atMin: values.value[key] <= lo, atMax: values.value[key] >= hi }
  }
  return { values, bump, edge }
}
