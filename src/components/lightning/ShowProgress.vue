<template>
  <q-card>
    <q-card-section>
      <q-item>
        <q-item-section>
          <q-item-label>Progress</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label>100%</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-for="(item, index) in dInvoice.progress" :key="index">
        <q-item-section>
          <q-item-label>{{ item }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label>{{ index + 1 }}%</q-item-label>
        </q-item-section>
      </q-item>
      <div>
        <pre>{{ dInvoice.progress }}</pre>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from "vue"

const dInvoice = defineModel({})
const showProgress = ref(true)
dInvoice.value.progress = ["Starting to pay", "Lorem ipsum dolor, sit amet Lorem ipsum dolor, sit amet ","Paying", "Paid", "Done"]
</script>

<style lang="scss" scoped></style>
