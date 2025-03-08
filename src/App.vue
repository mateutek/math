<template>
  <v-app id="inspire">
    <v-app-bar
        app
        color="white"
        elevate-on-scroll
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

        <v-btn v-for="link in links"
               :key="link.to" text active-class="primary"
               :to="link.to">
          {{ link.title }}
        </v-btn>

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
        to: '/dodawanie',
        title: 'dodawanie'
      },
      // {
      //   to: '/odejmowanie',
      //   title: 'odejmowanie'
      // },
      {
        to: '/dzielenie',
        title: 'Dzielenie'
      },
      {
        to: '/mnozenie',
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
