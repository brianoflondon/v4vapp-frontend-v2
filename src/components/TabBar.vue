<template>
  <div class="tab-bar-selector">
    <div class="q-gutter-y-md" style="max-width: 400px">
      <q-tabs v-model="mainTab" dense>
        <q-route-tab name="send" to="/lnd" :label="$t('send')" />
        <q-route-tab name="receive" to="/pos" :label="$t('receive')" />
        <!-- <q-route-tab disabled name="pods" to="/pods" :label="$t('pods')" /> -->
      </q-tabs>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const t = useI18n().t
import { ref } from "vue"

const mainTab = ref("send")
</script>

<style lang="scss" scoped></style>
