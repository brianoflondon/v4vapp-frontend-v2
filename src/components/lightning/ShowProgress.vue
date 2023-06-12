<template>
  <div v-if="dInvoice?.progress && dInvoice.progress.length > 0">
    <q-item v-for="(item, index) in dInvoice.progress" :key="index">
      <q-item-section>
        <q-item-label>{{ item }}</q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup>
import { ref } from "vue"

const dInvoice = defineModel({})
</script>

<style lang="scss" scoped></style>
