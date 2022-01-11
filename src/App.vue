<template>
  <v-app id="inspire">
    <v-app-bar
        app
        color="white"
        flat
    >
      <v-container class="py-0 fill-height">
        <router-link to="/">
          <v-avatar
              class="mr-10"
              color="blue"
              size="32"
          >
            <v-icon color="white">
              mdi-all-inclusive
            </v-icon>
          </v-avatar>

        </router-link>

        <router-link
            v-for="link in links"
            :key="link.to" :to="link.to"
        >
          <v-btn text>
              {{ link.title }}
          </v-btn>
        </router-link>

        <v-spacer></v-spacer>

<!--        <v-responsive max-width="260">-->
<!--          <v-text-field-->
<!--              dense-->
<!--              flat-->
<!--              hide-details-->
<!--              rounded-->
<!--              solo-inverted-->
<!--          ></v-text-field>-->
<!--        </v-responsive>-->
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <router-view/>
    </v-main>
    <v-footer padless>
      <v-col
          class="text-center"
          cols="12"
      >
        <div class="text-center">&copy; Mateusz Woźniak - {{ new Date().getFullYear() }}</div>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  data: () => ({
    links: [
      {
        to: '/dzielenie/1',
        title: 'Dzielenie'
      },
      {
        to: '/mnozenie/1',
        title: 'mnożenie'
      }
    ],
  }),
};
</script>

<style>
a {
  text-decoration: none;
}
</style>
