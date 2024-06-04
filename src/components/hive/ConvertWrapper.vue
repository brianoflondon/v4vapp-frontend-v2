<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="flex justify-center">
      <q-input
        outlined
        v-model="fromAmount"
        label="From Amount"
        type="number"
      />
      <q-select
        outlined
        v-model="fromCurrency"
        label="From Currency"
        :options="[
          { label: 'HBD', value: 'hbd' },
          { label: 'HIVE', value: 'hive' },
          { label: 'SATS', value: 'sats' },
        ]"
      />
    </div>
    <div class="flex row justify-center">
      <q-icon name="currency_exchange" size="2rem" />
    </div>

    <div class="flex justify-center">
      <q-input outlined v-model="toAmount" label="To Amount" type="number" />
      <q-select
        outlined
        v-model="toCurrency"
        label="to Currency"
        :options="[
          { label: 'HBD', value: 'hbd' },
          { label: 'HIVE', value: 'hive' },
          { label: 'SATS', value: 'sats' },
        ]"
      />
    </div>

    <div class="q-pa-sm">
      <q-tabs v-model="convertTab">
        <q-tab name="toHive" label="Sats to Hive" class="text-center"></q-tab>
        <q-tab name="toSats" label="Hive to Sats" class="text-center" />
      </q-tabs>
    </div>

    <q-tab-panels v-model="convertTab">
      <q-tab-panel name="toHive">
        <ConvertKeepsats />
      </q-tab-panel>
      <q-tab-panel name="toSats">
        <ReceiveKeepsats justHive="true" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref } from "vue"
import ConvertKeepsats from "src/components/hive/ConvertKeepsats.vue"
import ReceiveKeepsats from "src/components/hive/ReceiveKeepsats.vue"

const convertTab = ref("toHive")
const fromCurrency = ref("SATS")
const toCurrency = ref("HBD")
const fromAmount = ref(0)
const toAmount = ref(0)
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #ccc;
}
</style>
