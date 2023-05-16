<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <div>hiveAccname: {{ hiveAccname }}</div>
      <select-hive-acc
        @updateValue="
          (value) => {
            hiveAccname = value
          }
        "
      />
      <q-card-section>
        <div class="text-h6">V4V.app v2 Dev Site</div>
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

<style lang="sass" scoped>
.index-card
  width: 90%
  height: auto
  max-width: 400px

.image-container img
  width: 100%
  height: auto
</style>

<script setup>
import SelectHiveAcc from "components/SelectHiveAcc.vue"
import { defineComponent, ref } from "vue"

const hiveAccname = ref("")

defineComponent({
  name: "IndexPage",
})
</script>
