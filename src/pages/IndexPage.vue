<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <div class="hive-login-window">
        <HiveLogin v-model="hiveAccObj" />
      </div>
      <!-- <HiveSelectFancyAcc filled v-model="hiveAccObj" fancyOptions /> -->
      <q-card-section>
        <div class="text-h6">V4V.app v2 Dev Site</div>
        <div class="text-subtitle2">Brian of London</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ $t("index_page_message") }}
        <a href="https://peakd.com/created/v4vapp-v2">Hive</a>
      </q-card-section>
      <div>
        <a href="https://peakd.com/created/v4vapp-v2">
          <div class="image-container">
            <HiveAvatar
              v-if="hiveAccname"
              :hiveAccname="hiveAccname"
              size="large"
            />
            <q-img
              v-if="!hiveAccname"
              alt="V4V.app v2 Quasar Stars"
              src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
            />
          </div>
        </a>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import HiveLogin from "components/HiveLogin.vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { ref, computed } from "vue"

const hiveAccObj = ref(null)
const hiveAccname = computed(() => {
  return hiveAccObj.value ? hiveAccObj.value.label : null
})
const hiveAvatar = computed(() => {
  return useHiveAvatarURL({ hiveAccname: hiveAccname.value, size: "large" })
})
</script>

<style lang="sass" scoped>
.index-card
  width: 90%
  height: auto
  max-width: 400px

.image-container img
  width: 100%
  height: 100%
  object-fit: cover
</style>
