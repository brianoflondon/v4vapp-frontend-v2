<template>
  <div v-if="data.length !== 0">
    <q-table
      :rows="data"
      row-key="trx_id"
      :visible-columns="['net_hive', 'sats', 'timestamp']"
    ></q-table>
    <q-btn
      label="Refresh"
      @click="fetchData"
      :disable="data.length === 0"
    ></q-btn>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useStoreUser } from "src/stores/storeUser"
import { useFetchSatsHistory } from "src/use/useV4vapp"

const storeUser = useStoreUser()
const data = ref([])

const t = useI18n().t

watch(
  () => storeUser.currentUser,
  async (newVal) => {
    console.log("HiveLightningTrans.vue watch", newVal)
    fetchData()
    // data.value = rawData
  }
)

async function fetchData() {
  data.value = await useFetchSatsHistory({ username: storeUser.hiveAccname })
}

onMounted(() => {
  console.log("HiveLightningTrans.vue onMounted")
  fetchData()
})
</script>

<style lang="scss" scoped></style>
