<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="flex row justify-between text-caption">
      <div>{{ t("from") }}</div>
      <div>
        Balance: {{ storeUser.balancesDisplay[CurrencyCalcFrom.currency] }}
      </div>
    </div>
    <div class="flex justify-between">
      <q-input
        outlined
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
        name="fromCurrency"
        v-model="fromCurrency"
        :options="[
          { label: 'HBD', value: 'hbd' },
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
      <div>{{ t("to") }}</div>
      <div>
        Balance: {{ storeUser.balancesDisplay[CurrencyCalcTo.currency] }}
      </div>
    </div>
    <div class="flex justify-between">
      <q-input
        outlined
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
        name="toCurrency"
        v-model="toCurrency"
        :options="[
          { label: 'HBD', value: 'hbd' },
          { label: 'HIVE', value: 'hive' },
          { label: 'SATS', value: 'sats' },
        ]"
        :onUpdate:modelValue="(val) => syncToFromCurrency(val, 'to')"
      />
    </div>
    <!-- Payment buttons -->
    <div v-if="CurrencyCalcFrom.currency === 'sats'">
      <!-- KeepSats convert button -->
      <div class="row justify-center q-pa-sm">
        <div class="paywithsats-button flex">
          <q-btn
            class="payment-button-sats q-ma-sm"
            @click="confirmMakePayment"
            :loading="false"
            :disable="false"
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
            class="payment-button-hive q-ma-sm"
            @click="makeHivePayment('HiveKeychain')"
            :loading="false"
            :disable="false"
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
            class="payment-button-hive"
            @click="makeHivePayment('HAS')"
            :loading="false"
            :disable="false"
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
    <AlternateCurrency
      v-model="CurrencyCalcFrom"
      @currencyClicked="(val) => console.log('currencyClicked: ', val)"
    />
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
import { ref, computed } from "vue"
import ConvertKeepsats from "src/components/hive/ConvertKeepsats.vue"
import ReceiveKeepsats from "src/components/hive/ReceiveKeepsats.vue"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import AskHASDialog from "src/components/hive/AskHASDialog.vue"
import KeychainShowQR from "src/components/hive/KeychainShowQR.vue"

import { useKeepSatsConvert } from "src/use/useV4vapp"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useConfirmPayWithApi } from "src/use/useV4vapp"
import { useHiveKeychainTransfer } from "src/use/useKeychain"
import { serverHiveAccount } from "boot/axios"
// import { getMinMax } from "src/use/useUtils"
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
  hbd: { label: "HBD", value: "hbd" },
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
  console.log("validateRange", val)
  console.log("minMax", CurrencyCalcFrom.value.minMax)
  if (val === null || val === undefined || val === "" || val === 0) {
    val = CurrencyCalcFrom.value[CurrencyCalcFrom.value.currency]
  }
  console.log("testing val", val)
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
  // wait for a tik
  // tidy up val and remove extra spaces and 0
  console.log("val changed:", val)
  if (!val || val === "" || val === "0") {
    val = ""
  } else {
    val = parseFloat(val)
  }
  console.log("updated: ", val)

  await new Promise((resolve) => setTimeout(resolve, 200))

  if (direction === "from") {
    CurrencyCalcFrom.value.amount = val
    CurrencyCalcTo.value.amount = CurrencyCalcFrom.value[toCurrency.value.value]
    CurrencyCalcTo.value.currency = toCurrency.value.value
    // limit number to 3 decimal places
  } else {
    CurrencyCalcTo.value.amount = val
    CurrencyCalcFrom.value.amount =
      CurrencyCalcTo.value[fromCurrency.value.value]
    CurrencyCalcFrom.value.currency = fromCurrency.value.value
  }

  // if (CurrencyCalcFrom.value.currency === "sats") {
  //   CurrencyCalcFrom.value.amount = CurrencyCalcFrom.value.amount
  //   CurrencyCalcTo.value.amount = CurrencyCalcTo.value.amount
  // } else {
  //   CurrencyCalcFrom.value.amount = CurrencyCalcFrom.value.amount
  //   CurrencyCalcTo.value.amount = CurrencyCalcTo.value.amount
  // }
}

function confirmMakePayment() {
  if (CurrencyCalcFrom.value.currency === "sats") {
    // converting from sats to hbd
    const message = `You are about to convert ${CurrencyCalcFrom.value.amount} ${CurrencyCalcFrom.value.currency} to ${CurrencyCalcTo.value.amount} ${CurrencyCalcTo.value.currency}`
    const apiPayData = {
      type: "convertSats",
      sats: CurrencyCalcFrom.value.sats,
      currency: CurrencyCalcTo.value.currency.toUpperCase(),
    }
    const response = useConfirmPayWithApi(message, apiPayData)
  } else {
    console.log("not converting from sats")
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

  method = "HiveKeychainQR"

  switch (method) {
    case "HiveKeychainQR":
      KeychainDialog.value.memo = memo
      KeychainDialog.value.currencyToSend =
        CurrencyCalcFrom.value.currency.toLowerCase()
      KeychainDialog.value.hiveAccTo = serverHiveAccount
      KeychainDialog.value.amountToSend = CurrencyCalcFrom.value.amount
      KeychainDialog.value.currencyToSend = CurrencyCalcFrom.value.currency
      KeychainDialog.value.display = "hive"
      KeychainDialog.value.currencyCalc = CurrencyCalcFrom.value
      KeychainDialog.value.show = true
      console.log(KeychainDialog.value)
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
        })
        checkForSats()
      } else {
        q.notify({
          message: result.message,
          color: "negative",
          icon: "error",
        })
      }
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
    })
    // quit checking
    return
  }

  if (count > 10) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 1000 * 5))
  return checkForSats(currentSatsBalance, count + 1)
}

async function payWithApi() {
  console.log("paying....")
  return
  try {
    let response

    response = await useKeepSatsConvert(
      CurrencyCalc.value.sats,
      destination.value.toUpperCase()
    )

    // extract the message from this response
    // paymentInProgressDialog.value.hide()
    if (response.success) {
      q.notify({
        color: "positive",
        timeout: 5000,
        message: response?.message,
        position: "top",
      })
    } else {
      const message = `${t("payment_failed")} - ${response?.message}`
      q.notify({
        color: "negative",
        timeout: 5000,
        message: message,
        position: "top",
      })
    }
    await new Promise((resolve) => setTimeout(resolve, 4000))
    await storeUser.update(false) // update the user bypass the cache
  } catch (e) {
    console.error("Error in payWithApi", e)
    q.notify({
      color: "negative",
      timeout: 5000,
      message: t("payment_failed"),
      position: "top",
    })
  }
}
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #ccc;
}
</style>
