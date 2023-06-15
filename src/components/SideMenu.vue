<template>
  <div>
    <div class="q-pa-md">
      <UserList />
      <HiveLogin v-model="hiveAccObj" key-type="Posting" :label="label" />
    </div>
    <div class="text-center q-pa-md">
      <q-btn @click="storeUser.logout()" label="Logout" />
    </div>
    <q-list>
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import UserList from "components/hive/UserList.vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { useHiveDetails, useHiveAvatarURL } from "src/use/useHive.js"
import HiveLogin from "components/HiveLogin.vue"
import { useStoreUser } from "src/stores/storeUser"
import "src/assets/hive-tx.min.js"

const storeUser = useStoreUser()

const hiveAccObj = ref()

const t = useI18n().t
const linkList = ref([
  {
    title: t("lightning"),
    caption: t("lightning"),
    icon: "fa-sharp fa-solid fa-bolt",
    link: "/lnd",
  },
  {
    title: t("status"),
    caption: t("status"),
    icon: "hive",
    link: "status",
  },
  {
    title: "Select Demo",
    caption: "Select Demo",
    icon: "javascript",
    link: "selectdemo",
  },
])
const hiveUsername = ref("")
const hiveDetails = ref(null)

const label = ref(t("hive_account"))

watch(hiveAccObj, async (val) => {
  console.log("hiveAccObj", val)
  hiveUsername.value = val.value
  label.value = "Loading..."
  hiveDetails.value = await useHiveDetails(val.value)
  label.value = hiveDetails.value?.profile?.name || t("hive_account")
})
</script>

<style lang="scss" scoped></style>
