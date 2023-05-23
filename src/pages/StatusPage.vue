<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <q-card-section>
        <div class="text-h6">{{ $t("status") }} {{ $t("page") }}</div>
        <div class="text-subtitle2">Brian of London</div>
      </q-card-section>
      <q-card-section>
        <div class="hive-login-window">
          <HiveLogin v-model="hiveAccObj" />
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ $t("index_page_message") }}
        <a href="https://peakd.com/created/v4vapp-v2">Hive</a>
      </q-card-section>
      <q-card-section
        :class="{
          'is-logged-in': hiveAccObj?.loggedIn,
          'not-logged-in': !hiveAccObj?.loggedIn,
        }"
      >
        {{ hiveAccObj }}
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue"
import HiveLogin from "components/HiveLogin.vue"
import { useI18n } from "vue-i18n"
const { t } = useI18n()
const hiveAccObj = ref("")
</script>

<style lang="sass" scoped>
.index-card
  width: 90%
  height: auto
  max-width: 800px
  min-width: 200px

.image-container img
  width: 100%
  height: auto

.is-logged-in
  background: radial-gradient(circle, #35a2ff 0%, #014a88 100%)

.not-logged-in
  background: radial-gradient(circle, #333333 0%, #880000 100%)
</style>
