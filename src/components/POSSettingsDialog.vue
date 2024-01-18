<template>
  <q-dialog v-model="KeychainDialog.settings">
    <q-card>
      <q-toolbar>
        <!-- Title Bar -->
        <q-toolbar-title>{{ t("local_currency") }}</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
        <!-- @click="KeychainDialog.settings = false" -->
      </q-toolbar>
      <q-card-section>
        <!-- Settings area -->
        <div>
          <!-- List of received transactions -->
          <div class="q-px-xs q-py-xs">
            <div class="pad-max-width">
              <LocalCurrency />
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-px-none q-py-xs">
          <q-expansion-item
            class=""
            expand-separator
            :label="t('list_received_payments')"
          >
            <ListTransactions v-model="KeychainDialog"></ListTransactions>
          </q-expansion-item>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="t('ok')" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import LocalCurrency from "src/components/utils/LocalCurrency.vue"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import ListTransactions from "src/components/hive/ListTransactions.vue"
import { useI18n } from "vue-i18n"

const t = useI18n().t

const KeychainDialog = defineModel()
</script>

<style lang="scss" scoped></style>
