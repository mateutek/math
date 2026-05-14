<template>
  <v-progress-circular class="mr-4"
      :rotate="-90"
      :size="56"
      :width="6"
      :value="progress"
      :color="color"
  >
    {{ remaining }}
  </v-progress-circular>
</template>

<script>
export default {
  name: 'Timer',
  props: {
    duration: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      remaining: this.duration,
      interval: null,
    };
  },
  computed: {
    progress() {
      return (this.remaining / this.duration) * 100;
    },
    color() {
      if (this.progress > 50) return 'green';
      if (this.progress > 25) return 'orange';
      return 'red';
    },
  },
  mounted() {
    this.start();
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    start() {
      this.remaining = this.duration;
      this.interval = setInterval(() => {
        this.remaining -= 1;
        if (this.remaining <= 0) {
          this.remaining = 0;
          this.stop();
          this.$emit('timeout');
        }
      }, 1000);
    },
    stop() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  },
};
</script>

