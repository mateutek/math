<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Divide as DivideIcon } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import Timer from '@/components/Timer.vue'
import { randomIntFromInterval } from '@/helpers/helpers'
import settings from '@/store/settings'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const route = useRoute()
const router = useRouter()

const timerDurations = [30, 20, 15]
const divisorMinScale = [1, 2, 2]
const divisorMaxScale = [9, 15, 15]
const multiplierMinScale = [1, 2, 2]
const multiplierMaxScale = [9, 9, 15]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answerTotal = ref('')
const dividend = ref(1)
const divisor = ref(1)
const cardColor = ref('default')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)

const answerTotalInput = ref(null)

const cardFlashClass = computed(() => {
  if (cardColor.value === 'green') return 'bg-green-900/40 border-green-700'
  if (cardColor.value === 'red') return 'bg-red-900/40 border-red-700'
  return ''
})

function focusAnswer() {
  nextTick(() => {
    const el = answerTotalInput.value?.$el ?? answerTotalInput.value
    el?.focus?.()
  })
}

function generateNew(newLevel) {
  if (newLevel !== undefined && typeof newLevel === 'string') {
    tasksTotal.value -= 1
  }
  const index = level.value - 1
  const divisorMin = divisorMinScale[index]
  const divisorMax = divisorMaxScale[index]
  const multiplierMin = multiplierMinScale[index]
  const multiplierMax = multiplierMaxScale[index]

  divisor.value = randomIntFromInterval(divisorMin, divisorMax)
  const multiplier = randomIntFromInterval(multiplierMin, multiplierMax)
  dividend.value = divisor.value * multiplier

  solution.value = multiplier
  answerTotal.value = ''
  cardColor.value = 'default'
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  setTimeout(() => {
    cardColor.value = 'default'
  }, 1000)
}

function wrongAnswer() {
  cardColor.value = 'red'
  wrongAnswers.value += 1
  if (wrongAnswers.value < 3) {
    timerKey.value += 1
  }
}

function checkAnswer() {
  if (parseInt(answerTotal.value) === solution.value) {
    generateNew()
    answerTotal.value = ''
    score.value += 1
    correctAnswer()
  } else {
    wrongAnswer()
  }
  focusAnswer()
}

watch(
  () => route.params.level,
  (newLevel) => {
    level.value = newLevel || 1
  }
)

watch(level, (newLevel) => {
  generateNew(newLevel)
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = route.params.level
  generateNew()
  focusAnswer()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div class="order-2 md:order-1 md:col-span-2">
        <Card class="p-2">
          <nav class="flex flex-col">
            <RouterLink
              v-for="n in 3"
              :key="n"
              :to="`/dzielenie2/${n}`"
              class="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Poziom: {{ n }}
            </RouterLink>
          </nav>
        </Card>
      </div>

      <div class="order-1 md:order-2 md:col-span-10">
        <Card :class="['transition-colors duration-300', cardFlashClass]">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-4">
              <h2 class="text-xl font-semibold">Poziom {{ level }}</h2>
              <WrongAnswers :wrong="wrongAnswers" />
              <Timer
                v-if="settings.timerEnabled"
                :duration="timerDurations[level - 1]"
                :key="timerKey"
                @timeout="wrongAnswer"
              />
              <h2 class="text-xl font-semibold">
                Punkty: {{ score }} z {{ tasksTotal }}
              </h2>
            </div>
          </CardHeader>

          <CardContent class="space-y-6">
            <div class="flex items-center justify-center gap-3 text-5xl font-bold md:text-6xl">
              <AnimatedInteger :value="dividend" />
              <DivideIcon class="size-10 md:size-12" />
              <AnimatedInteger :value="divisor" />
              <span>=</span>
              <span>{{ wrongAnswers === 3 ? solution : '?' }}</span>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium text-muted-foreground">Wynik</label>
              <Input
                ref="answerTotalInput"
                type="number"
                v-model="answerTotal"
                autofocus
                @keyup.enter="checkAnswer"
              />
            </div>

            <div class="flex items-center justify-between">
              <Button variant="secondary" @click="generateNew">
                Nowe zadanie
              </Button>
              <Button variant="primary" @click="checkAnswer">
                Sprawdź
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
