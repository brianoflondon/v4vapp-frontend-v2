<template>
  <div class="send-receive-selector">
    <div class="q-gutter-y-md" style="max-width: 550px">
      <q-tabs dense>
        <q-route-tab name="send" to="/lnd" :label="$t('send')" />
        <q-route-tab name="receive" to="/hive" :label="$t('receive')" />
      </q-tabs>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const t = useI18n().t
</script>

<style lang="scss" scoped></style>
