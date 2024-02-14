<template>
  <div>
    <div class="q-pa-md">
      <UserList
        @update="(val) => (hiveUsername = val)"
        @click="$emit('close-menu')"
      />
      <HiveLogin v-model="hiveAccObj" key-type="Posting" :label="label" />
    </div>
    <div></div>
    <q-list @click="$emit('close-menu')">
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
    <div class="q-pa-md">
      <LocalCurrency />
    </div>
    <!-- Explanation what is this page box -->
    <div class="q-py-lg">
      <ExplanationBox class="q-pt-md"></ExplanationBox>
    </div>
    <div class="q-pa-xs text-caption">{{ appName }} - {{ appVersion }}</div>
    <div class="q-pa-xs text-caption">{{ storeUser.currentUser }}</div>
    <div class="q-pa-xs text-caption">{{ api?.defaults?.baseURL }}</div>
    <div class="q-pa-xs text-caption">{{ apiLogin?.defaults?.baseURL }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import UserList from "components/hive/UserList.vue"
import HiveLogin from "components/HiveLogin.vue"
import { useStoreUser } from "src/stores/storeUser"
import LocalCurrency from "components/utils/LocalCurrency.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import { api, apiLogin } from "boot/axios"

const { appName, appVersion } = useAppDetails()
const storeUser = useStoreUser()
// const rightDrawerOpen = defineModel(false)

const hiveAccObj = ref()
const commitMessage = ref()

const t = useI18n().t
const linkList = ref([
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

onMounted(() => {
  // only do this if dev. is in the hostname
  // if window location is not v4v.app
  console.log("window.location.hostname", window.location.hostname)
  if (!window.location.hostname !== "v4v.app") {
    fetchCommitMessage()
  }
})

const fetchCommitMessage = async () => {
  const response = await fetch("/messages/commit_message.txt")
  commitMessage.value = await response.text()
}
</script>

<style lang="scss" scoped></style>
