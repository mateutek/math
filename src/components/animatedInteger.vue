<template>
  <span>{{ tweeningValue }}</span>
</template>

<script>
export default {
  name: "animated-integer",
  props: {
    value: {
      type: Number,
      required: true
    }
  },
  data: function () {
    return {
      tweeningValue: 0
    }
  },
  watch: {
    value: function (newValue, oldValue) {
      this.tween(oldValue, newValue)
    }
  },
  mounted: function () {
    this.tween(0, this.value)
  },
  methods: {
    tween: function (startValue, endValue) {
      var vm = this
      function animate () {
        // eslint-disable-next-line no-undef
        if (TWEEN.update()) {
          requestAnimationFrame(animate)
        }
      }

      // eslint-disable-next-line no-undef
      new TWEEN.Tween({ tweeningValue: startValue })
          .to({ tweeningValue: endValue }, 500)
          .onUpdate(function () {
            vm.tweeningValue = this.tweeningValue.toFixed(0)
          })
          .start()

      animate()
    }
  }
}
</script>

