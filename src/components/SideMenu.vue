<template>
  <div>
    <div class="q-pa-md">

      <q-select
        v-model="hiveUsername"
        :options="hiveOptions"
        inputmode="text"
        use-input
        input-debounce="0"
        map-options
        emit-value
        :label="label"
        dense
      >
        <template v-slot:before>
          <q-avatar>
            <img :src="avatar" />
          </q-avatar>
        </template>
      </q-select>
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
const hiveUsername = ref("")
const avatar = ref(useHiveAvatarURL({ hiveAccname: '' }))
const typing = ref("")
const hiveDetails = ref(null)
const hiveOptions = ref([
  "brianoflondon",
  "v4vapp",
  "blocktvnews",
  "v4vapp.dhf",
  "12334",
])
const label = ref("Hive Login")

watch(hiveUsername, async (val) => {
  console.log("hiveUsername", val)
  label.value = "Loading..."
  hiveDetails.value = await useHiveDetails(val)
  avatar.value = useHiveAvatarURL({ hiveAccname: val })
  label.value = hiveDetails.value?.profile?.name || "Hive Login"
})
</script>

<style lang="scss" scoped></style>
