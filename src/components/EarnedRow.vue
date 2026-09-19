<script setup>
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import { t } from '@/i18n'

// what this sitting has earned so far: { wood, stone, food, coins }
const props = defineProps({
  earned: { type: Object, required: true },
})

const rows = computed(() => Object.entries(props.earned).filter(([, n]) => n > 0))
</script>

<template>
  <div class="kid-score">
    <span class="num kid-earned">
      <span v-for="[kind, n] in rows" :key="kind" role="img" :aria-label="`${t(kind)}: ${n}`">
        {{ n }}<MaterialIcon :kind="kind" />
      </span>
      <template v-if="!rows.length">0</template>
    </span>
    <span class="cap">{{ t('earned') }}</span>
  </div>
</template>
