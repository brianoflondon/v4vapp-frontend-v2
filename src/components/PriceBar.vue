<template>
  <q-footer elevated>
    <div
      :style="paddingBottom"
      class="price-bar q-pa-none shadow-1 no-wrap row"
    >
      <span class="price-bar-item btc-price q-pa-xs">
        <i class="fa-brands fa-btc" />&thinsp;
        <strong>${{ storeAPIStatus.bitcoin }}</strong>
      </span>
      <span class="price-bar-item hive-price q-pa-xs">
        <i class="fa-brands fa-hive" />&thinsp;
        <strong>
          ${{ storeAPIStatus.hive }}
          &thinsp;/&thinsp;
          {{ storeAPIStatus.hiveSats }}
          <span>
            シ
            <q-tooltip>シ {{ $t("sats") }}</q-tooltip>
          </span>
        </strong>
      </span>
      <span v-if="!smallScreen" class="price-bar-item hbd-price q-pa-xs">
        <hbd-logo-icon />
        <strong>$ {{ storeAPIStatus.hbd }}</strong>
      </span>
      <span class="price-bar-item api-status-indicator q-pl-md q-pa-xs">
        <q-btn
          @click="clearLocalStorage"
          flat
          dense
          :title="storeAPIStatus.apiError ? $t('failure') : $t('working')"
        >
          {{ storeAPIStatus.statusDisp }}
        </q-btn>
      </span>
      <span class="price-bar-item reload-status q-pa-xs">
        <q-btn
          icon="refresh"
          :title="$t('reload_prices')"
          flat
          dense
          @click="storeAPIStatus.update()"
        />
        <q-tooltip
          >{{ $t("prices_fetched") }}:
          {{ storeAPIStatus.lastFetchTime }}</q-tooltip
        >
      </span>
      <span class="price-bar-item keychain-status-indicator q-pa-none">
        <q-btn
          flat
          dense
          :title="
            storeAPIStatus.isKeychainIn
              ? $t('keychain_installed')
              : $t('keychain_missing')
          "
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
      </span>
    </div>
  </q-footer>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from "vue";
import { useStoreAPIStatus } from "src/stores/storeAPIStatus";
import { useI18n } from "vue-i18n";
import { useQuasar, Dialog } from "quasar";
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue";

const storeAPIStatus = useStoreAPIStatus();
const t = useI18n().t;
const q = useQuasar();

let timeoutId;

const smallScreen = computed(() => {
  return q.screen.width < 460;
});

// run on mounted
onMounted(async () => {
  try {
    scheduleUpdate();
  } catch (err) {
    console.error("PriceBar err", err);
  }
});

async function scheduleUpdate() {
  await storeAPIStatus.update();
  // Schedule the next update after 5 minutes
  timeoutId = setTimeout(scheduleUpdate, 10 * 60 * 1000);
}

onUnmounted(() => {
  clearTimeout(timeoutId);
});

const paddingBottom = computed(() => {
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;
  const isIphone = /iPhone/.test(window.navigator.userAgent);

  return isPWA && isIphone ? "padding-bottom: 20px;" : "";
});

function clearLocalStorage() {
  Dialog.create({
    title: t("clear_local_storage"),
    message: t("clear_local_storage_message"),
    ok: {
      label: t("yes"),
      color: "negative",
    },
    cancel: {
      label: t("no"),
      color: "primary",
    },
  }).onOk(() => {
    localStorage.clear();
    location.reload();
  });
}
</script>

<style lang="scss" scoped>
.price-bar {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
