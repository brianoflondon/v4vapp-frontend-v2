<template>
  <q-card class="q-pb-sm">
    <q-list>
      <q-expansion-item expand-separator icon="key" label="Passkey">
        <!-- Hive Account name input -->
        <q-item>
          <HiveInputAcc v-model="hiveAccObj" prefix="🔑 "> </HiveInputAcc>
        </q-item>
        <q-item dense class="justify-center">
          <ConfettiExplosion v-if="visibleConfetti" />
          <q-btn
            :disable="numCredentials === 0 || !isValid"
            :color="numCredentials === 0 || !isValid ? 'grey-9' : 'primary'"
            rounded
            align="left"
            label="Login"
            icon="key"
            @click="doPasskeyLogin"
            style="width: 200px"
          />
        </q-item>
        <q-item dense class="justify-center">
          <q-btn
            :disable="!storeUser.currentUser"
            :color="!storeUser.currentUser ? 'grey-9' : 'primary'"
            rounded
            :label="t('manage') + ' / ' + t('add')"
            align="left"
            icon="admin_panel_settings"
            @click="doPasskeyManage"
            style="width: 200px"
          />
        </q-item>
        <!-- End Hive Account name input -->
      </q-expansion-item>
    </q-list>
  </q-card>
  <!-- Passkey manage and register dialog -->
  <q-dialog v-model="showDialog">
    <q-card>
      <q-toolbar>
        <q-toolbar-title>Passkey Management</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="doPasskeyManageClose" />
      </q-toolbar>
      <!-- User name  -->
      <q-card-section>
        <q-item>
          <q-item-section avatar>
            <HiveAvatar :hiveAccname="storeUser.currentUser" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ storeUser.profileName }}
            </q-item-label>
            <q-item-label caption> @{{ storeUser.hiveAccname }} </q-item-label>
          </q-item-section>
        </q-item>
      </q-card-section>
      <!-- End User name -->
      <q-card-section>
        <p>{{ t("add_new_key") }}</p>
        <q-input
          v-model="passkeyName"
          label="Device Name"
          :error="showError"
          :error-message="t('name_required')"
        />
        <q-btn
          :disable="!passkeyName"
          rounded
          :label="t('add')"
          @click="doPasskeyRegister"
        />
      </q-card-section>

      <q-card-section>
        <!-- <div class="text-center" v-if="loadingCredentials"> -->
        <!-- <q-spinner-grid color="primary" size="300px 35px" /> -->
        <!-- </div> -->
        <div v-if="loadingCredentials === false && numCredentials === 0">
          No passkeys registered
        </div>
        <div class="credential-list">
          <q-item
            caption
            v-for="cred in listCredentials"
            :key="cred._id"
            @click="doManageKey(cred)"
          >
            <q-item-section avatar v-if="loadingCredentials">
              <q-skeleton type="QAvatar" size="35px" />
            </q-item-section>
            <q-item-section avatar v-else>
              <q-icon name="key" />
            </q-item-section>
            <q-item-section v-if="loadingCredentials">
              <q-item-label
                ><q-skeleton type="text" width="160px"
              /></q-item-label>
              <q-item-label caption><q-skeleton type="text" /> </q-item-label>
            </q-item-section>
            <q-item-section v-else>
              <q-item-label>{{ cred.device_name }}</q-item-label>
              <q-item-label caption>{{ credCountText(cred) }} </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                round
                size="sm"
                icon="edit"
                name="edit"
                @click="doPasskeyUpdateAsk(evt, cred)"
              />
            </q-item-section>
            <q-item-section side>
              <q-btn
                round
                size="sm"
                icon="delete"
                name="delete"
                @click="doPasskeyDeleteAsk(evt, cred)"
              />
            </q-item-section>
          </q-item>
        </div>
      </q-card-section>
      <q-card-actions class="justify-center">
        <q-btn label="Close" @click="doPasskeyManageClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- End Passkey manage and register dialog -->
  <!-- Confirm Delete passkey dialog  -->
  <q-dialog v-model="confirmDelete" persistent>
    <q-card>
      <q-card-section class="text-h6">{{ t("confirm_delete") }}</q-card-section>
      <q-card-section class="row items-center">
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon name="key" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ confirmDeleteCred.device_name }}</q-item-label>
              <q-item-label caption
                >{{ credCountText(confirmDeleteCred) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat icon="cancel" color="primary" v-close-popup />
        <q-btn
          flat
          icon="delete"
          color="primary"
          @click="doPasskeyDelete(evt, confirmDeleteCred)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- End Confirm Delete passkey dialog -->
  <!-- Confirm Edit passkey dialog  -->
  <q-dialog v-model="confirmEdit" persistent>
    <q-card>
      <q-card-section class="text-h6">{{ t("confirm_edit") }}</q-card-section>
      <q-card-section class="row items-center">
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon name="key" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-input
                  v-model="passkeyName"
                  label="Device Name"
                  :error="showError"
                  error-message="Device Name is required"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat icon="cancel" color="primary" v-close-popup />
        <q-btn
          flat
          icon="edit"
          color="primary"
          @click="doPasskeyUpdate(evt, confirmEditCred)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- End Confirm Edit passkey dialog -->
</template>

<script setup>
import { watch, computed, ref, nextTick } from "vue";
import {
  useListCredentials,
  useNumCredentials,
  usePasskeyLogin,
  usePasskeyRegister,
  usePasskeyDelete,
  usePasskeyUpdate,
} from "src/use/usePasskeys";
import { useIsEVMAddress } from "src/use/useEVM";
import { useIsBTCAddress } from "src/use/useBTC";
import { useStoreUser } from "src/stores/storeUser";
import { useI18n } from "vue-i18n";
import { authDebug } from "src/utils/authDebug";
import HiveInputAcc from "components/HiveInputAcc.vue";
import HiveAvatar from "components/utils/HiveAvatar.vue";
import ConfettiExplosion from "vue-confetti-explosion";
import { formatTimeAgo } from "@vueuse/core";
import { Notify } from "quasar";

const storeUser = useStoreUser();
const t = useI18n().t;

const showDialog = ref(false);
const confirmDelete = ref(false);
const confirmDeleteCred = ref();
const confirmEdit = ref(false);
const confirmEditCred = ref();
const hiveAccObj = ref();

const passkeyName = ref("");
const showError = ref(false);
const listCredentials = ref();
const loadingCredentials = ref(false);
const numCredentials = ref(0);

/**
 * ConfettiExplosion component
 */
const visibleConfetti = ref(false);
async function explode() {
  visibleConfetti.value = false;
  await nextTick();
  visibleConfetti.value = true;
}

// Watch for changes in the current user
watch(storeUser, async (newVal) => {
  if (newVal.currentUser === null) {
    updatePasskeyList(false);
  }
  if (newVal.currentUser !== hiveAccObj.value?.value) {
    listCredentials.value = [];
    numCredentials.value = 0;
  }
});

const isValid = computed(() => {
  if (hiveAccObj.value && hiveAccObj.value.valid) {
    return true;
  } else {
    return false;
  }
});

// Need to watch this computed derivative of hiveAccObj
watch(isValid, async (newVal) => {
  authDebug("isValid changed to:", newVal);
  if (newVal) {
    await updatePasskeyList();
  }
});

/**
 * Updates the passkey list.
 *
 * @param {boolean} useCache - Whether to use the cache or not. Default is true.
 * @returns {Promise} - A promise that resolves when the passkey list is updated.
 */
async function updatePasskeyList(useCache = true) {
  loadingCredentials.value = true;
  let checkHiveAcc = storeUser.currentUser;
  if (!hiveAccObj.value) {
    if (storeUser.currentUser) {
      checkHiveAcc = storeUser.currentUser;
    } else {
      checkHiveAcc = "";
    }
  } else {
    checkHiveAcc = hiveAccObj.value.value;
  }
  numCredentials.value = await useNumCredentials(checkHiveAcc, useCache);
  if (
    storeUser.currentUser === checkHiveAcc &&
    storeUser.currentUser &&
    numCredentials.value > 0
  ) {
    listCredentials.value = await useListCredentials(useCache);
  } else {
    listCredentials.value = [];
  }
  loadingCredentials.value = false;
}

async function doPasskeyLogin() {
  authDebug("doPasskeyLogin");
  if (!hiveAccObj.value.value) {
    return;
  }
  const result = await usePasskeyLogin(hiveAccObj.value.value);
  if (result.success) {
    // Determine correct loginType for passkey logins (supports EVM + BTC addresses)
    let loginType = "hive";
    if (useIsEVMAddress(hiveAccObj.value.value)) {
      loginType = "evm";
    } else if (useIsBTCAddress(hiveAccObj.value.value)) {
      loginType = "btc";
    }

    // With the 2026 auth hardening (short-lived access tokens + HttpOnly refresh cookies),
    // we no longer rely on a client-side 7-day expire for passkeys.
    // Session continuity is now handled by the rotating refresh token cookie.
    // We pass null for expire so expireCheck() does not forcibly log the user out.
    authDebug("Passkey login: Passing expire=null. Using refresh token model (consistent with EVM/BTC changes).");
    await storeUser.login(
      hiveAccObj.value.value,
      "active",
      "webauthn",
      null, // expire - intentionally not set for passkeys
      null,
      result.token,
      loginType,
    );
    Notify.create({
      message: "Logged in with passkey",
      color: "positive",
      position: "top",
    });
    explode();
    await updatePasskeyList(false);
  } else {
    Notify.create({
      message: result.message,
      color: "negative",
      position: "top",
    });
    authDebug("doPasskeyLogin failed");
    authDebug("result", result.message);
  }
}

async function doPasskeyManage() {
  authDebug("doPasskeyManage");
  showDialog.value = true;
  hiveAccObj.value = {
    label: storeUser.currentUser,
    value: storeUser.currentUser,
    caption: storeUser.getUser(storeUser.currentUser).profileName,
  };
  await updatePasskeyList(false);
}

async function doPasskeyManageClose() {
  showDialog.value = false;
  listCredentials.value = [];
  numCredentials.value = 0;
}

async function doPasskeyRegister() {
  loadingCredentials.value = true;
  authDebug("doPasskeyRegister");
  if (!passkeyName.value) {
    showError.value = true;
    return;
  }
  // strip trailing spaces from passkeyName
  passkeyName.value = passkeyName.value.trim();
  const result = await usePasskeyRegister(
    storeUser.currentUser,
    passkeyName.value,
  );
  if (result.success) {
    await updatePasskeyList();
    passkeyName.value = "";
    showError.value = false;
    Notify.create({
      message: "Passkey registered",
      color: "positive",
      position: "top",
    });
    explode();
    await updatePasskeyList(false);
  } else {
    Notify.create({
      message: result.message,
      color: "negative",
      position: "top",
    });
    authDebug("doPasskeyRegister failed");
    authDebug("result", result.message);
  }
  loadingCredentials.value = false;
}

async function doPasskeyDeleteAsk(evt, cred) {
  authDebug("doPasskeyDelete", cred);
  confirmDeleteCred.value = cred;
  confirmDelete.value = true;
}

async function doPasskeyUpdateAsk(evt, cred) {
  authDebug("do PasskeyUpdate", cred);
  passkeyName.value = cred.device_name;
  confirmEditCred.value = cred;
  confirmEdit.value = true;
}

async function doPasskeyDelete(evt, cred) {
  authDebug("doPasskeyDelete", cred);
  confirmDelete.value = false;
  await usePasskeyDelete(cred._id);
  await updatePasskeyList(false);
  Notify.create({
    message: "Passkey deleted",
    color: "positive",
    position: "top",
  });
}

async function doPasskeyUpdate(evt, cred) {
  authDebug("doPasskeyUpdate", cred);
  confirmEdit.value = false;
  authDebug("old name", cred.device_name);
  authDebug("new name", passkeyName.value);
  await usePasskeyUpdate(cred._id, passkeyName.value);
  await updatePasskeyList(false);
  Notify.create({
    message: "Passkey edited",
    color: "positive",
    position: "top",
  });
}

async function doManageKey(cred) {
  authDebug("doManageKey", cred);
  authDebug("cred._id", cred._id);
  authDebug("cred.device_name", cred.device_name);
  authDebug("formatTimeAgo(cred.last_used)", cred.last_used);
}

function credCountText(cred) {
  if (cred.count === 0) {
    return t("unused");
  }
  return `${t("used")}: ${cred.count} time${
    cred.count > 1 ? "s" : ""
  } ${myFormatTimeAgo(cred.last_used)}`;
}

function myFormatTimeAgo(timeString) {
  const date = new Date(timeString + "Z");
  const localTimeString = date.toLocaleString();
  return formatTimeAgo(date);
}
</script>

<style lang="scss" scoped></style>
