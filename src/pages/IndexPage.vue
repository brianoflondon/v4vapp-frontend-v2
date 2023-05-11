<template>
  <q-page class="flex flex-center">
    <q-card class="index-card text-center q-pa-lg">
      <q-card-section>
        <div class="text-h6">V4V.app v2 Dev Site</div>
        <div class="text-subtitle2">by Brian of London</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        For more information about this project, please visit
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

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "IndexPage",
});
</script>
