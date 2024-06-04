<template>
  <div class="q-pa-sm col justify-evenly">
    <AlternateCurrency v-model="CurrencyCalcFrom" />
    <AlternateCurrency v-model="CurrencyCalcTo" />
    <pre>
      {{ minMax }}
    </pre>
    <div class="flex justify-center">
      <q-input
        outlined
        v-model="CurrencyCalcFrom.amount"
        inputmode="decimal"
        pattern="\d*"
        :label="$t('from_amount')"
        clearable
        @update:modelValue="(val) => amountUpdated(val, 'from')"
      />
      <q-select
        outlined
        v-model="fromCurrency"
        label="From Currency"
        :options="[
          { label: 'HBD', value: 'hbd' },
          { label: 'HIVE', value: 'hive' },
          { label: 'SATS', value: 'sats' },
        ]"
        :onUpdate:modelValue="(val) => syncToFromCurrency(val, 'from')"
      />
    </div>
    <div class="flex row justify-center q-pa-sm">
      <q-btn
        size="1.5rem"
        flat
        icon="currency_exchange"
        @click="swapCurrencies"
      ></q-btn>
    </div>

    <div class="flex justify-center">
      <q-input
        outlined
        v-model="CurrencyCalcTo.amount"
        inputmode="decimal"
        pattern="\d*"
        :label="$t('to_amount')"
        @update:modelValue="(val) => amountUpdated(val, 'to')"
      />
      <q-select
        outlined
        v-model="toCurrency"
        label="to Currency"
        :options="[
          { label: 'HBD', value: 'hbd' },
          { label: 'HIVE', value: 'hive' },
          { label: 'SATS', value: 'sats' },
        ]"
        :onUpdate:modelValue="(val) => syncToFromCurrency(val, 'to')"
      />
    </div>
    <div v-if="true">
      <div class="q-pa-sm">
        <q-tabs v-model="convertTab">
          <q-tab name="toHive" label="Sats to Hive" class="text-center"></q-tab>
          <q-tab name="toSats" label="Hive to Sats" class="text-center" />
        </q-tabs>
      </div>

      <q-tab-panels v-model="convertTab">
        <q-tab-panel name="toHive">
          <ConvertKeepsats />
        </q-tab-panel>
        <q-tab-panel name="toSats">
          <ReceiveKeepsats justHive="true" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import ConvertKeepsats from "src/components/hive/ConvertKeepsats.vue"
import ReceiveKeepsats from "src/components/hive/ReceiveKeepsats.vue"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
// import { getMinMax } from "src/use/useUtils"
import { useI18n } from "vue-i18n"

const t = useI18n().t

const options = {
  sats: { label: "SATS", value: "sats" },
  hbd: { label: "HBD", value: "hbd" },
  hive: { label: "HIVE", value: "hive" },
}
const minMax = ref({})
const CurrencyCalcFrom = ref({ amount: 0, currency: "sats" })
const CurrencyCalcTo = ref({ amount: 0, currency: "hbd" })

const convertTab = ref("toHive")
const fromCurrency = ref(options["sats"])
const toCurrency = ref(options["hbd"])

async function swapCurrencies() {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  CurrencyCalcFrom.value.currency = fromCurrency.value.value
  CurrencyCalcTo.value.currency = toCurrency.value.value
  const amount = CurrencyCalcFrom.value.amount
  CurrencyCalcFrom.value.amount = CurrencyCalcTo.value.amount
  CurrencyCalcTo.value.amount = amount
}

async function syncToFromCurrency(val, direction) {
  if (direction === "from") {
    toCurrency.value = val.value === "sats" ? options["hbd"] : options["sats"]
  } else {
    fromCurrency.value = val.value === "sats" ? options["hbd"] : options["sats"]
  }
  CurrencyCalcFrom.value.currency = fromCurrency.value.value
  CurrencyCalcTo.value.currency = toCurrency.value.value
  amountUpdated(CurrencyCalcFrom.value.amount, "from")
}

async function updateMinMax() {
  const dest = CurrencyCalcFrom.value.currency.toUpperCase()
  // console.log("dest", dest)
  // minMax.value = getMinMax(dest)
  // console.log("minMax", minMax.value)
}

async function amountUpdated(val, direction) {
  // wait for a tik
  // tidy up val and remove extra spaces and 0
  console.log("val", val)
  if (!val) {
    val = 0
  } else {
    // remove , from Number
    val = val.replace(/^0+/, "")
    val = val.trim().replace(/,/g, "")
    // remove 0 if it is at the start
  }

  console.log("val", val)

  await updateMinMax()
  await new Promise((resolve) => setTimeout(resolve, 100))

  console.log("amount", val)
  console.log("direction", direction)
  if (direction === "from") {
    console.log(CurrencyCalcFrom.value)
    console.log(toCurrency.value.value)
    console.log(CurrencyCalcFrom.value[toCurrency.value.value])
    CurrencyCalcFrom.value.amount = val
    CurrencyCalcTo.value.amount = CurrencyCalcFrom.value[toCurrency.value.value]
    CurrencyCalcTo.value.currency = toCurrency.value.value
  } else {
    console.log(CurrencyCalcTo.value)
    console.log(fromCurrency.value)
    CurrencyCalcTo.value.amount = val
    CurrencyCalcFrom.value.amount =
      CurrencyCalcTo.value[fromCurrency.value.value]
    CurrencyCalcFrom.value.currency = fromCurrency.value.value
  }

  console.log("CurrencyCalcFrom", CurrencyCalcFrom.value)
  console.log("CurrencyCalcTo", CurrencyCalcTo.value)
}
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #ccc;
}
</style>
