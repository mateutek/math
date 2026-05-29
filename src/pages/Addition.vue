<script setup name="addition">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Plus } from 'lucide-vue-next'
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
const levelMinScale = [2, 5, 20]
const levelMaxScale = [10, 100, 200]

const timerKey = ref(0)
const level = ref(0)
const score = ref(0)
const solution = ref(1)
const answer = ref('')
const addend1 = ref(1)
const addend2 = ref(1)
const cardFlash = ref('')
const tasksTotal = ref(0)
const wrongAnswers = ref(0)
const levelMin = ref(0)
const levelMax = ref(0)

const answerInput = ref(null)

let flashTimeout = null

function generateNew() {
  const index = level.value - 1
  levelMin.value = levelMinScale[index]
  levelMax.value = levelMaxScale[index]
  addend1.value = randomIntFromInterval(levelMin.value, levelMax.value)
  addend2.value = randomIntFromInterval(levelMin.value, levelMax.value)
  solution.value = addend1.value + addend2.value
  answer.value = ''
  cardFlash.value = ''
  tasksTotal.value += 1
  wrongAnswers.value = 0
  timerKey.value += 1
}

function correctAnswer() {
  cardFlash.value = 'bg-green-900/40 border-green-700'
  if (flashTimeout) clearTimeout(flashTimeout)
  flashTimeout = setTimeout(() => {
    cardFlash.value = ''
  }, 1000)
}

function wrongAnswer() {
  cardFlash.value = 'bg-red-900/40 border-red-700'
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
    level.value = newLevel || 1
  }
)

watch(level, () => {
  generateNew()
})

onMounted(() => {
  if (route.params.level === undefined) {
    router.push(`${route.path}/1`)
  }
  level.value = route.params.level || 1
  generateNew()
})
</script>

<template>
  <div class="container px-2 py-4 md:px-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
      <!-- Sidebar: level links -->
      <aside class="order-2 md:order-1 md:col-span-2">
        <Card>
          <CardContent class="p-2">
            <nav class="flex flex-col">
              <RouterLink
                v-for="n in 3"
                :key="n"
                :to="`/dodawanie/${n}`"
                class="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                :class="{ 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground': Number(level) === n }"
              >
                Poziom: {{ n }}
              </RouterLink>
            </nav>
          </CardContent>
        </Card>
      </aside>

      <!-- Main: task card -->
      <section class="order-1 md:order-2 md:col-span-10">
        <Card :class="['transition-colors duration-300', cardFlash]">
          <CardContent class="p-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <h2 class="text-xl font-semibold">
                Poziom {{ level }} (od {{ levelMin }} do {{ levelMax }})
              </h2>
              <WrongAnswers :wrong="wrongAnswers" />
              <timer
                v-if="settings.timerEnabled"
                :key="timerKey"
                :duration="timerDurations[level - 1]"
                @timeout="wrongAnswer"
              />
              <h2 class="text-xl font-semibold">Punkty: {{ score }} z {{ tasksTotal }}</h2>
            </div>

            <div class="my-10 flex items-center justify-center gap-4 text-5xl font-bold md:text-6xl">
              <animated-integer :value="addend1" />
              <Plus class="h-10 w-10 md:h-12 md:w-12" />
              <animated-integer :value="addend2" />
              <span>= {{ wrongAnswers === 3 ? solution : '?' }}</span>
            </div>

            <Input
              ref="answerInput"
              v-model="answer"
              type="number"
              placeholder="Wynik"
              autofocus
              class="mb-6"
              @keyup.enter="checkAnswer"
            />

            <div class="flex items-center justify-between gap-4">
              <Button variant="secondary" @click="generateNew">Nowe zadanie</Button>
              <Button variant="primary" :disabled="wrongAnswers === 3" @click="checkAnswer">
                Sprawdź
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  </div>
</template>
