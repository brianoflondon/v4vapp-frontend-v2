<template>
  <div class="tab-bar-selector">
    <div class="q-gutter-y-md" style="max-width: 400px">
      <q-tabs
        v-model="mainTab"
        dense
        animated
        outside-arrows
        mobile-arrows
        inline-label
      >
        <q-route-tab icon="bolt" name="move" to="/lnd" :label="t('wallet')" />
        <q-route-tab icon="storefront" name="" to="/pos" :label="t('sales')" />
        <!-- <q-route-tab name="map" disabled to="/map" icon="fa-solid fa-map-marked-alt" /> -->
        <!-- <q-route-tab disabled name="pods" to="/pods" :label="$t('pods')" /> -->
      </q-tabs>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const t = useI18n().t;
import { ref } from "vue";

const mainTab = ref("move");
</script>

<style lang="scss" scoped></style>
