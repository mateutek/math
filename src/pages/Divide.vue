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
const levelMinScale = [2, 10, 100]
const levelMaxScale = [10, 100, 200]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solutionTotal = ref(1)
const solutionRest = ref(0)
const answerTotal = ref('')
const answerRest = ref('')
const dividend = ref(1)
const divisor = ref(1)
const cardColor = ref('default')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)

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
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]

  dividend.value = randomIntFromInterval(levelMin.value, levelMax.value)
  divisor.value = randomIntFromInterval(levelMin.value, levelMax.value)

  if (dividend.value < divisor.value) {
    dividend.value = divisor.value + randomIntFromInterval(1, levelMax.value)
  }

  solutionTotal.value = Math.floor(dividend.value / divisor.value)
  solutionRest.value = dividend.value - solutionTotal.value * divisor.value
  answerTotal.value = ''
  answerRest.value = ''
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
  if (
    parseInt(answerTotal.value) === solutionTotal.value &&
    parseInt(answerRest.value) === solutionRest.value
  ) {
    generateNew()
    answerTotal.value = ''
    answerRest.value = ''
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
              :to="`/dzielenie/${n}`"
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
              <h2 class="text-xl font-semibold">
                Poziom {{ level }} (od {{ levelMin }} do {{ levelMax }})
              </h2>
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
              <span>
                {{ wrongAnswers === 3 ? `${solutionTotal} r ${solutionRest}` : '?' }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="space-y-1">
                <label class="text-sm font-medium text-muted-foreground">Całość</label>
                <Input
                  ref="answerTotalInput"
                  type="number"
                  v-model="answerTotal"
                  autofocus
                  @keyup.enter="checkAnswer"
                />
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium text-muted-foreground">Reszta</label>
                <Input
                  type="number"
                  v-model="answerRest"
                  @keyup.enter="checkAnswer"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <Button variant="secondary" @click="generateNew">
                Nowe zadanie
              </Button>
              <Button variant="primary" @click="checkAnswer" :disabled="wrongAnswers === 3">
                Sprawdź
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
