<template>
  <div class="tab-bar-selector">
    <div class="q-gutter-y-md" style="max-width: 550px">
      <q-tabs dense>
        <q-route-tab name="send" to="/lnd" :label="$t('send')" />
        <q-route-tab name="receive" to="/hive" :label="$t('receive')" />
        <q-route-tab name="pos" to="/pos" label="POS">
          <q-tooltip>Point of Sale</q-tooltip>
        </q-route-tab>
        <!-- <q-route-tab disabled name="pods" to="/pods" :label="$t('pods')" /> -->
      </q-tabs>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const t = useI18n().t
</script>

<style lang="scss" scoped></style>
