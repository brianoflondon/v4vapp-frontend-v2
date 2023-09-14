<template>
  <div
    class="alternate-currency full-width row wrap justify-around items-start content-start"
  >
    <div class="text-center q-pa-xs">
      <HbdLogoIcon />$ {{ tidyNumber(CurrencyCalc.hbd, 3) }}
    </div>
    <div class="text-center q-pa-xs">
      <i class="fa-brands fa-hive" />&thinsp;{{
        tidyNumber(CurrencyCalc.hive, 3)
      }}
    </div>
    <div class="text-center q-pa-xs">
      {{ storeUser.localCurrency.unit }}{{ tidyNumber(CurrencyCalc.local, 2) }}
    </div>
    <div class="text-center q-pa-xs">
      {{ tidyNumber(CurrencyCalc.sats, 0) }}シ
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alternate-currency {
  font-size: 0.9rem;
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreUser } from "src/stores/storeUser"
import HbdLogoIcon from "../utils/HbdLogoIcon.vue"
import { getCoingeckoRate } from "src/use/useCoinGecko"

const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()

const CurrencyCalc = defineModel(null)

let localRates = {}

watch(
  () => CurrencyCalc.value.amount,
  (val) => {
    CurrencyCalc.value.amount = val
    calcAllAmounts()
  }
)

watch(
  () => CurrencyCalc.value.currency,
  async (val) => {
    CurrencyCalc.value.currency = val
    localRates = await getCoingeckoRate(storeUser.localCurrency.value)
    calcAllAmounts()
  }
)

watch(
  () => storeUser.localCurrency,
  async (val) => {
    storeUser.localCurrency = val
    localRates = await getCoingeckoRate(storeUser.localCurrency.value)
    calcAllAmounts()
  }
)

function setAllZero() {
  CurrencyCalc.value.sats = 0
  CurrencyCalc.value.hive = 0
  CurrencyCalc.value.hbd = 0
  CurrencyCalc.value.local = 0
}

async function calcAllAmounts() {
  if (CurrencyCalc.value.amount === 0) {
    setAllZero()
    return
  }
  if (!localRates.hive) {
    localRates = await getCoingeckoRate(storeUser.localCurrency.value)
  }
  console.log(CurrencyCalc.value.currency)
  switch (CurrencyCalc.value.currency) {
    case "hbd":
      CurrencyCalc.value.sats =
        CurrencyCalc.value.amount * storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.hive =
        (CurrencyCalc.value.amount * storeAPIStatus.HBDSatsNumber) /
        storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hbd = CurrencyCalc.value.amount
      CurrencyCalc.value.local =
        CurrencyCalc.value.hbd *
        localRates.hive_dollar[storeUser.localCurrency.value]
      break
    case "hive":
      CurrencyCalc.value.sats =
        CurrencyCalc.value.amount * storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hive = CurrencyCalc.value.amount
      CurrencyCalc.value.hbd =
        (CurrencyCalc.value.amount * storeAPIStatus.hiveSatsNumber) /
        storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.local =
        CurrencyCalc.value.hive * localRates.hive[storeUser.localCurrency.value]
      break
    case "sats":
      CurrencyCalc.value.sats = CurrencyCalc.value.amount
      CurrencyCalc.value.hive =
        CurrencyCalc.value.amount / storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hbd =
        CurrencyCalc.value.amount / storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.local =
        CurrencyCalc.value.hive * localRates.hive[storeUser.localCurrency.value]
      break
    default:
      CurrencyCalc.value.hive =
        CurrencyCalc.value.amount /
        localRates.hive[storeUser.localCurrency.value]
      CurrencyCalc.value.hbd =
        CurrencyCalc.value.amount /
        localRates.hive_dollar[storeUser.localCurrency.value]
      CurrencyCalc.value.sats =
        CurrencyCalc.value.hive * storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.local = CurrencyCalc.value.amount
  }
}
</script>
