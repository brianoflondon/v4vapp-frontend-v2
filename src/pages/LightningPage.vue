<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div v-if="!cameraShow" class="q-pb-lg">
        <CreditCard />
      </div>
      <div v-else>
        <QrcodeStream @decode="onDecode" @init="onInitCamera"></QrcodeStream>
      </div>
      <div class="camera-toggle-invoice">
        <div class="column flex-center">
          <div class="row justify-between items-center q-gutter-lg">
            <div class="camera-toggle">
              <q-toggle
                v-model="cameraOn"
                @update:model-value="toggleCamera()"
                icon="qr_code"
                size="xl"
                color="primary"
                dense
                flat
                toggle-aria-label="Capture QR code with your camera"
              />
            </div>
            <q-btn
              @click="pasteClipboard()"
              icon="content_paste_go"
              color="primary"
              size="md"
              rounded
              :label="t('paste')"
              toggle-aria-label="Paste in a Lightning invoice from your clipboard"
            />
          </div>
          <div class="column flex-center q-pt-sm q-px-sm">
            <q-input
              for="invoice"
              name="invoice"
              class="invoice-input"
              :label="invoiceLabel"
              data-1p-ignore
              v-model="invoiceText"
              @clear="clearReset"
              autogrow
              :placeholder="$t('enter_invoice')"
              debounce="1000"
              filled
              :loading="invoiceChecking"
              clearable
              @update:model-value="decodeInvoice"
              :error-message="errorMessage"
              :error="invoiceValid === false"
              :bg-color="invoiceColor"
              @keyup.esc="clearReset"
              :hint="invoiceHint"
              hide-bottom-space
            >
              <!--
              hide-bottom-space: stops the animation for the hint text

            -->
            </q-input>
          </div>
          <div v-if="countdownTimer > 0" class="q-pt-sm">
            <q-linear-progress
              class="invoice-timer"
              size="10px"
              :value="countdownTimer"
              color="positive"
            >
            </q-linear-progress>
          </div>
          <div v-show="false" class="amounts-display flex justify-evenly">
            <div class="q-pa-xs input-amount-readonly">
              <q-input
                readonly
                input-class="text-right"
                dense
                filled
                v-model="sats"
                label="Sats"
              ></q-input>
            </div>
            <div class="q-pa-xs input-amount-readonly">
              <q-input
                readonly
                input-class="text-right"
                dense
                filled
                v-model="HBD"
                label="HBD"
              ></q-input>
            </div>
            <div class="q-pa-xs input-amount-readonly">
              <q-input
                readonly
                input-class="text-right"
                dense
                filled
                v-model="Hive"
                label="Hive"
              ></q-input>
            </div>
          </div>
        </div>

        <div
          class="payment-buttons row flex-center q-gutter-lg q-pt-md"
          v-show="invoiceValid"
        >
          <q-btn
            class="payment-button-hive"
            @click="payInvoice((value = 'HIVE'))"
            :loading="storeApiStatus.payInvoice"
            :disable="storeApiStatus.payInvoice"
            icon="img:keychain/hive-keychain-round.svg"
            icon-right="img:avatars/hive_logo_dark.svg"
            :label="Hive"
            :color="buttonColor.buttonColor"
            :text-color="buttonColor.textColor"
            size="md"
            rounded
          />
          <q-btn
            class="payment-button-hbd"
            @click="payInvoice((value = 'HBD'))"
            :loading="storeApiStatus.payInvoice"
            :disable="storeApiStatus.payInvoice"
            icon="img:keychain/hive-keychain-round.svg"
            icon-right="fa-sharp fa-dollar-sign"
            :label="HBD"
            :color="buttonColor.buttonColor"
            :text-color="buttonColor.textColor"
            size="md"
            rounded
          />
        </div>
        <div class="vote-button q-pa-lg text-center">
          <VoteProposal v-model="voteOptions" />
        </div>
      </div>
    </div>

    <div class="flex q-pt-md flex-center column">
      <div v-if="true" class="progress-screen">
        <ShowProgress v-model="dInvoice" />
      </div>
    </div>
    <AskDetailsDialog
      v-model="dInvoice"
      @newInvoice="(val) => receiveNewInvoice(val)"
    />
  </q-page>
</template>

<style lang="scss" scoped>
.invoice-input,
.invoice-timer {
  width: 300px;
}

.input-amount-readonly {
  width: 7rem;
}

@media screen and (min-width: 500px) {
  .amounts-display {
    flex-direction: column;
  }
}
</style>

<script setup>
import { computed, ref, onMounted } from "vue"
// import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { QrcodeStream } from "qrcode-reader-vue3"
import {
  useDecodeLightningInvoice,
  useGetTimeProgress,
} from "src/use/useLightningInvoice"
import {
  useHiveKeychainTransfer,
  useGetHiveTransactionHistory,
} from "src/use/useHive.js"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import ShowProgress from "components/lightning/ShowProgress.vue"
import VoteProposal from "components/utils/VoteProposal.vue"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"
import CreditCard from "components/hive/CreditCard.vue"

const invoiceText = ref(null)
const invoiceChecking = ref(false)
const invoiceValid = ref(null)
const dInvoice = ref(null)
const callbackResult = ref(null)
const errorMessage = ref("")
const countdownTimer = ref()
const voteOptions = ref({
  hiveUser: "",
  showButton: true,
  showDialog: false,
})

const cameraOn = ref(false)
const cameraShow = ref(false)
const cameraError = ref("")

const t = useI18n().t
const q = useQuasar()
const storeApiStatus = useStoreAPIStatus()

onMounted(() => {
  // console.log("mounted")
})

let countTimer = null

// Invoice hint shows expiry time and sats costs and fee
const invoiceHint = computed(() => {
  if (!invoiceValid.value) {
    return t("invoice_hint")
  } else {
    if (invoiceValid.value && dInvoice.value.timeLeft > 1) {
      const message = `${t("invoice")} ${sats.value} (${t("fee")}: ${
        satsFee.value
      }) - ${t("expires")} ${formatTime(dInvoice.value.timeLeft)}`
      return message
    }
    return t("invoice_hint")
  }
})

function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

function checkExpiry() {
  if (invoiceValid.value) {
    countTimer = null
    const [timeFraction, timeLeft] = useGetTimeProgress(dInvoice.value)
    countdownTimer.value = timeFraction
    const timeIntervalFor1PercentDrop = calculateTimeInterval(
      timeFraction,
      timeLeft,
      0.01
    )
    if (timeLeft > 0) {
      dInvoice.value.timeLeft = timeLeft
      countTimer = setTimeout(checkExpiry, timeIntervalFor1PercentDrop * 1000)
    } else {
      errorMessage.value = t("invoice_expired")
      invoiceValid.value = false
      countTimer = null
      countdownTimer.value = -1
    }
  }
}

function calculateTimeInterval(timeFraction, timeLeft, percent = 0.01) {
  const percentTime = timeLeft / timeFraction // Calculate the time for 1% progress
  const percentDrop = percentTime * percent // Calculate the time for 1% drop

  return percentDrop // Return the time interval in seconds for a 1% drop
}

const sats = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    return tidyNumber(dInvoice.value?.millisatoshis / 1000)
  }
  return "---"
})

const satsFee = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = dInvoice.value?.millisatoshis / 1000
    const satsFee = (calcSatsFee(sats) - sats).toFixed(0)
    return tidyNumber(satsFee)
  }
  return "---"
})

function calcSatsFee(sats) {
  let satsWithFees = sats
  satsWithFees *= 1 + storeApiStatus.apiStatus.config.conv_fee_percent
  satsWithFees += storeApiStatus.apiStatus.config.conv_fee_sats
  return satsWithFees
}

const HBD = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = calcSatsFee(dInvoice.value?.millisatoshis / 1000)
    const HBD = (sats / storeApiStatus.HBDSatsNumber).toFixed(3)
    return tidyNumber(HBD)
  }
  return "---"
})

const Hive = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = calcSatsFee(dInvoice.value?.millisatoshis / 1000)
    const hive = (sats / storeApiStatus.hiveSatsNumber).toFixed(3)
    return tidyNumber(hive)
  }
  return "---"
})

async function pasteClipboard() {
  if (window.navigator.clipboard) {
    try {
      const text = await window.navigator.clipboard.readText()
      invoiceText.value = text
      decodeInvoice()
    } catch (error) {}
  } else {
    console.error("Clipboard API not supported in this browser.")
  }
}

const invoiceColours = {
  // dark mode is true, light mode is false
  true: {
    empty: "blue-grey-9",
    valid: "green-9",
    invalid: "red-9",
  },
  false: {
    empty: "blue-grey-2",
    valid: "green-2",
    invalid: "red-2",
  },
}

const invoiceColor = computed(() => {
  const colours = invoiceColours[q.dark.isActive]
  if (invoiceValid.value === null) {
    return colours.empty
  }
  if (invoiceValid.value) {
    return colours.valid
  }
  return colours.invalid
})

const buttonColors = {
  // dark mode is true, light mode is false
  true: {
    buttonColor: "grey-9",
    textColor: "grey-6",
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

const invoiceLabels = {
  enter: t("enter_invoice"),
  bolt11: t("valid_invoice"),
  lightningAddress: t("valid_lightning_address"),
  invalid: t("invalid_invoice"),
}

const invoiceLabel = computed(() => {
  return invoiceLabels[invoiceType()]
})

function receiveNewInvoice(val) {
  callbackResult.value = val
  invoiceText.value = val.pr
  decodeInvoice()
}

function invoiceType() {
  // Checks the type of the invoice returns bolt11 or lightningAddress
  if (invoiceValid.value === null) {
    return "enter"
  }
  const type = dInvoice.value?.v4vapp?.type
  if (!type) {
    return "invalid"
  }
  if (type === "bolt11") {
    return "bolt11"
  } else if (type === "lightningAddress") {
    return "lightningAddress"
  } else {
    return "invalid"
  }
}

function clearReset() {
  errorMessage.value = ""
  countdownTimer.value = -1
  countTimer = null
  invoiceText.value = null
  invoiceValid.value = null
  invoiceChecking.value = false
  dInvoice.value = {}
  dInvoice.value.progress = []
  cameraOn.value = false
  cameraShow.value = false
}

function onDecode(content) {
  invoiceText.value = content
  decodeInvoice()
}

async function decodeInvoice() {
  invoiceChecking.value = true
  invoiceValid.value = null
  if (!invoiceText.value) {
    clearReset()
    return true
  }
  // Clean up invoice text input, strip prefixes
  invoiceText.value = invoiceText.value.toLowerCase()
  if (invoiceText.value.startsWith("lightning:")) {
    invoiceText.value = invoiceText.value.substring(10)
  }
  if (invoiceText.value.startsWith("bitcoin:")) {
    const lightningSection = invoiceText.value.match(/lightning=([^&]*)/)
    invoiceText.value = lightningSection[1]
  }
  try {
    // decode the invoice
    dInvoice.value = await useDecodeLightningInvoice(invoiceText.value)
    if (dInvoice.value) {
      dInvoice.value.progress = []
      invoiceValid.value = true
      invoiceChecking.value = false
      cameraOn.value = false
      cameraShow.value = false
      checkExpiry()
      if (invoiceType() === "lightningAddress") {
        // need to ask for details including amount
        // make sure we clear any earlier errors
        invoiceValid.value = null
        errorMessage.value = ""
        dInvoice.value.askDetails = true
        return
      } else {
        if (dInvoice.value?.errors.text.length > 0) {
          errorMessage.value = dInvoice.value?.errors.text
            .map((error) => t(error))
            .join(", ")
          q.notify({
            color: "negative",
            timeout: 2000,
            message: errorMessage.value,
            position: "top",
          })
          invoiceValid.value = false
          invoiceChecking.value = false
          return errorMessage.value
        }
      }
      return true
    }
    errorMessage.value = t("invalid_invoice")
    invoiceValid.value = false
    invoiceChecking.value = false
  } catch (e) {
    invoiceValid.value = false
    invoiceChecking.value = false
    errorMessage.value = t("invalid_invoice")
    return false
  }
}

const cameraErrors = [
  "NotAllowedError",
  "NotFoundError",
  "NotSupportedError",
  "NotReadableError",
  "OverconstrainedError",
  "StreamApiNotSupportedError",
  "InsecureContextError",
]

const onInitCamera = async (promise) => {
  try {
    invoiceChecking.value = true
    await promise
  } catch (errorEvent) {
    if (cameraErrors.includes(errorEvent.name)) {
      cameraError.value = `${t("error")}: ${t(errorEvent.name)}`
    } else {
      cameraError.value = `${t("error")}: ${t("OtherError")}`
    }
    invoiceChecking.value = false
    q.notify({
      color: "negative",
      timeout: 2000,
      message: cameraError.value,
      position: "top",
    })
    setTimeout(() => {
      cameraError.value = ""
      cameraOn.value = false
      cameraShow.value = false
    }, 500)
    cameraOn.value = false
    cameraShow.value = false
    invoiceChecking.value = false
  }
}

function toggleCamera() {
  invoiceChecking.value = !invoiceChecking.value
  setTimeout(() => {
    cameraShow.value = cameraOn.value
  }, 500)
}

async function payInvoice(val) {
  // Pay the invoice using Hive Keychain
  console.log("payInvoice", val)
  const currency = val
  let amount = 0
  if (currency == "HIVE") {
    amount = parseFloat(Hive.value) + 1
  } else if (currency == "HBD") {
    amount = parseFloat(HBD.value) + 1
  }
  const memo = `${dInvoice.value.paymentRequest} 2.v4v.app`
  dInvoice.value.progress.push(`Requesting ${amount} ${currency}`)
  // replace null with logged in user
  const result = await useHiveKeychainTransfer(null, amount, currency, memo)

  if (result.success) {
    const notif = q.notify({
      avatar: "site-logo/v4vapp-logo.svg",
      color: "positive",
      group: false,
      timeout: 0,
      message: result.message,
      position: "top",
    })
    dInvoice.value.progress.push(result.message)
    // Set the username for the Voting Button
    voteOptions.value.hiveUser = result.data.username
    checkHiveTransaction(result.data.username, result.result.id, notif)
  } else {
    dInvoice.value.progress.push(result.message)
    q.notify({
      color: "negative",
      avatar: "site-logo/v4vapp-logo.svg",
      timeout: 2000,
      message: result.message,
      position: "top",
    })
  }
}

async function checkHiveTransaction(username, trx_id, notif, count = 0) {
  // wait 5 seconds then check for a transaction
  count += 1
  await new Promise((resolve) => setTimeout(resolve, 5000))
  const transactions = await useGetHiveTransactionHistory(username)
  const transaction_found = findObjectBefore(transactions, trx_id)
  console.log("transaction_found", transaction_found)
  if (!transaction_found) {
    if (count < 20) {
      const message = `${t("waiting_for")} ${count}/20`
      dInvoice.value.progress.push(message)
      notif({
        color: "positive",
        avatar: "site-logo/v4vapp-logo.svg",
        timeout: 0,
        message: message,
        position: "top",
      })
      await checkHiveTransaction(username, trx_id, notif, count)
    }
    return
  }
  const memo = `Transfer: ${transaction_found.op[1].amount}\n${transaction_found.op[1].memo}`
  dInvoice.value.progress.push(memo)
  notif({
    color: "positive",
    avatar: "site-logo/v4vapp-logo.svg",
    timeout: 10000,
    message: memo,
    position: "top",
  })
  voteOptions.value.showDialog = true
}

/**
 * Finds the object in the 'data' array that occurs before the object with the specified 'target_trx_id'.
 *
 * @param {Array} data - The array of objects to search.
 * @param {string} target_trx_id - The transaction ID to search for.
 * @returns {Object|null} - The object that occurs before the target object, or null if not found.
 */
function findObjectBefore(data, target_trx_id) {
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].trx_id === target_trx_id) {
      return data[i - 1][1]
    }
  }
  return null
}
</script>
