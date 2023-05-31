<template>
  <q-footer elevated>
    <div class="price-bar q-pa-none shadow-1 no-wrap row">
      <div class="col-10 price-bar-item">
        <span class="price-bar-item btc-price q-pa-xs">
          <i class="fa-brands fa-btc" />&thinsp;
          <strong>${{ storeAPIStatus.bitcoin }}</strong>
        </span>
        <span class="price-bar-item btc-price q-pa-xs">
          <i class="fa-brands fa-hive" />&thinsp;
          <strong>
            ${{ storeAPIStatus.hive }}
            &thinsp;/&thinsp;
            {{ storeAPIStatus.hiveSats }} {{ $t("sats") }}
          </strong>
        </span>
        <span class="price-bar-item hbd-price q-pa-xs">
          HBD
          <strong>${{ storeAPIStatus.hbd }}</strong>
        </span>
        <span class="price-bar-item api-status-indicator q-pa-xs">
          <q-btn
            @click="alert = true"
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
        </span>
        <span class="price-bar-item keychain-status-indicator q-pa-xs">
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
      <div class="col-2 price-bar-item">
        <DarkSelector />
      </div>
    </div>
  </q-footer>
</template>

<script setup>
import { ref } from "vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useI18n } from "vue-i18n"

const storeAPIStatus = useStoreAPIStatus()
const t = useI18n().t

storeAPIStatus.update()

const loadingState = ref(true)
const text = ref("")

async function load() {
  loadingState.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  text.value = "Hello World!"
  loadingState.value = false
}

load()
</script>

<style lang="scss" scoped>
.price-bar-item {
  display: flex;
  justify-content: center;
  align-items: center;
  /* Add any other necessary styles */
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
