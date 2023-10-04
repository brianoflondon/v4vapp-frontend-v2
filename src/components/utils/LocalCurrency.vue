<template>
  <div class="fit row wrap justify-start items-start content-start q-gutter-sm">
    <div class="col-grow">
      <q-select
        filled
        v-model="currency"
        :options="currencyOptions"
        :label="t('local_currency')"
        map-options
      />
    </div>
    <div class="col-3">
      <q-input
        :label="`${usdToCurrency}`"
        v-model="formattedFixedRate"
        debounce="1000"
      ></q-input>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { getCoingeckoRates } from "src/use/useCoinGecko"
import { tidyNumber } from "src/use/useUtils"
import { store } from "quasar/wrappers"
const t = useI18n().t
const storeUser = useStoreUser()

const coingeckoRates = ref([])
const currencyOptions = ref([])
const currency = ref({ label: "US Dollar", value: "usd" })

// This is where the actual numeric value is stored
const fixedRate = ref(0)

const formattedFixedRate = computed({
  get: () => {
    // Convert number to string (e.g., format it as needed)
    return tidyNumber(parseFloat(fixedRate?.value))
  },
  set: (value) => {
    // Convert string input back to a number
    fixedRate.value = parseFloat(value)
    storeUser.pos.fixedRate = fixedRate.value
    console.log("setting storeUser.pos.fixedRate", storeUser.pos.fixedRate)
  },
})

function exchangeRate() {
  return (
    coingeckoRates.value[currency.value.value]?.value /
    coingeckoRates.value["usd"]?.value
  )
}

const usdToCurrency = computed(() => {
  return currency.value.unit + " " + tidyNumber(exchangeRate(), 2)
})

watch(
  () => currency.value,
  () => {
    storeUser.localCurrency = currency.value
    // reset stored fixedRate to null when currency changes
    fixedRate.value = exchangeRate()
  }
)

watch(
  () => storeUser.localCurrency,
  () => {
    currency.value = storeUser.localCurrency
    // reset stored fixedRate to null when currency changes
    storeUser.pos.fixedRate = null
    fixedRate.value = exchangeRate()
  }
)

onMounted(async () => {
  console.log("storeUser.pos.fixedRate", storeUser.pos.fixedRate)
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  ;[coingeckoRates.value, currencyOptions.value] = await getCoingeckoRates()
  if (storeUser.pos.fixedRate) {
    console.log("storeUser.pos.fixedRate", storeUser.pos.fixedRate)
    fixedRate.value = parseFloat(storeUser.pos.fixedRate)
  } else {
    fixedRate.value = exchangeRate().toFixed(2)
  }
})
</script>

<style lang="scss" scoped></style>
