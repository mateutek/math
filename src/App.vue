<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list class="pa-0">
        <v-list-item
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            link
            @click="drawer = false"
        >
          <v-list-item-title class="text-uppercase">{{ link.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app elevate-on-scroll>
      <v-container class="py-0 pl-0 pl-md-1 fill-height">
        <v-app-bar-nav-icon class="d-flex d-md-none" @click="drawer = true"></v-app-bar-nav-icon>

        <router-link to="/">
          <v-avatar class="mr-10" color="blue" size="32">
            <v-icon color="white">mdi-all-inclusive</v-icon>
          </v-avatar>
        </router-link>

        <v-btn
            v-for="link in links"
            :key="link.to"
            text
            active-class="primary"
            :to="link.to"
            class="d-none d-md-flex"
        >
          {{ link.title }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-switch
            v-model="settings.timerEnabled"
            label="Zegar"
            hide-details
            class="mt-0 pt-0"
        ></v-switch>
      </v-container>
    </v-app-bar>

    <v-main class="dark-grey lighten-3">
      <router-view/>
    </v-main>
    <v-footer padless>
      <v-col class="text-center" cols="12">
        <div class="text-center">&copy; Mateusz Woźniak - {{ new Date().getFullYear() }}</div>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
import settings from '@/store/settings';

export default {
  name: 'App',
  data: () => ({
    drawer: false,
    settings,
    links: [
      { to: '/dodawanie', title: 'dodawanie' },
      { to: '/odejmowanie', title: 'odejmowanie' },
      { to: '/mnozenie', title: 'mnożenie' },
      { to: '/dzielenie', title: 'Dzielenie' },
    ],
  }),
};
</script>

<style>
a {
  text-decoration: none;
}
</style>
