<template>
  <q-footer elevated>
    <div class="price-bar q-pa-none shadow-1 no-wrap row">
      <span class="price-bar-item btc-price q-pa-xs">
        <i class="fa-brands fa-btc" />&thinsp;
        <strong>$27,000</strong>
        Lorem ipsum dolor d
      </span>
    </div>
  </q-footer>
</template>

<script setup>
import { ref } from "vue"

const loadingState = ref(true)
const text = ref("")

async function load() {
  loadingState.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  text.value = "Hello World!"
  loadingState.value = false
}

load()
</script>

<style lang="scss" scoped>
.body--dark {
  .price-bar {
    background-color: $bar-bg-dark;
    color: $primary;
  }
}

.body--light {
  .price-bar {
    background-color: $bar-bg-light;
    color: whitesmoke;
    display: flex;
    justify-content: center;
    align-items: center;
    /* Add any other necessary styles */
  }
}
</style>
