<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <q-card-section>
        <div class="text-h6">{{ $t("status") }} {{ $t("page") }}</div>
        <div class="text-subtitle2">Brian of London</div>
      </q-card-section>
      <q-card-section>
        <div class="hive-login-window">
          <HiveLogin
            @hiveAccname="
              (value) => {
                hiveAccname = value
              }
            "
            @loggedIn="
              (value) => {
                loggedIn = value
              }
            "
          />
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ $t("index_page_message") }}
        <a href="https://peakd.com/created/v4vapp-v2">Hive</a>
      </q-card-section>
      <div class="image-container">
        <a href="https://peakd.com/created/v4vapp-v2">
          <div v-if="loggedIn">
            <q-img
              spinner-color="primary"
              spinner-size="82px"
              :alt="'Hive Avatar for ' + hiveAccname"
              :src="
                useHiveAvatarURL({ hiveAccname: hiveAccname, size: 'large' })
              "
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center">
                  <q-icon name="error" size="lg" color="red" />
                </div>
              </template>
            </q-img>
          </div>
          <div v-else>
            <q-img
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
import { ref } from "vue"
import HiveLogin from "components/HiveLogin.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import { useI18n } from "vue-i18n"
const { t } = useI18n()
const hiveAccname = ref("")
const loggedIn = ref(false)
</script>

<style lang="sass" scoped>
.index-card
  width: 90%
  height: auto
  max-width: 400px

.image-container img
  width: 100%
  height: auto
</style>
