<template>
  <div
    class="alternate-currency full-width row wrap justify-around items-start content-start"
  >
    <div class="text-center q-pa-xs" @click="emitEvent('hbd')">
      <HbdLogoIcon />$ {{ tidyNumber(CurrencyCalc.hbd, 3) }}
    </div>
    <div class="text-center q-pa-xs" @click="emitEvent('hive')">
      <i class="fa-brands fa-hive" />&thinsp;{{
        tidyNumber(CurrencyCalc.hive, 3)
      }}
    </div>
    <div class="text-center q-pa-xs" @click="emitEvent(storeUser.localCurrency.value)">
      {{ storeUser.localCurrency.unit }}{{ tidyNumber(CurrencyCalc.local, 2) }}
    </div>
    <div class="text-center q-pa-xs" @click="emitEvent('sats')">
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
import { onMounted, watch } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreUser } from "src/stores/storeUser"
import HbdLogoIcon from "../utils/HbdLogoIcon.vue"
import { useCoingeckoStore } from "src/stores/storeCoingecko"

const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()
const storeCoingecko = useCoingeckoStore()

const CurrencyCalc = defineModel()

const emit = defineEmits(["currencyClicked"])

let localRates = {}

onMounted(async () => {
  calcAllAmounts()
})

watch(
  () => CurrencyCalc.value.amount,
  (val) => {
    CurrencyCalc.value.amount = val
    calcAllAmounts()
  }
)

watch(
  [() => CurrencyCalc.value.currency, () => storeUser.localCurrency],
  async ([newCurrency, newLocalCurrency], [oldCurrency, oldLocalCurrency]) => {
    if (newCurrency !== oldCurrency || newLocalCurrency !== oldLocalCurrency) {
      localRates = await storeCoingecko.getCoingeckoRate(
        storeUser.localCurrency.value
      )
      calcAllAmounts()
    }
  }
)

watch(
  () => storeUser.pos.fixedRate,
  () => {
    calcAllAmounts()
  }
)

function emitEvent(currencyType) {
  console.log("emitEvent", currencyType)
  console.log("Currency Local", storeUser.localCurrency.value)
  emit("currencyClicked", currencyType)
}

function updateLocalRates() {
  // check if the localRates structure has the storeUser.localCurrency.value in it
  // this is necessary if a user has added their own currency
  if (!localRates.hive[storeUser.localCurrency.value]) {
    addCurrency(storeUser.localCurrency.value, storeUser.pos.fixedRate)
  }
}

function addCurrency(currencySymbol, ratePerUSD) {
  // Calculate and add the new currency value for hive and hive_dollar
  localRates.hive[currencySymbol] = localRates.hive.usd * ratePerUSD
  localRates.hive_dollar[currencySymbol] =
    localRates.hive_dollar.usd * ratePerUSD
}

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
    localRates = await storeCoingecko.getCoingeckoRate(
      storeUser.localCurrency.value
    )
  }
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
      var adustRate = 1
      updateLocalRates()
      if (storeUser.pos.fixedRate) {
        adustRate =
          storeUser.pos.fixedRate /
          localRates.hive_dollar[storeUser.localCurrency.value]
      }
      CurrencyCalc.value.hive =
        CurrencyCalc.value.amount /
        localRates.hive[storeUser.localCurrency.value] /
        adustRate
      CurrencyCalc.value.hbd =
        CurrencyCalc.value.amount /
        localRates.hive_dollar[storeUser.localCurrency.value] /
        adustRate
      CurrencyCalc.value.sats =
        (CurrencyCalc.value.hive * storeAPIStatus.hiveSatsNumber) / adustRate
      CurrencyCalc.value.local = CurrencyCalc.value.amount
  }
}
</script>
