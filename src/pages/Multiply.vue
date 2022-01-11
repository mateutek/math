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
              <h2>Poziom {{level}}</h2>
              <h2>Punkty: {{score}} z {{tasksTotal}}</h2>
            </v-row>
            <h2 class="text-center text-h2 justify-center align-center d-flex">
              <animated-integer v-bind:value="multiplicand"/>
              <v-icon>mdi-close</v-icon>
              <animated-integer v-bind:value="multiplayer"/>
              = ?
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
  import {randomIntFromInterval} from '@/helpers/helpers';

  export default {
    name: 'Multiply',
    components: {AnimatedInteger},
    created() {
      this.level = this.$route.params.level;
      this.generateNew();
    },
    watch: {
      $route(to) {
        this.level = to.params.level;
      },
      level(newLevel) {
        console.log(newLevel);
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
      cardColor: 'white',
      tasksTotal: 0
    }),
    methods: {
      checkAnswer: function () {
        if(parseInt(this.answer) === this.solution) {
          this.generateNew();
          this.invalidAnswer = false;
          this.answer = '';
          this.score += 1;
          this.tasksTotal +=1;
          this.correctAnswer();
        } else {
          this.invalidAnswer = true;
          this.wrongAnswer();
        }
        this.$refs.answer.$refs.input.focus();
      },
      generateNew: function () {
        this.multiplicand = randomIntFromInterval(50,500);
        this.multiplayer = randomIntFromInterval(5,10);
        this.solution = this.multiplicand * this.multiplayer;
        this.invalidAnswer = false;
        this.answer = '';
        this.cardColor = 'white';
        this.tasksTotal +=1;
      },
      correctAnswer: function () {
        this.cardColor = 'green lighten-4';
        setTimeout(() => {
          this.cardColor = 'white';
        }, 1000);
      },
      wrongAnswer: function () {
        this.cardColor = 'red lighten-4';
      },
    }
  }
</script>
