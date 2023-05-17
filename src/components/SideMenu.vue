<template>
  <div>
    <div class="q-pa-md">
      <HiveLogin />
    </div>

    <div class="q-pa-md">
      <HiveSelectAcc
        dense
        :label="label"
        maxOptions="20"
        size="small"
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
    <div>
      <q-item>
        <q-avatar size="200px" class="hive-avatar-large">
          <q-img
            :src="
              useHiveAvatarURL({ hiveAccname: hiveUsername, size: 'large' })
            "
            spinner-color="primary"
            spinner-size="82px"
          />
        </q-avatar>
      </q-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EssentialLink from "components/EssentialLink.vue"
import { useHiveDetails, useHiveAvatarURL } from "src/use/useHive.js"
import HiveSelectAcc from "components/HiveSelectAcc.vue"
import HiveLogin from "components/HiveLogin.vue"
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
