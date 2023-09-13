<template>
  <div>
    <div class="q-pa-md">
      <UserList @update="(val) => (hiveUsername = val)" />
      <HiveLogin v-model="hiveAccObj" key-type="Posting" :label="label" />
    </div>
    <q-list>
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
    <div class="q-pa-md">
      <LocalCurrency />
    </div>
    <div class="q-pa-md text-caption">{{ appName }} - {{ appVersion }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import UserList from "components/hive/UserList.vue"
import HiveLogin from "components/HiveLogin.vue"
import { useStoreUser } from "src/stores/storeUser"
import LocalCurrency from "components/utils/LocalCurrency.vue"
import { useAppDetails } from "src/use/useAppDetails.js"

const { appName, appVersion } = useAppDetails()
const storeUser = useStoreUser()
// const rightDrawerOpen = defineModel(false)

const hiveAccObj = ref()

const t = useI18n().t
const linkList = ref([
  {
    title: t("receive"),
    caption: t("point_of_sale"),
    icon: "fa-solid fa-cash-register",
    link: "/pos",
  },
  {
    title: t("lightning"),
    caption: t("lightning"),
    icon: "fa-sharp fa-solid fa-bolt",
    link: "/lnd",
  },
  {
    title: t("hive"),
    caption: t("hive"),
    icon: "fa-brands fa-hive",
    link: "/hive",
  },
  {
    title: t("transfer"),
    caption: t("transfer"),
    icon: "double_arrow",
    link: "transfer",
  },
  {
    title: t("status"),
    caption: t("status"),
    icon: "circle",
    link: "status",
  },
])
const hiveUsername = ref("")

const label = ref(t("hive_account"))

// Watches the storeUser for changes and updates the hiveAccObj
watch(storeUser, async (val) => {
  hiveAccObj.value = {
    label: val.hiveAccname,
    value: val.hiveAccname,
    caption: val.profileName,
  }
})

watch(hiveAccObj, async (val) => {
  // console.debug("hiveAccObj", val)
  // hiveUsername.value = val.value
  // label.value = "Loading..."
  // hiveDetails.value = await useHiveDetails(val.value)
  // label.value = hiveDetails.value?.profile?.name || t("hive_account")
})
</script>

<style lang="scss" scoped></style>
