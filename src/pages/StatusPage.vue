<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <q-card-section>
        <div class="text-h6">{{ $t("status") }} {{ $t("page") }}</div>
        <div class="text-subtitle2">Brian of London</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ $t("index_page_message") }}
        <a href="https://peakd.com/created/v4vapp-v2">Hive</a>
      </q-card-section>
      <div class="image-container">
        <a href="https://peakd.com/created/v4vapp-v2">
          <img
            alt="V4V.app v2 Quasar Stars"
            src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
          />
        </a>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const { t } = useI18n()
</script>

<style lang="scss" scoped></style>
