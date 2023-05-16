<template>
  <div>
    <div class="q-pa-md">
      <select-hive-acc
        :label="label"
        @updateValue="
          (value) => {
            hiveUsername = value
          }
        "
      />
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
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import { useHiveDetails, useHiveAvatarURL } from "src/use/useHive.js"
import SelectHiveAcc from "components/SelectHiveAcc.vue"
import "src/assets/hive-tx.min.js"

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
const hiveUsername = ref("")
const avatar = ref(useHiveAvatarURL({ hiveAccname: "" }))
const hiveDetails = ref(null)

const label = ref(t("hive_account"))

watch(hiveUsername, async (val) => {
  label.value = "Loading..."
  hiveDetails.value = await useHiveDetails(val)
  avatar.value = useHiveAvatarURL({ hiveAccname: val })
  label.value = hiveDetails.value?.profile?.name || t("hive_account")
})
</script>

<style lang="scss" scoped></style>
