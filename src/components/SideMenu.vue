<template>
  <div>
    <div class="q-pa-md">
      <UserList
        @update="(val) => (hiveUsername = val)"
        @click="$emit('close-menu')"
      />
      <HiveLogin v-model="hiveAccObj" key-type="Posting" :label="label" />
      <PasskeyManagement />
      <HiveLogout />
    </div>
    <div class="q-pa-md">
      <LocalCurrency />
    </div>
    <q-list @click="$emit('close-menu')">
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
    <!-- Explanation what is this page box -->
    <div class="q-py-lg">
      <ExplanationBox class="q-pt-md"></ExplanationBox>
    </div>
    <div v-if="isDev || isLocalhost">
      <div class="q-pa-xs text-caption">{{ useAppStr() }}</div>
      <div class="q-pa-xs text-caption">{{ appName }} - {{ appVersion }}</div>
      <div class="q-pa-xs text-caption">{{ serverHiveAccount }}</div>
      <div class="q-pa-xs text-caption">{{ storeUser.currentUser }}</div>
      <div class="q-pa-xs text-caption">{{ api?.defaults?.baseURL }}</div>
      <div class="q-pa-xs text-caption">{{ apiLogin?.defaults?.baseURL }}</div>
      <div class="q-pa-xs text-caption">Wax Version: {{ waxVersion }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeMount } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import UserList from "components/hive/UserList.vue"
import HiveLogin from "components/HiveLogin.vue"
import HiveLogout from "components/HiveLogout.vue"
import PasskeyManagement from "components/utils/PasskeyManagement.vue"
import { useStoreUser } from "src/stores/storeUser"
import LocalCurrency from "components/utils/LocalCurrency.vue"
import { useAppDetails, useAppStr } from "src/use/useAppDetails.js"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import { api, apiLogin, serverHiveAccount } from "boot/axios"

// import { createWaxFoundation } from "@hive/wax"

const { appName, appVersion } = useAppDetails()
const storeUser = useStoreUser()
// const rightDrawerOpen = defineModel(false)

const hiveAccObj = ref()
const isDev = ref()
const isLocalhost = ref()
const t = useI18n().t
const waxVersion = ref("")
const linkList = ref([
  {
    title: "Sign Up",
    caption: "Sign Up",
    icon: "fa-solid fa-user-plus",
    link: "/signup",
  },
  {
    title: t("map"),
    caption: t("map"),
    icon: "fa-solid fa-map-marked-alt",
    link: "/map",
  },
  {
    title: t("lightning"),
    caption: t("lightning"),
    icon: "fa-sharp fa-solid fa-bolt",
    link: "/lnd",
  },
  {
    title: t("receive"),
    caption: t("point_of_sale"),
    icon: "fa-solid fa-cash-register",
    link: "/pos",
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
    link: "/transfer",
  },
  {
    title: t("status"),
    caption: t("status"),
    icon: "circle",
    link: "/status",
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

onBeforeMount(async () => {
  isDev.value = window.location.href.includes("dev.v4v.app")
  // only do this if dev. is in the hostname
  // if window location is not v4v.app
  isLocalhost.value =
    window.location.href.includes("localhost") ||
    window.location.href.includes("127.0") ||
    window.location.href.includes("192.168") ||
    window.location.href.includes("10.0")
  // const wax = await createWaxFoundation()
  // waxVersion.value = wax.getVersion()
  // console.log("waxVersion", waxVersion.value)
  // console.log("wax", wax)
})

onMounted(() => {})
</script>

<style lang="scss" scoped></style>
