<template>
  <div>
    <div class="q-pa-md">
      <HiveLogin v-model="hiveAccObj" :label="label" />
    </div>

    <q-list>
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
    <div v-if="hiveDetails?.profile?.name">
      <q-item-label header> {{ hiveDetails.profile.name }} </q-item-label>
    </div>
    <div v-if="hiveDetails?.profile?.about">
      <q-item-label header> {{ hiveDetails.profile.about }} </q-item-label>
    </div>
    <div v-if="hiveDetails?.profile?.location">
      <q-item-label header> {{ hiveDetails.profile.location }} </q-item-label>
    </div>
    <div>
      <q-item>
        <q-avatar size="200px" class="hive-avatar-large">
          <HiveAvatar :hiveAccname="hiveUsername" size="large" />
        </q-avatar>
      </q-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { useHiveDetails, useHiveAvatarURL } from "src/use/useHive.js"
import HiveLogin from "components/HiveLogin.vue"
import "src/assets/hive-tx.min.js"

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
