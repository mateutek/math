<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Minus } from 'lucide-vue-next'
import AnimatedInteger from '@/components/animatedInteger.vue'
import WrongAnswers from '@/components/wrongAnswers.vue'
import Timer from '@/components/Timer.vue'
import { randomIntFromInterval } from '@/helpers/helpers'
import settings from '@/store/settings'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const route = useRoute()
const router = useRouter()

const timerDurations = [30, 20, 15]
const levelMinScale = [1, 10, 100]
const levelMaxScale = [10, 100, 1000]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const minuend = ref(1)
const subtrahend = ref(1)
const cardColor = ref('')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)

const answerInput = ref(null)

const cardClass = computed(() => {
  if (cardColor.value === 'green') return 'bg-green-900/40 transition-colors'
  if (cardColor.value === 'red') return 'bg-red-900/40 transition-colors'
  return 'transition-colors'
})

function generateNew(newLevel) {
  if (newLevel !== undefined && typeof newLevel === 'string') {
    tasksTotal.value -= 1
  }
  const index = level.value - 1
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]

  minuend.value = randomIntFromInterval(levelMin.value, levelMax.value)
  subtrahend.value = randomIntFromInterval(levelMin.value, levelMax.value)

  if (minuend.value < subtrahend.value) {
    minuend.value = subtrahend.value + randomIntFromInterval(1, levelMax.value)
  }

  solution.value = minuend.value - subtrahend.value
  answer.value = ''
  cardColor.value = ''
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardColor.value = 'green'
  setTimeout(() => {
    cardColor.value = ''
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
  if (parseInt(answer.value) === solution.value) {
    generateNew()
    answer.value = ''
    score.value += 1
    correctAnswer()
  } else {
    wrongAnswer()
  }
  nextTick(() => {
    answerInput.value?.$el?.focus?.()
  })
}

watch(
  () => route.params.level,
  (newLevel) => {
    level.value = newLevel
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
})
</script>

<template>
  <div class="container px-2 py-4 md:px-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <!-- Sidebar: level links -->
      <div class="order-2 md:order-1 md:col-span-2">
        <Card>
          <CardContent class="flex flex-col gap-1 p-2">
            <Button
              v-for="n in 3"
              :key="n"
              as-child
              variant="ghost"
              class="justify-start"
              :class="String(level) === String(n) ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
            >
              <RouterLink :to="`/odejmowanie/${n}`">Poziom: {{ n }}</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Main game card -->
      <div class="order-1 md:order-2 md:col-span-10">
        <Card :class="cardClass">
          <CardContent class="p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-xl font-semibold">
                Poziom {{ level }} (od {{ levelMin }} do {{ levelMax }})
              </h2>
              <WrongAnswers :wrong="wrongAnswers" />
              <Timer
                v-if="settings.timerEnabled"
                :key="timerKey"
                :duration="timerDurations[level - 1]"
                @timeout="wrongAnswer"
              />
              <h2 class="text-xl font-semibold">
                Punkty: {{ score }} z {{ tasksTotal }}
              </h2>
            </div>

            <h2 class="my-8 flex items-center justify-center gap-3 text-center text-5xl font-bold md:text-6xl">
              <AnimatedInteger :value="minuend" />
              <Minus class="h-10 w-10" />
              <AnimatedInteger :value="subtrahend" />
              <span>= {{ wrongAnswers === 3 ? solution : '?' }}</span>
            </h2>

            <Input
              ref="answerInput"
              v-model="answer"
              type="number"
              placeholder="Wynik"
              autofocus
              class="mb-4"
              @keyup.enter="checkAnswer"
            />

            <div class="flex items-center justify-between">
              <Button variant="secondary" @click="generateNew">
                Nowe zadanie
              </Button>
              <Button variant="primary" :disabled="wrongAnswers === 3" @click="checkAnswer">
                Sprawdź
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
