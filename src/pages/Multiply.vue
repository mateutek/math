<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { X } from 'lucide-vue-next'
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
const levelMinScale = [1, 5, 10]
const levelMaxScale = [10, 20, 30]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const multiplicand = ref(1)
const multiplayer = ref(1)
const cardColor = ref('')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)

const answerInput = ref(null)

const cardFlashClass = computed(() => {
  if (cardColor.value === 'green') return 'bg-green-900 text-white'
  if (cardColor.value === 'red') return 'bg-red-900 text-white'
  return ''
})

function generateNew() {
  const index = level.value - 1
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]

  multiplicand.value = randomIntFromInterval(levelMin.value, levelMax.value)
  multiplayer.value = randomIntFromInterval(levelMin.value, levelMax.value)
  solution.value = multiplicand.value * multiplayer.value
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

function focusAnswer() {
  nextTick(() => {
    answerInput.value?.$el?.focus?.()
  })
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
  focusAnswer()
}

watch(
  () => route.params.level,
  (newLevel) => {
    level.value = parseInt(newLevel) || 1
  }
)

watch(level, () => {
  generateNew()
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = parseInt(route.params.level) || 1
  generateNew()
})
</script>

<template>
  <div class="container px-2 py-4 md:px-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <!-- Sidebar -->
      <div class="order-2 md:order-1 md:col-span-2">
        <Card>
          <CardContent class="flex flex-col gap-1 p-2">
            <Button
              v-for="n in 3"
              :key="n"
              as-child
              variant="ghost"
              class="justify-start"
              :class="level === n ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
            >
              <RouterLink :to="`/mnozenie/${n}`">Poziom: {{ n }}</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Main -->
      <div class="order-1 md:order-2 md:col-span-10">
        <Card :class="['transition-colors duration-300', cardFlashClass]">
          <CardContent class="p-6">
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
              <h2 class="text-xl font-semibold">Punkty: {{ score }} z {{ tasksTotal }}</h2>
            </div>

            <h2 class="my-8 flex items-center justify-center gap-3 text-5xl font-bold md:text-6xl">
              <AnimatedInteger :value="multiplicand" />
              <X class="h-10 w-10 md:h-12 md:w-12" />
              <AnimatedInteger :value="multiplayer" />
              <span>= {{ wrongAnswers === 3 ? solution : '?' }}</span>
            </h2>

            <Input
              ref="answerInput"
              type="number"
              v-model="answer"
              placeholder="Wynik"
              autofocus
              class="my-4"
              @keyup.enter="checkAnswer"
            />

            <div class="flex items-center justify-between">
              <Button variant="secondary" @click="generateNew">Nowe zadanie</Button>
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
