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
        <q-btn @click="clearLocalStorage" flat dense :title="statusTitle">
          {{ mergedStatusDisp }}
          <q-tooltip>
            <div>
              <strong>{{ $t("api_status_label") }}</strong>
              {{ storeAPIStatus.apiError ? $t("failure") : $t("working") }}
            </div>
            <div class="q-mt-xs">
              <strong>{{ $t("gateway_status_label") }}</strong>
              {{
                isGatewayFullyOpen
                  ? $t("gateway_status_open")
                  : $t("gateway_status_closed")
              }}
            </div>
            <div>
              {{ $t("gateway_direction_hive_to_lightning") }}:
              {{ gatewayLndStatus }}
            </div>
            <div>
              {{ $t("gateway_direction_lightning_to_hive") }}:
              {{ gatewayHiveStatus }}
            </div>
          </q-tooltip>
        </q-btn>
      </span>
      <span class="price-bar-item reload-status q-pa-xs">
        <q-btn
          icon="refresh"
          :title="$t('reload_prices')"
          flat
          dense
          @click="refreshStatus"
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
import { onMounted, onUnmounted, computed } from "vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useI18n } from "vue-i18n"
import { useQuasar, Dialog } from "quasar"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"

const storeAPIStatus = useStoreAPIStatus()
const t = useI18n().t
const q = useQuasar()

let timeoutId

const gatewayLndStatus = computed(() => {
  if (storeAPIStatus.gatewayLndStatus === "unknown") {
    return t("gateway_status_unknown")
  }
  return storeAPIStatus.gatewayLndStatus === "closed"
    ? t("gateway_status_closed")
    : t("gateway_status_open")
})

const gatewayHiveStatus = computed(() => {
  if (storeAPIStatus.gatewayHiveStatus === "unknown") {
    return t("gateway_status_unknown")
  }
  return storeAPIStatus.gatewayHiveStatus === "closed"
    ? t("gateway_status_closed")
    : t("gateway_status_open")
})

const smallScreen = computed(() => {
  return q.screen.width < 460
})

const isGatewayFullyOpen = computed(() => {
  return storeAPIStatus.isGatewayFullyOpen
})

const isOverallHealthy = computed(() => {
  return storeAPIStatus.isOverallHealthy
})

const mergedStatusDisp = computed(() => {
  return storeAPIStatus.mergedStatusDisp
})

const statusTitle = computed(() => {
  return isOverallHealthy.value ? t("working") : t("failure")
})

// run on mounted
onMounted(async () => {
  try {
    await scheduleUpdate()
  } catch (err) {
    console.error("PriceBar err", err)
  }
})

async function refreshStatus() {
  await storeAPIStatus.update()
}

async function scheduleUpdate() {
  await refreshStatus()
  // Schedule the next update after 10 minutes
  timeoutId = setTimeout(scheduleUpdate, storeAPIStatus.refreshIntervalMs)
}

onUnmounted(() => {
  clearTimeout(timeoutId)
})

const paddingBottom = computed(() => {
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone
  const isIphone = /iPhone/.test(window.navigator.userAgent)

  return isPWA && isIphone ? "padding-bottom: 20px;" : ""
})

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
    localStorage.clear()
    location.reload()
  })
}
</script>

<style lang="scss" scoped>
.price-bar {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
