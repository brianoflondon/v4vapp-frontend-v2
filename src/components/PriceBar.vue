<template>
  <q-footer elevated>
    <div class="price-bar q-pa-none shadow-1 no-wrap row">
      <div class="col-9 price-bar-item">
        <span class="price-bar-item btc-price q-pa-xs">
          <i class="fa-brands fa-btc" />&thinsp;
          <strong>${{ storeAPIStatus.bitcoin }}</strong>
        </span>
        <span class="price-bar-item hive-price q-pa-xs">
          <i class="fa-brands fa-hive" />&thinsp;
          <strong>
            ${{ storeAPIStatus.hive }}
            &thinsp;/&thinsp;
            {{ storeAPIStatus.hiveSats }} {{ $t("sats") }}
          </strong>
        </span>
        <span ref="HBDItem" class="price-bar-item hbd-price q-pa-xs">
          HBD
          <strong>${{ storeAPIStatus.hbd }}</strong>
        </span>
      </div>
      <div class="col-3 price-bar-item">
        <span class="price-bar-item api-status-indicator q-pa-none">
          <q-btn
            @click="alert = true"
            flat
            dense
            :title="storeAPIStatus.apiError ? $t('failure') : $t('working')"
          >
            {{ storeAPIStatus.statusDisp }}
          </q-btn>
        </span>
        <span class="price-bar-item reload-status q-pa-none">
          <q-btn
            icon="refresh"
            :title="$t('reload_prices')"
            flat
            dense
            @click="storeAPIStatus.update()"
          />
        </span>
        <span class="price-bar-item keychain-status-indicator">
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
        <DarkSelector />
      </div>
    </div>
  </q-footer>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"

const storeAPIStatus = useStoreAPIStatus()
const t = useI18n().t
const q = useQuasar()

const HBDItem = ref(null)

let timeoutId

// watch the q.screen for changes
watch(
  () => q.screen.width,
  (val) => {
    if (val < 425) {
      console.log((HBDItem.value.style.display = "none"))
    } else {
      console.log((HBDItem.value.style.display = "block"))
    }
  }
)

// run on mounted
onMounted(() => {
  scheduleUpdate()
})

async function scheduleUpdate() {
  console.log("Updating prices")
  await storeAPIStatus.update()
  // Schedule the next update after 5 minutes
  timeoutId = setTimeout(scheduleUpdate, 10 * 60 * 1000)
}

onUnmounted(() => {
  clearTimeout(timeoutId)
})
</script>

<style lang="scss" scoped>
.price-bar-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.body--dark {
  .price-bar {
    background-color: $bar-bg-dark;
    color: $primary;
  }
}

.body--light {
  .price-bar {
    background-color: $bar-bg-light;
    color: whitesmoke;
  }
}
</style>
