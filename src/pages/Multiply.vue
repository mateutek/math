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
                  :to="`/mnozenie/${n}`"
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
              <animated-integer v-bind:value="multiplicand"/>
              <v-icon>mdi-close</v-icon>
              <animated-integer v-bind:value="multiplayer"/>
              = {{wrongAnswers === 3 ? solution : '?'}}
            </h2>
            <v-text-field
                ref="answer"
                type="number"
                v-model="answer"
                label="Wynik"
                required
                autofocus
                v-on:keyup.enter="checkAnswer"
            ></v-text-field>
            <v-row no-gutters justify="space-between">
              <v-btn color="secondary" v-on:click="generateNew">
                Nowe zadanie
              </v-btn>
              <v-btn color="primary" v-on:click="checkAnswer" :disabled="wrongAnswers===3">
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
    name: 'Multiply',
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
      solution: 1,
      answer:'',
      multiplicand: 1,
      multiplayer: 1,
      invalidAnswer: false,
      cardColor: 'black',
      tasksTotal: 0,
      wrongAnswers: 0,
      levelMinScale: [1, 5, 10],
      levelMaxScale: [10, 20, 30],
      levelMin: 0,
      levelMax: 0,
    }),
    methods: {
      checkAnswer: function () {
        if(parseInt(this.answer) === this.solution) {
          this.generateNew();
          this.invalidAnswer = false;
          this.answer = '';
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

        this.multiplicand = randomIntFromInterval(this.levelMin, this.levelMax);
        this.multiplayer = randomIntFromInterval(this.levelMin, this.levelMax);
        this.solution = this.multiplicand * this.multiplayer;
        this.invalidAnswer = false;
        this.answer = '';
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
