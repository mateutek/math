<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { SlidersHorizontal, Timer, Copy, Monitor, Sun, Moon, ChevronRight } from 'lucide-vue-next'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import settings, { classConfig } from '@/store/settings'
import { exportSave, checkSave, importSave, reset } from '@/store/village'
import { t, tp } from '@/i18n'
import LangSwitch from '@/components/LangSwitch.vue'

// "Klasa 2", or "Zerówka" for the pre-school class
const className = computed(() =>
  classConfig.value.id === 0 ? t('classZero') : tp('classLabel', classConfig.value.id),
)

// reads the whole village, so it re-computes whenever anything in it changes
const saveString = computed(() => exportSave())
const { copy, copied } = useClipboard({ source: saveString, legacy: true })

const pasted = ref('')
const importFailed = ref(false)

function onLoad() {
  // the pasted text is untrusted: validate first, only then ask to overwrite
  importFailed.value = !checkSave(pasted.value)
  if (importFailed.value) return
  if (!window.confirm(t('confirmImport'))) return
  importSave(pasted.value)
  pasted.value = ''
}

function onReset() {
  if (window.confirm(t('confirmReset'))) reset()
}

const themes = [
  { value: 'auto', label: 'themeAuto', icon: Monitor },
  { value: 'day', label: 'themeDay', icon: Sun },
  { value: 'night', label: 'themeNight', icon: Moon },
]
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <button class="kid-gear" :aria-label="t('settings')"><SlidersHorizontal :size="20" /></button>
    </SheetTrigger>
    <SheetContent class="kid-root kid-sheet">
      <SheetHeader class="kid-sheet-head">
        <SheetTitle class="kid-sheet-title">{{ t('settings') }}</SheetTitle>
        <SheetDescription class="kid-sheet-desc">{{ t('settingsDesc') }}</SheetDescription>
      </SheetHeader>

      <div class="kid-set">
        <span class="kid-set-label">{{ t('language') }}</span>
        <LangSwitch />
      </div>

      <RouterLink to="/klasa" class="kid-set kid-set-link">
        <span class="kid-set-text">
          <span class="kid-set-label">{{ t('classRow') }}</span>
          <span class="kid-set-hint">{{ t('classRowHint') }}</span>
        </span>
        <span class="kid-class-pill">{{ className }}</span>
        <ChevronRight :size="18" :stroke-width="2.4" class="kid-set-chev" />
      </RouterLink>

      <div class="kid-set col theme">
        <span id="theme-label" class="kid-set-label">{{ t('theme') }}</span>
        <div class="kid-theme" role="group" aria-labelledby="theme-label">
          <button
            v-for="option in themes"
            :key="option.value"
            :class="{ on: settings.theme === option.value }"
            :aria-pressed="settings.theme === option.value"
            @click="settings.theme = option.value"
          >
            <component :is="option.icon" :size="16" :stroke-width="2.2" />{{ t(option.label) }}
          </button>
        </div>
        <p class="kid-theme-hint">{{ t('themeHint') }}</p>
      </div>

      <div class="kid-set">
        <span class="kid-zegar"><Timer :size="17" :stroke-width="2.2" /> {{ t('timer') }}</span>
        <button
          class="kid-switch-btn"
          role="switch"
          :aria-checked="settings.timerEnabled"
          :aria-label="t('timer')"
          @click="settings.timerEnabled = !settings.timerEnabled"
        >
          <span class="kid-switch" :aria-checked="settings.timerEnabled"></span>
        </button>
      </div>

      <div class="kid-set col">
        <label class="kid-set-label" for="save-out">{{ t('exportSave') }}</label>
        <textarea id="save-out" class="kid-save" rows="3" readonly :value="saveString" @focus="$event.target.select()" />
        <button class="kid-btn kid-btn-ghost" @click="copy()">
          <Copy :size="17" :stroke-width="2.2" /> {{ t(copied ? 'copied' : 'copy') }}
        </button>
      </div>

      <div class="kid-set col">
        <label class="kid-set-label" for="save-in">{{ t('importSave') }}</label>
        <textarea
          id="save-in"
          v-model="pasted"
          class="kid-save"
          :class="{ bad: importFailed }"
          rows="3"
          :placeholder="t('importPlaceholder')"
          @input="importFailed = false"
        />
        <p v-if="importFailed" class="kid-set-error" role="alert">{{ t('importError') }}</p>
        <button class="kid-btn kid-btn-primary" :disabled="!pasted.trim()" @click="onLoad">{{ t('load') }}</button>
      </div>

      <div class="kid-set col">
        <button class="kid-btn kid-danger" @click="onReset">{{ t('resetVillage') }}</button>
      </div>
    </SheetContent>
  </Sheet>
</template>
