<script setup>
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { sheetVariants } from '.'

const props = defineProps({
  side: { type: String, default: 'right' },
  class: { type: null, default: '' },
  forceMount: { type: Boolean, default: undefined },
  trapFocus: { type: Boolean, default: undefined },
})

const emits = defineEmits([
  'escapeKeyDown',
  'pointerDownOutside',
  'focusOutside',
  'interactOutside',
  'openAutoFocus',
  'closeAutoFocus',
])

const delegatedProps = computed(() => {
  const { class: _, side: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="kid-sheet-scrim fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      :class="cn(sheetVariants({ side }), props.class)"
      v-bind="forwarded"
    >
      <slot />
      <DialogClose class="kid-sheet-close">
        <X :size="18" :stroke-width="2.4" />
        <span class="sr-only">{{ t('close') }}</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
