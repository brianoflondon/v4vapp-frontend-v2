<template>
  <div>
    <!-- MARK Get Hive Keychain -->
    <transition
      appear
      enter-active-class="animated fadeInDown"
      leave-active-class="animated fadeOutUp"
    >
      <div v-if="activeItem < 2" class="q-pa-lg">
        <p class="text-h6" style="word-wrap: break-word">
          Install Hive Keychain first.
        </p>
        <div class="dark-background">
          <div class="q-pa-md">
            <a href="https://hive-keychain.com/" target="_blank">
              <q-img
                src="keychain/hive-keychain-wide.png"
                alt="Hive Keychain"
              />
            </a>
          </div>
        </div>
      </div>
    </transition>
    <!-- MARK: End Get Hive Keychain -->
  </div>
</template>

<script setup>
import { defineProps } from "vue"

const props = defineProps({
  activeItem: Number,
})
</script>

<style lang="scss" scoped>
.dark-background {
  background-color: #000; /* Replace with the color you want */
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.9;
  }
}


.animated {
  animation-duration: 1s; /* Adjust this value to change the animation speed */
}
</style>
