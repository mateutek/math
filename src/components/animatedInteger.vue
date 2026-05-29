<template>
  <span>{{ rounded }}</span>
</template>

<script setup name="animated-integer">
import { ref, computed, watch, onMounted } from 'vue'
import { useTransition } from '@vueuse/core'

const props = defineProps({
  value: {
    type: Number,
    required: true,
  },
})

const source = ref(0)

const output = useTransition(source, {
  duration: 500,
})

const rounded = computed(() => output.value.toFixed(0))

watch(
  () => props.value,
  (newValue) => {
    source.value = newValue
  }
)

onMounted(() => {
  source.value = props.value
})
</script>
