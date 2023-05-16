<template>
  <div>
    <div class="q-pa-md">
      <q-select
        v-model="hiveUsername"
        :options="hiveOptions"
        inputmode="text"
        map-options
        emit-value
        :label="label"
        dense
      />
    </div>
    <q-list>
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
    <div v-if="hiveDetails?.profile?.name">
      <q-item-label header> {{ hiveDetails.profile.name }} </q-item-label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import "src/assets/hive-tx.min.js"
// import { hiveTx } from "hive-tx"

const t = useI18n().t
const linkList = ref([
  {
    title: t("home"),
    caption: t("home"),
    icon: "home",
    link: "/",
  },
  {
    title: t("status"),
    caption: t("status"),
    icon: "hive",
    link: "status",
  },
])
const hiveUsername = ref("-----")
const hiveDetails = ref(null)
const hiveOptions = ref(["brianoflondon", "v4vapp", "v4vapp.dhf", "12334"])
const label = ref("Hive Login")

watch(hiveUsername, (val) => {
  console.log("hiveUsername", val)
  getHiveDetails(val)
})

function extractProfile(data) {
  console.log("extractProfile", data)
  try {
    const profile = JSON.parse(data["posting_json_metadata"])["profile"]
    label.value = profile.name
    return profile
  } catch (e) {
    label.value = "Hive Login"
    console.log(e)
    return {}
  }
}

async function getHiveDetails(username) {
  console.log("getHiveDetails", username)
  try {
    const res = await hiveTx.call("condenser_api.get_accounts", [[username]])
    console.log(res)
    hiveDetails.value = res.result[0]
    hiveDetails.value["profile"] = extractProfile(hiveDetails.value)
  } catch (e) {
    console.log(e)
  }
}
</script>

<style lang="scss" scoped></style>
b
