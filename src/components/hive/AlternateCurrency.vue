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
import { store } from "quasar/wrappers"

const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()

const CurrencyCalc = defineModel(null)

let localRates = {}

watch(
  () => CurrencyCalc.value.amount,
  () => {
    console.log("CurrencyCalc", CurrencyCalc.value)
    calcAllAmounts()
  }
)

watch(
  () => CurrencyCalc.value.currency,
  async () => {
    console.log("CurrencyCalc", CurrencyCalc.value)
    console.log("getting rates -----------------------")
    localRates = await getCoingeckoRate(storeUser.localCurrency.value)
    console.log("localRates", localRates)
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
  console.log("CurrencyCalc", CurrencyCalc.value)
  if (CurrencyCalc.value.amount === 0) {
    setAllZero()
    return
  }
  if (!localRates.hive) {
    localRates = await getCoingeckoRate(storeUser.localCurrency.value)
  }
  switch (CurrencyCalc.value.currency) {
    case "HBD":
      CurrencyCalc.value.sats =
        CurrencyCalc.value.amount * storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.hive =
        (CurrencyCalc.value.amount * storeAPIStatus.HBDSatsNumber) /
        storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hbd = CurrencyCalc.value.amount
      console.log("localRates", localRates)
      CurrencyCalc.value.local =
        CurrencyCalc.value.hbd *
        localRates.hive_dollar[storeUser.localCurrency.value]
      break
    case "HIVE":
      CurrencyCalc.value.sats =
        CurrencyCalc.value.amount * storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hive = CurrencyCalc.value.amount
      CurrencyCalc.value.hbd =
        (CurrencyCalc.value.amount * storeAPIStatus.hiveSatsNumber) /
        storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.local =
        CurrencyCalc.value.hive *
        localRates.hive[storeUser.localCurrency.value]
      break
    case "SATS":
      CurrencyCalc.value.sats = CurrencyCalc.value.amount
      CurrencyCalc.value.hive =
        CurrencyCalc.value.amount / storeAPIStatus.hiveSatsNumber
      CurrencyCalc.value.hbd =
        CurrencyCalc.value.amount / storeAPIStatus.HBDSatsNumber
      CurrencyCalc.value.local = CurrencyCalc.value.hive * localRates.hive[storeUser.localCurrency.value]
      break
    default:
      console.log("inside switch rates -----------------------")
      console.log("localRates", localRates)
      console.log("CurrencyCalc.value.currency", CurrencyCalc.value.currency)
      console.log("localRates.hive", localRates.hive)
      console.log(
        "localRates.hive[CurrencyCalc.value.currency]",
        localRates.hive[CurrencyCalc.value.currency]
      )
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
