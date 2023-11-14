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
        clearable
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
    if (value) {
      fixedRate.value = parseFloat(value)
      storeUser.pos.fixedRate = fixedRate.value
    } else {
      fixedRate.value = exchangeRate()
      storeUser.pos.fixedRate = null
    }
  },
})

function exchangeRate() {
  if (!coingeckoRates.value[currency.value.value]?.value) {
    // set the value to 1 USD if the currency is not found
    return 1
  }
  return (
    coingeckoRates.value[currency.value.value]?.value /
    coingeckoRates.value["usd"]?.value
  )
}

const usdToCurrency = computed(() => {
  if (!coingeckoRates.value[currency.value.value]?.value) {
    return currency.value.unit
  }
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
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  ;[coingeckoRates.value, currencyOptions.value] = await getCoingeckoRates(storeUser.localCurrency.value)
  if (storeUser.pos.fixedRate) {
    fixedRate.value = parseFloat(storeUser.pos.fixedRate)
  } else {
    fixedRate.value = exchangeRate().toFixed(2)
  }
})
</script>

<style lang="scss" scoped></style>
