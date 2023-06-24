<template>
  <div class="q-pa-md" v-if="dInvoice?.progress && dInvoice?.progress.length > 0">
    <q-list  separator>
      <q-list-header separator>Progress</q-list-header>
      <q-separator />
      <q-item
        v-for="(item, index) in dInvoice.progress.slice().reverse()"
        :key="index"
        dense
        bordered
        padding
      >
        <q-item-section>
          <q-item-label>{{ item }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref } from "vue"

const dInvoice = defineModel({})

// dInvoice.value = {
//   progress: [
//     "Invoice created",
//     "Invoice sent",
//     "Invoice paid",
//     "Invoice completed",
//   ],
// }
</script>

<style lang="scss" scoped></style>
