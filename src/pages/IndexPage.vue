<template>
  <q-page class="flex flex-center">
    <MyMap />
  </q-page>
</template>

<script setup>
import MyMap from "components/utils/MyMap.vue"

</script>

<style lang="sass" scoped>
.index-card
  width: 90%
  height: auto
  max-width: 400px

.image-container img
  width: 100%
  height: 100%
  object-fit: cover
</style>
