<template>
  <div class="q-pa-sm col justify-evenly">
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
</script>

<style lang="scss" scoped>
.bordered-div {
    border: 1px solid #ccc;
}
</style>
