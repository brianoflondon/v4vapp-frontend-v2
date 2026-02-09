<template>
  <div class="keychain-status-indicator q-pa-xs">
    <q-btn
      flat
      dense
      :title="
        storeAPIStatus.isKeychainIn
          ? $t('keychain_installed')
          : $t('keychain_missing')
      "
      @click="storeAPIStatus.isKeychainIn = !storeAPIStatus.isKeychainIn"
    >
      <img
        :src="
          storeAPIStatus.isKeychainIn
            ? '/keychain/hive-keychain-keys.svg'
            : '/keychain/hive-keychain-keys-missing.svg'
        "
        style="height: 15px; max-width: 15px"
      />
    </q-btn>
  </div>
</template>

<script setup>
import { ref } from "vue";

const storeAPIStatus = ref({
  isKeychainIn: true,
});
</script>

<style lang="scss" scoped></style>
