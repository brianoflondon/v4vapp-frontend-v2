<template>
  <div>
    <q-table
      :rows="data"
      row-key="trx_id"
      :visible-columns="['net_hive', 'sats', 'timestamp']"
    ></q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import { defineProps } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { apiLogin } from "boot/axios"

const storeUser = useStoreUser()
const data = ref([])

const props = defineProps({
  username: {
    type: String,
    default: "",
  },
})

const t = useI18n().t

onMounted(() => {
  console.log("HiveLightningTrans.vue onMounted")
  console.log("props", props)
  console.log("storeUser", storeUser)
  const user = storeUser.getUser(props.username)
  if (user.checkApiTokenValid()) {
    console.log("Logged in user", user)
    const ans = fetchHistory(props.username)
  }
})

async function fetchHistory(username) {
  console.log("fetchHistory", username)
  const params = {
    hiveAccname: username,
    age: 72,
  }
  try {
    const rawData = await apiLogin.get("/v1/hivetosats/", {
      params,
    })
    if (Array.isArray(rawData.data) && rawData.data.length > 0) {
      console.log("First item in rawData.data", rawData.data[0])
      data.value = rawData.data[0].transactions
    }
    console.log("rawData", rawData.data)
    return rawData
  } catch (error) {
    console.error("fetchHistory error", error)
  }
}
</script>

<style lang="scss" scoped></style>
