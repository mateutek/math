<template>
<v-row no-gutters justify="center">
  <v-col sm="1" v-for="n in 3"
         :key="n" class="align-center justify-center d-flex">
    <v-icon v-if="n-1<wrong" color="red">mdi-close-circle</v-icon>
    <v-icon v-else>mdi-circle-outline</v-icon>
  </v-col>
</v-row>
</template>

<script>
export default {
  name: "wrongAnswers",
  props: {
    wrong: Number,
  },
  data: () => ({

  })
}
</script>

<style scoped>

</style>
