<template>
  <v-container>
    <v-row>
      <v-col lg="2" md="2" sm="12" cols="12" order="2" order-md="1">
        <v-sheet rounded="lg">
          <v-list color="transparent">
            <v-list-item-group>
              <v-list-item
                  v-for="n in 3"
                  :key="n"
                  link
                  :to="`/dzielenie2/${n}`"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Poziom: {{ n }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-sheet>
      </v-col>

      <v-col lg="10" md="10" sm="12" cols="12" order="1" order-md="2">
        <v-card
            rounded="lg"
            :color="cardColor"
        >
          <v-col>
            <v-row no-gutters justify="space-between" align="center">
               <h2>Poziom {{level}}</h2>
              <wrong-answers :wrong="wrongAnswers"/>
              <timer v-if="settings.timerEnabled" :duration="timerDurations[level-1]" :key="timerKey" @timeout="wrongAnswer"/>
              <h2>Punkty: {{score}} z {{tasksTotal}}</h2>
            </v-row>
            <h2 class="text-center text-h2 justify-center align-center d-flex">
              <animated-integer v-bind:value="dividend"/>
              <v-icon>mdi-division</v-icon>
              <animated-integer v-bind:value="divisor"/>
              = {{wrongAnswers === 3 ? solution : '?'}}
            </h2>
            <v-row gutters>
              <v-col>
                <v-text-field
                    ref="answerTotal"
                    type="number"
                    v-model="answerTotal"
                    label="Wynik"
                    required
                    autofocus
                    v-on:keyup.enter="checkAnswer"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row no-gutters justify="space-between">
              <v-btn color="secondary" v-on:click="generateNew">
                Nowe zadanie
              </v-btn>
              <v-btn color="primary" v-on:click="checkAnswer">
                Sprawdź
              </v-btn>
            </v-row>
          </v-col>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AnimatedInteger from '@/components/animatedInteger';
import WrongAnswers from '@/components/wrongAnswers';
import Timer from '@/components/Timer';
import {randomIntFromInterval} from '@/helpers/helpers';
import settings from '@/store/settings';

export default {
  name: 'Divide_2',
  components: {WrongAnswers, AnimatedInteger, Timer},
  created() {
    if(this.$route.params.level === undefined) {
      this.$router.push(`${this.$route.path}/1`);
    }
    this.level = this.$route.params.level;
    this.generateNew();
  },
  watch: {
    $route(to) {
      this.level = to.params.level;
    },
    level(newLevel) {
      this.generateNew(newLevel);
    }
  },
  data: () => ({
    settings,
    timerDurations: [30, 20, 15],
    timerKey: 0,
    level: 0,
    score: 0,
    solution: 1,
    answerTotal:'',
    dividend: 1,
    divisor: 1,
    invalidAnswer: false,
    cardColor: 'black',
    tasksTotal: 0,
    wrongAnswers: 0,
    divisorMinScale: [1, 2, 2],
    divisorMaxScale: [9, 15, 15],
    multiplierMinScale: [1, 2, 2],
    multiplierMaxScale: [9, 9, 15],
  }),
  methods: {
    checkAnswer: function () {
      if(parseInt(this.answerTotal) === this.solution) {
        this.generateNew();
        this.invalidAnswer = false;
        this.answerTotal = '';
        this.score += 1;
        this.correctAnswer();
      } else {
        this.invalidAnswer = true;
        this.wrongAnswer();
      }
      this.$refs.answerTotal.$refs.input.focus();
    },
    generateNew: function (newLevel) {
      if(newLevel !== undefined && typeof newLevel==='string') {
        this.tasksTotal -=1;
      }
      const index = this.level - 1;
      const divisorMin = this.divisorMinScale[index];
      const divisorMax = this.divisorMaxScale[index];
      const multiplierMin = this.multiplierMinScale[index];
      const multiplierMax = this.multiplierMaxScale[index];

      this.divisor = randomIntFromInterval(divisorMin, divisorMax);
      const multiplier = randomIntFromInterval(multiplierMin, multiplierMax);
      this.dividend = this.divisor * multiplier;

      this.solution = multiplier;
      this.invalidAnswer = false;
      this.answerTotal = '';
      this.cardColor = 'black'
      this.tasksTotal +=1;
      this.wrongAnswers = 0;
      this.timerKey += 1;
    },
    correctAnswer: function () {
      this.cardColor = 'green darken-4';
      setTimeout(() => {
        this.cardColor = 'black'
      }, 1000);
    },
    wrongAnswer: function () {
      this.cardColor = 'red darken-4';
      this.wrongAnswers += 1;
      if (this.wrongAnswers < 3) {
        this.timerKey += 1;
      }
    },
  }
}
</script>
