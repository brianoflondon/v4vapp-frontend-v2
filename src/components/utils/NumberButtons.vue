<template>
  <div
    class="fit row wrap justify-center items-end content-stretch q-gutter-sm"
  >
    <div v-for="n in buttonValues" :key="n">
      <q-btn
        dense
        rounded
        size="md"
        color="green-10"
        :label="`$${n}`"
        @click="emit('buttonPressed', n)"
        style="min-width: 75px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
const buttonValues = ref([1, 5, 10, 20, 50, 75, 100])
const emit = defineEmits(["buttonPressed"])
</script>

<style lang="scss" scoped></style>
