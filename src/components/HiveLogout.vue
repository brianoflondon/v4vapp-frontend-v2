<template>
  <q-card class="q-pa-sm">
    <q-list>
      <q-item class="flex justify-center">
        <div class="text-center q-pa-sm">
          <q-btn
            :disable="storeUser.numUsers < 1 || loggingOut"
            :loading="loggingOut"
            rounded
            @click="onLogout"
            :label="$t('logout')"
          />
        </div>
        <div class="text-center q-pa-sm">
          <q-btn
            rounded
            :disable="storeUser.numUsers < 1 || loggingOut"
            :loading="loggingOut"
            @click="onLogoutAll"
            :label="$t('logout_all')"
            style="white-space: nowrap"
          />
        </div>
      </q-item>
    </q-list>
  </q-card>

  <div></div>
</template>

<style lang="scss" scoped></style>

<script setup>
/**
 * HiveLogout
 * Logs a user or all users out

 *
 */

import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useStoreUser } from "src/stores/storeUser";

const storeUser = useStoreUser();
const t = useI18n().t;
const loggingOut = ref(false);

async function onLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await storeUser.logout();
  } finally {
    loggingOut.value = false;
  }
}

async function onLogoutAll() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await storeUser.logoutAll();
  } finally {
    loggingOut.value = false;
  }
}
</script>
