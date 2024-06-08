<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="flex row justify-between text-caption">
      <div>{{ t("From") }}</div>
      <div>
        Balance: {{ storeUser.balancesDisplay[CurrencyCalcFrom.currency] }}
      </div>
    </div>
    <div class="exchange-amounts credit-card-width">
      <div class="flex justify-between">
        <q-input
          outlined
          dense
          v-model="CurrencyCalcFrom.amount"
          inputmode="decimal"
          pattern="\d*"
          :label="$t('amount')"
          clearable
          @update:modelValue="(val) => amountUpdated(val, 'from')"
          debounce="1000"
          :rules="validationRule"
        />
        <q-select
          outlined
          dense
          name="fromCurrency"
          v-model="fromCurrency"
          :options="[
            { label: 'HUSD', value: 'hbd' },
            { label: 'HIVE', value: 'hive' },
            { label: 'SATS', value: 'sats' },
          ]"
          :onUpdate:modelValue="(val) => syncToFromCurrency(val, 'from')"
        />
      </div>
      <!-- Swap Symbol -->
      <div class="flex row justify-center q-pa-none">
        <q-btn
          size="1.5rem"
          dense
          flat
          icon="swap_vertical_circle"
          @click="swapCurrencies"
        ></q-btn>
      </div>
      <div class="flex row justify-between text-caption">
        <div>{{ t("To") }}</div>
        <div>
          Balance: {{ storeUser.balancesDisplay[CurrencyCalcTo.currency] }}
        </div>
      </div>
      <div class="flex justify-between">
        <q-input
          outlined
          dense
          v-model="CurrencyCalcTo.amount"
          inputmode="decimal"
          pattern="\d*"
          :label="$t('amount')"
          clearable
          @update:modelValue="(val) => amountUpdated(val, 'to')"
          debounce="1000"
        />
        <q-select
          outlined
          dense
          name="toCurrency"
          v-model="toCurrency"
          :options="[
            { label: 'HUSD', value: 'hbd' },
            { label: 'HIVE', value: 'hive' },
            { label: 'SATS', value: 'sats' },
          ]"
          :onUpdate:modelValue="(val) => syncToFromCurrency(val, 'to')"
        />
      </div>
    </div>

    <!-- Payment buttons -->
    <div class="payment-buttons">
      <div v-if="CurrencyCalcFrom.currency === 'sats'">
        <!-- KeepSats convert button -->
        <div class="row justify-center q-pa-sm">
          <div class="paywithsats-button flex">
            <q-btn
              class="payment-button-sats q-ma-sm"
              @click="confirmMakePayment"
              :loading="false"
              icon="fa-brands fa-btc"
              :label="t('convert')"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
              :disabled="!validateRange()"
              icon-right="img:/site-logo/v4vapp-logo-shadows.svg"
            />
          </div>
        </div>
      </div>
      <div v-else>
        <!-- Hive Payment buttons -->
        <div class="payment-buttons flex row justify-evenly items-center">
          <div class="q-pa-sm">
            <q-btn
              class="payment-button-hivekeychain q-ma-sm"
              @click="makeHivePayment('HiveKeychain')"
              :loading="false"
              :disabled="!validateRange()"
              icon="img:/keychain/hive-keychain-round.svg"
              icon-right="img:avatars/hive_logo_dark.svg"
              label="Keychain"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
          <div class="q-pa-sm">
            <q-btn
              class="payment-button-hivehas"
              @click="makeHivePayment('HAS')"
              :loading="false"
              :disabled="!validateRange()"
              icon="img:/has/hive-auth-logo.svg"
              icon-right="img:avatars/hive_logo_dark.svg"
              label="HAS"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
        </div>
      </div>
      <!-- End Payment buttons -->
    </div>
    <div class="fee-display q-pb-sm">
      {{ convertFees }}
    </div>
    <!-- Alternate currency calculations -->
    <div class="alternate-currency-calculations">
      <div>
        <AlternateCurrency
          v-model="CurrencyCalcFrom"
          @currencyClicked="(val) => console.log('currencyClicked: ', val)"
        />
      </div>
      <div v-show="false">
        <AlternateCurrency v-model="CurrencyCalcTo" />
      </div>
    </div>
    <!-- End Alternate currency calculations -->
    <div v-if="false">
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
  <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
  <KeychainShowQR v-if="KeychainDialog.show" v-model="KeychainDialog" />
</template>

<script setup>
import { ref, computed, nextTick } from "vue"
import ConvertKeepsats from "src/components/hive/ConvertKeepsats.vue"
import ReceiveKeepsats from "src/components/hive/ReceiveKeepsats.vue"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import AskHASDialog from "src/components/hive/AskHASDialog.vue"
import KeychainShowQR from "src/components/hive/KeychainShowQR.vue"

import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useConfirmPayWithApi } from "src/use/useV4vapp"
import { useHiveKeychainTransfer } from "src/use/useKeychain"
import { serverHiveAccount } from "boot/axios"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"
import { tidyNumber } from "src/use/useUtils"

const t = useI18n().t
const q = useQuasar()
const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()

const KeychainDialog = ref({ show: false })
const HASDialog = ref({ show: false })

const options = {
  sats: { label: "SATS", value: "sats" },
  hbd: { label: "HUSD", value: "hbd" },
  hive: { label: "HIVE", value: "hive" },
}
const CurrencyCalcFrom = ref({ amount: 0, currency: "hbd" })
const CurrencyCalcTo = ref({ amount: 0, currency: "sats" })

const convertTab = ref("toHive")
const fromCurrency = ref(options["hbd"])
const toCurrency = ref(options["sats"])

const buttonColors = {
  // dark mode is true, light mode is false
  true: {
    buttonColor: "grey-10",
    textColor: "white-4",
  },
  false: {
    buttonColor: "grey-6",
    textColor: "grey-9",
  },
}

const buttonColor = computed(() => {
  const colours = buttonColors[q.dark.isActive]
  return colours
})

let validationRule = computed(() => [
  (val) => validateRange(val) || validationFailMessage.value,
])

function validateRange(val) {
  if (val === null || val === undefined || val === "" || val === 0) {
    val = CurrencyCalcFrom.value[CurrencyCalcFrom.value.currency]
  }
  return (
    CurrencyCalcFrom.value.minMax &&
    val >= CurrencyCalcFrom.value.minMax.min &&
    val <= CurrencyCalcFrom.value.minMax.max
  )
}

const validationFailMessage = computed(() => {
  if (!CurrencyCalcFrom.value.minMax) {
    return true
  }
  if (CurrencyCalcFrom.value.currency === "sats") {
    return `${tidyNumber(CurrencyCalcFrom.value.minMax.min, 0)} -> ${tidyNumber(
      CurrencyCalcFrom.value.minMax.max,
      0
    )}`
  } else {
    return `${tidyNumber(CurrencyCalcFrom.value.minMax.min, 3)} -> ${tidyNumber(
      CurrencyCalcFrom.value.minMax.max,
      3
    )}`
  }
})

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

async function amountUpdated(val, direction) {
  await nextTick()
  console.log("val changed:", val)
  if (!val || val === "" || val === "0") {
    val = ""
  } else {
    val = parseFloat(val)
  }
  console.log("updated: ", val)

  if (direction === "from") {
    CurrencyCalcFrom.value.amount = val
    await nextTick()
    CurrencyCalcTo.value.amount = CurrencyCalcFrom.value[toCurrency.value.value]
    CurrencyCalcTo.value.currency = toCurrency.value.value
    // limit number to 3 decimal places
  } else {
    CurrencyCalcTo.value.amount = val
    await nextTick()
    CurrencyCalcFrom.value.amount =
      CurrencyCalcTo.value[fromCurrency.value.value]
    CurrencyCalcFrom.value.currency = fromCurrency.value.value
  }
  KeychainDialog.value.currencyToSend =
    CurrencyCalcFrom.value.currency.toLowerCase()
  KeychainDialog.value.amountToSend = CurrencyCalcFrom.value.amount
  reformatValues()
}

function truncateDecimal(number, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces)
  return Math.floor(number * factor) / factor
}

function reformatValues() {
  // reformat the values to the correct number of decimal places
  console.log("reformat values")
  if (CurrencyCalcFrom.value.currency === "sats") {
    CurrencyCalcFrom.value.amount = truncateDecimal(
      CurrencyCalcFrom.value.amount,
      0
    )
    CurrencyCalcTo.value.amount = truncateDecimal(
      CurrencyCalcTo.value.amount,
      3
    )
  } else {
    CurrencyCalcFrom.value.amount = truncateDecimal(
      CurrencyCalcFrom.value.amount,
      3
    )
    CurrencyCalcTo.value.amount = truncateDecimal(
      CurrencyCalcTo.value.amount,
      0
    )
  }
}

async function confirmMakePayment() {
  console.log("confirmMakePayment")
  if (CurrencyCalcFrom.value.currency === "sats") {
    // converting from sats to hbd
    const message = `${t("convert_confirm")} ${tidyNumber(
      CurrencyCalcFrom.value.amount,
      0
    )} ${CurrencyCalcFrom.value.currency} to ${tidyNumber(
      CurrencyCalcTo.value.amount,
      3
    )} ${CurrencyCalcTo.value.currency.toUpperCase()}`
    const apiPayData = {
      type: "convertSats",
      sats: CurrencyCalcFrom.value.sats,
      currency: CurrencyCalcTo.value.currency,
    }
    try {
      const response = await useConfirmPayWithApi(message, apiPayData)
      console.log("response", response)
      if (response) {
        await new Promise((resolve) => setTimeout(resolve, 10000))
        storeUser.update()
        amountUpdated(0, "from")
        console.log("cleared")
      }
    } catch (error) {
      console.log("error", error)
    }
  }
}

// TODO: #214 move this to the Hive payment component
async function makeHivePayment(method) {
  const fixedAmount = CurrencyCalcFrom.value.amount

  // Adds encryption to the memo 2024-02-23
  let memo = `${storeUser.currentUser} Deposit to #SATS`
  // if (privateMemo.value) {
  //   memo = "#" + memo
  // }

  if (method === "HiveKeychain" && !storeAPIStatus.isKeychainIn) {
    method = "HiveKeychainQR"
  }
  switch (method) {
    case "HiveKeychainQR":
      KeychainDialog.value.memo = memo
      KeychainDialog.value.currencyToSend =
        CurrencyCalcFrom.value.currency.toLowerCase()
      KeychainDialog.value.hiveAccFrom = storeUser.currentUser
      KeychainDialog.value.hiveAccTo = serverHiveAccount
      KeychainDialog.value.amountToSend = CurrencyCalcFrom.value.amount
      KeychainDialog.value.display = "convert"
      KeychainDialog.value.currencyCalc = CurrencyCalcFrom.value
      KeychainDialog.value.show = true
      checkForSats()
      break

    case "HiveKeychain":
      const result = await useHiveKeychainTransfer(
        storeUser.currentUser,
        fixedAmount,
        CurrencyCalcFrom.value.currency.toUpperCase(),
        memo
      )
      if (result.success) {
        q.notify({
          avatar: "/site-logo/v4vapp-logo.svg",
          message: result.message,
          color: "positive",
          icon: "check_circle",
          actions: [
            {
              icon: "close",
              round: true,
              handler: () => {},
            },
          ],
        })
        checkForSats()
      } else {
        q.notify({
          message: result.message,
          color: "negative",
          icon: "error",
          actions: [
            {
              icon: "close",
              round: true,
              handler: () => {},
            },
          ],
        })
      }
      break
    case "HAS":
      HASDialog.value.show = true
      HASDialog.value.payment = {
        username: storeUser.currentUser,
        amount: fixedAmount,
        currency: CurrencyCalcFrom.value.currency.toUpperCase(),
        memo: memo,
      }
      break
  }
  storeUser.update()
}

async function checkForSats(oldNetSats = 0, count = 0) {
  let currentSatsBalance = 0
  if (oldNetSats === 0) {
    currentSatsBalance = storeUser.currentKeepSats.net_sats
  } else {
    currentSatsBalance = oldNetSats
  }
  await storeUser.updateSatsBalance(false)
  if (currentSatsBalance != storeUser.currentKeepSats.net_sats) {
    q.notify({
      message: `You now have ${storeUser.currentKeepSats.net_sats} KeepSats`,
      color: "positive",
      icon: "check_circle",
      actions: [
        {
          icon: "close",
          round: true,
          color: "white",
          handler: () => {},
        },
      ],
    })
    // quit checking
    amountUpdated(0, "from")
    storeUser.update()
    return
  }

  if (count > 10) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 1000 * 5))
  return checkForSats(currentSatsBalance, count + 1)
}

const convertFees = computed(() => {
  const feesCalc = calcFees()
  return (
    t("Fees") +
    " " +
    tidyNumber(feesCalc.satsFee, 0) +
    " sats - " +
    tidyNumber(feesCalc.currencyFee, 3) +
    " " +
    feesCalc.currencyExchange +
    " " +
    feesCalc.percentString
  )
})

// Calculates the fees charged in the same currency Hive/HBD as
// the amount being sent.
function calcFees() {
  /**
   * Retrieves the currency to send and the amount to send from the KeychainDialog value.
   *
   * @type {string} currencyToSend - The currency to send.
   * @type {number} amountToSend - The amount to send.
   */
  const currencyExchange =
    CurrencyCalcFrom.value.currency !== "sats"
      ? CurrencyCalcFrom.value.currency
      : CurrencyCalcTo.value.currency
  const { HBDSatsNumber, hiveSatsNumber, apiStatus } = storeAPIStatus
  if (!apiStatus?.config) {
    return {
      currencyFee: 0,
      currencyExchange: currencyExchange,
      satsFee: 0,
      percentString: "",
    }
  }

  const satsValue = CurrencyCalcFrom.value.sats
  const fee =
    satsValue * apiStatus.config.conv_fee_percent +
    apiStatus.config.conv_fee_sats

  const exchangeRate =
    currencyExchange === "hbd" ? HBDSatsNumber : hiveSatsNumber

  let percentString = ""
  if (satsValue > 0) {
    const percent = (fee / satsValue) * 100
    percentString = "(" + percent.toFixed(2) + "%)"
  }
  return {
    currencyFee: fee / exchangeRate,
    currencyExchange: currencyExchange,
    satsFee: fee,
    percentString: percentString,
  }
}
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #ccc;
}

.full-width {
  width: 100%;
}

.credit-card-width {
  width: 365px;
}
</style>
