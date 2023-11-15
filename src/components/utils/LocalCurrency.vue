<template>
  <div class="fit row wrap justify-start items-start content-start q-gutter-sm">
    <div class="col-7">
      <q-select
        use-input
        fill-input
        hide-selected
        v-model="currency"
        @filter="filterFnAutoselect"
        :options="currencyOptionsFiltered"
        :label="t('local_currency')"
        clearable
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
const currencyOptionsFiltered = ref([])
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
      storeUser.pos.fixedRate = 1.0
    }
  },
})

function exchangeRate() {
  if (!coingeckoRates.value[currency.value?.value]?.value) {
    // set the value to 1 USD if the currency is not found
    return 1.0
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
  (val) => {
    if (val === "" || val === null || val === undefined) {
      currency.value = {
        label: "US Dollar",
        value: "usd",
        unit: "$",
      }
    }
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

async function filterFnAutoselect(val, update, abort) {
  update(() => {
    if (val === "" || val === null || val === undefined) {
      currencyOptionsFiltered.value = []
    } else {
      currencyOptionsFiltered.value = currencyOptions.value.filter((item) => {
        const searchLabels = item.label
          .toLowerCase()
          .includes(val.toLowerCase())
        if (searchLabels) {
          return searchLabels
        }
        const searchValues = item.value
          .toLowerCase()
          .includes(val.toLowerCase())
        return searchValues
      })
    }
  })
}

onMounted(async () => {
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  ;[coingeckoRates.value, currencyOptions.value] = await getCoingeckoRates(
    storeUser.localCurrency.value
  )
  if (storeUser.pos.fixedRate) {
    fixedRate.value = parseFloat(storeUser.pos.fixedRate)
  } else {
    fixedRate.value = exchangeRate().toFixed(2)
  }
  console.log("fixedRate.value", fixedRate.value)
})
</script>

<style lang="scss" scoped></style>
