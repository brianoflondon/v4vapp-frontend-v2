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
import { axios } from "boot/axios"
import { ref, onMounted, watch } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
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

async function getCoingeckoRates() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/exchange_rates"
    )
    if (res.status == 200) {
      coingeckoRates.value = res.data.rates

      // Iterating through the data to create the desired list
      for (const rateKey in coingeckoRates.value) {
        if (coingeckoRates.value.hasOwnProperty(rateKey)) {
          currencyOptions.value.push({
            label: coingeckoRates.value[rateKey].name,
            value: rateKey,
          })
        }
      }
    }
  } catch (err) {
    console.log(err)
  }
}

onMounted(() => {
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  getCoingeckoRates()
})
</script>

<style lang="scss" scoped></style>
