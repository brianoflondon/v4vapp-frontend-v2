<template>
  <q-select
    filled
    v-model="currency"
    :options="currencyOptions"
    :label="t('local_currency')"
    map-options
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { getCoingeckoRates } from "src/use/useCoinGecko"
const t = useI18n().t
const storeUser = useStoreUser()

const coingeckoRates = ref([])
const currencyOptions = ref([])
const currency = ref({ label: "US Dollar", value: "usd" })

watch(
  () => currency.value,
  () => {
    storeUser.localCurrency = currency.value
  }
)

watch(
  () => storeUser.localCurrency,
  () => {
    currency.value = storeUser.localCurrency
  }
)


onMounted(async () => {
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  [ coingeckoRates.value, currencyOptions.value ] = await getCoingeckoRates()
})
</script>

<style lang="scss" scoped></style>
