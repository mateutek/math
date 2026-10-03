<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Printer, KeyRound, RotateCcw, X, Plus, Pencil, Shuffle, Check } from 'lucide-vue-next'
import MathParts from '@/components/MathParts.vue'
import { sectionsFor, question, MAX_PER_SECTION, editable, toText, answerText, fromText } from '@/games/tests'
import { GAMES } from '@/data/games'
import settings, { classConfig } from '@/store/settings'
import { t, tp } from '@/i18n'

const className = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)
const look = Object.fromEntries(GAMES.map((g) => [g.id, g]))

// one entry per section the class can have: { id, instr, on, items }. The
// questions are drawn once and kept, so the list on screen is what prints.
const sections = ref([])

function fill(s, n) {
  while (s.items.length < n) s.items.push(question(s.id, classConfig.value, settings.topicLevel[s.id] ?? 1, s.items))
}

function reset() {
  sections.value = sectionsFor(classConfig.value).map((s) => {
    const x = { id: s.id, instr: s.instr, on: true, items: [] }
    fill(x, s.count)
    return x
  })
}
watch(classConfig, reset, { immediate: true })

const inc = (s) => fill(s, Math.min(MAX_PER_SECTION, s.items.length + 1))
const dec = (s) => s.items.length > 1 && s.items.pop()
const remove = (s, i) => s.items.splice(i, 1)
// a different random question in the same place
const swap = (s, i) =>
  s.items.splice(i, 1, question(s.id, classConfig.value, settings.topicLevel[s.id] ?? 1, s.items))

// One question at a time is open for a hand edit: the question as text with
// '?' for the blank, and its answer for the key.
const editing = ref(null) // the item being edited
const draft = ref({ text: '', answer: '' })
const parsed = computed(() => fromText(draft.value.text, draft.value.answer))
function edit(q) {
  editing.value = q
  draft.value = { text: toText(q, t('of')), answer: answerText(q) }
}
function save(s, i) {
  if (!parsed.value) return
  s.items.splice(i, 1, parsed.value)
  editing.value = null
}

// the sections that print, their questions numbered straight through
const numbered = computed(() => {
  let n = 0
  return sections.value
    .filter((s) => s.on && s.items.length)
    .map((s) => ({ src: s, qs: s.items.map((q) => ({ ...q, item: q, n: ++n })) }))
})
const total = computed(() => numbered.value.reduce((sum, s) => sum + s.qs.length, 0))
const title = computed(() => `${t('testTitle')} · ${className.value}`)

// The test and its key print as two separate sheets, so the answers never
// share a page with the questions. The sheet below is print-only; this picks
// which one it draws before the browser's print dialog opens.
const mode = ref('test')
async function print(which) {
  mode.value = which
  await nextTick()
  window.print()
}
</script>

<template>
  <div class="kid-tests">
    <section class="kid-panel set">
      <div class="kid-thead">
        <h1 class="kid-h1">{{ t('tests') }}</h1>
        <span class="kid-class-pill">{{ className }}</span>
      </div>
      <p class="kid-tlead">{{ t('testsLead') }}</p>
      <div class="kid-tlist">
        <div
          v-for="s in sections"
          :key="s.id"
          class="kid-trow"
          :class="{ off: !s.on }"
          :style="{ '--g': look[s.id].color, '--ink': look[s.id].ink }"
        >
          <label class="pick">
            <input v-model="s.on" type="checkbox" />
            <span class="tile" aria-hidden="true">{{ look[s.id].symbol }}</span>
            <span class="txt">
              <span class="name">{{ t(s.id) }}</span>
              <span class="ex">{{ t(s.instr) }}</span>
            </span>
          </label>
          <span class="kid-step" role="group" :aria-label="t('testCountLabel') + ': ' + t(s.id)">
            <button type="button" :disabled="!s.on || s.items.length <= 1" :aria-label="t('testFewer')" @click="dec(s)">−</button>
            <span>{{ s.items.length }}</span>
            <button type="button" :disabled="!s.on || s.items.length >= MAX_PER_SECTION" :aria-label="t('testMore')" @click="inc(s)">+</button>
          </span>
        </div>
      </div>
    </section>

    <section class="list">
      <div class="kid-thead">
        <h2>{{ t('testQuestions') }}</h2>
        <span class="kid-class-pill">{{ tp('testCount', total) }}</span>
        <button type="button" class="kid-btn kid-btn-ghost redo" @click="reset">
          <RotateCcw :size="16" /> {{ t('testNew') }}
        </button>
      </div>
      <div v-for="s in numbered" :key="s.src.id" class="kid-tsec">
        <div class="head">
          <h3>{{ t(s.src.instr) }} <span>{{ t(s.src.id) }}</span></h3>
          <button
            type="button"
            class="add"
            :disabled="s.src.items.length >= MAX_PER_SECTION"
            :aria-label="t('testMore') + ': ' + t(s.src.id)"
            @click="inc(s.src)"
          >
            <Plus :size="16" /> {{ t('testAdd') }}
          </button>
        </div>
        <template v-for="(q, i) in s.qs" :key="q.n + JSON.stringify(q.parts)">
          <form v-if="editing === q.item" class="kid-tq kid-tedit" @submit.prevent="save(s.src, i)">
            <span class="n">{{ q.n }}.</span>
            <label>
              <span>{{ t('testEditQ') }}</span>
              <input v-model="draft.text" class="kid-input" autocomplete="off" />
            </label>
            <label class="ans">
              <span>{{ t('testEditA') }}</span>
              <input v-model="draft.answer" class="kid-input" autocomplete="off" />
            </label>
            <button type="submit" class="x ok" :disabled="!parsed" :aria-label="t('testEditSave')"><Check :size="16" /></button>
            <button type="button" class="x" :aria-label="t('testEditCancel')" @click="editing = null"><X :size="16" /></button>
            <p class="hint">{{ t('testEditHint') }}</p>
          </form>
          <div v-else class="kid-tq">
            <span class="n">{{ q.n }}.</span>
            <span class="kid-eq"><MathParts :parts="q.parts" /></span>
            <button type="button" class="x" :aria-label="tp('testSwap', q.n)" @click="swap(s.src, i)">
              <Shuffle :size="16" />
            </button>
            <button v-if="editable(q)" type="button" class="x" :aria-label="tp('testEdit', q.n)" @click="edit(q.item)">
              <Pencil :size="16" />
            </button>
            <button type="button" class="x" :aria-label="tp('testRemove', q.n)" @click="remove(s.src, i)">
              <X :size="16" />
            </button>
          </div>
        </template>
      </div>
      <div class="kid-actions">
        <button type="button" class="kid-btn kid-btn-primary" :disabled="!total" @click="print('test')">
          <Printer :size="18" /> {{ t('testPrint') }}
        </button>
        <button type="button" class="kid-btn kid-btn-ghost" :disabled="!total" @click="print('key')">
          <KeyRound :size="18" /> {{ t('testPrintKey') }}
        </button>
      </div>
    </section>

    <!-- print only: plain black on white, one sheet at a time -->
    <article class="kid-paper">
      <header>
        <div class="top">
          <img src="/logo-mark.svg" width="26" height="26" alt="" />
          <span class="brand">{{ t('appNameA') }}<b>{{ t('appNameB') }}</b></span>
          <span class="meta">{{ mode === 'key' ? title : tp('testCount', total) }}</span>
        </div>
        <h1>{{ mode === 'key' ? t('testKey') : title }}</h1>
        <div v-if="mode === 'test'" class="fields">
          <span>{{ t('testName') }}<i></i></span>
          <span>{{ t('testDate') }}<i></i></span>
          <span>{{ t('testPoints') }}<i class="pts"></i>/ {{ total }}</span>
        </div>
      </header>
      <section v-for="(s, si) in numbered" :key="s.src.id">
        <h2><span class="num">{{ si + 1 }}</span>{{ t(s.src.instr) }} <small>{{ t(s.src.id) }}</small></h2>
        <ol>
          <li v-for="q in s.qs" :key="q.n">
            <span class="n">{{ q.n }}.</span>
            <span class="q"><MathParts :parts="q.parts" :reveal="mode === 'key' ? q.answer : null" /></span>
          </li>
        </ol>
      </section>
    </article>
  </div>
</template>
