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
                  :to="`/dzielenie/${n}`"
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
            <v-row no-gutters justify="space-between">
               <h2>Poziom {{level}} (od {{levelMin}} do {{levelMax}})</h2>
              <wrong-answers :wrong="wrongAnswers"/>
              <h2>Punkty: {{score}} z {{tasksTotal}}</h2>
            </v-row>
            <h2 class="text-center text-h2 justify-center align-center d-flex">
              <animated-integer v-bind:value="dividend"/>
              <v-icon>mdi-division</v-icon>
              <animated-integer v-bind:value="divisor"/>
              = {{wrongAnswers === 3 ? `${solutionTotal} r ${solutionRest}` : '?'}}
            </h2>
            <v-row gutters>
              <v-col>
                <v-text-field
                    ref="answerTotal"
                    type="number"
                    v-model="answerTotal"
                    label="Całość"
                    required
                    autofocus
                    v-on:keyup.enter="checkAnswer"
                ></v-text-field>
              </v-col>
              <v-col>
                <v-text-field
                    ref="answerRest"
                    type="number"
                    v-model="answerRest"
                    label="Reszta"
                    required
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
import {randomIntFromInterval} from '@/helpers/helpers';

export default {
  name: 'Divide',
  components: {WrongAnswers, AnimatedInteger},
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
    level: 0,
    score: 0,
    solutionTotal: 1,
    solutionRest: 0,
    answerTotal:'',
    answerRest: '',
    dividend: 1,
    divisor: 1,
    invalidAnswer: false,
    cardColor: 'black',
    tasksTotal: 0,
    wrongAnswers: 0,
    levelMinScale: [2, 10, 100],
    levelMaxScale: [10, 100, 200],
    levelMin: 0,
    levelMax: 0,
  }),
  methods: {
    checkAnswer: function () {
      if(parseInt(this.answerTotal) === this.solutionTotal && parseInt(this.answerRest) === this.solutionRest) {
        this.generateNew();
        this.invalidAnswer = false;
        this.answerTotal = '';
        this.answerRest = '';
        this.score += 1;
        this.correctAnswer();
      } else {
        this.invalidAnswer = true;
        this.wrongAnswer();
      }
      this.$refs.answer.$refs.input.focus();
    },
    generateNew: function (newLevel) {
      if(newLevel !== undefined && typeof newLevel==='string') {
        this.tasksTotal -=1;
      }
      const index = this.level - 1;
      this.levelMin = this.levelMinScale[index];
      this.levelMax = this.levelMaxScale[index];

      this.dividend = randomIntFromInterval(this.levelMin, this.levelMax);
      this.divisor = randomIntFromInterval(this.levelMin, this.levelMax);

      if(this.dividend < this.divisor) {
        this.dividend = this.divisor + randomIntFromInterval(1, this.levelMax);
      }

      this.solutionTotal = Math.floor(this.dividend/this.divisor);
      this.solutionRest = this.dividend - (this.solutionTotal * this.divisor)
      this.invalidAnswer = false;
      this.answerTotal = '';
      this.cardColor = 'black'
      this.tasksTotal +=1;
      this.wrongAnswers = 0;
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
    },
  }
}
</script>
