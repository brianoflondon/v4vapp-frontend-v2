<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div class="camera-toggle-invoice">
        <div class="column flex-center">
          <div class="row justify-between items-center q-gutter-lg">
            <div class="camera-toggle">
              <q-toggle
                v-model="cameraOn"
                @update:model-value="toggleCamera()"
                icon="photo_camera"
                size="xl"
                color="primary"
                dense
                flat
              />
            </div>
            <q-btn
              @click="pasteClipboard()"
              icon="content_paste_go"
              color="primary"
              size="md"
              round
            />
          </div>
          <div class="column flex-center q-pt-sm q-px-sm">
            <q-input
              class="invoice-input"
              v-model="invoiceText"
              type="textarea"
              name="invoice"
              @clear="clearReset"
              :placeholder="$t('enter_invoice')"
              :label="invoiceLabel"
              debounce="500"
              filled
              for="invoice"
              :loading="invoiceChecking"
              clearable
              @update:model-value="decodeInvoice"
              :error-message="errorMessage"
              :error="invoiceValid === false"
              :bg-color="invoiceColor"
              @keyup.esc="clearReset"
              :hint="invoiceHint"
            >
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
        </div>
      </div>
      <div class="amounts-display flex justify-evenly">
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
      v-if="invoiceValid"
      class="row flex-center q-gutter-lg q-pt-md keychain-button"
    >
      <q-btn
        class="keychain-button-hive"
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
        class="keychain-button-hbd"
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
    <div><p>You will be charged 1Hive or 1HBD extra</p></div>
    <div v-if="cameraShow">
      <QrcodeStream @decode="onDecode" @init="onInitCamera"></QrcodeStream>
    </div>
    <div>
      <pre>{{ dInvoice }}</pre>
    </div>
    <AskDetailsDialog
      v-model="dInvoice"
      @newInvoice="(val) => receiveNewInvoice(val)"
    />
  </q-page>
</template>

<style lang="scss" scoped>
div {
  // border: 1px solid green;
}

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
import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { QrcodeStream } from "qrcode-reader-vue3"
import {
  useDecodeLightningInvoice,
  useGetTimeProgress,
} from "src/use/useLightningInvoice"
import { useHiveKeychainTransfer } from "src/use/useHive.js"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"

const invoiceText = ref(null)
const invoiceChecking = ref(false)
const invoiceValid = ref(null)
const dInvoice = ref(null)
const callbackResult = ref(null)
const errorMessage = ref("")
const countdownTimer = ref()

const cameraOn = ref(false)
const cameraShow = ref(false)
const cameraError = ref("")

const t = useI18n().t
const q = useQuasar()
const storeApiStatus = useStoreAPIStatus()

onMounted(() => {
  // checkExpiry()
})

let countTimer = null

const invoiceHint = computed(() => {
  if (!invoiceValid.value) {
    return t("invoice_hint")
  } else {
    if (invoiceValid.value && dInvoice.value.timeLeft > 1) {
      return `${t("invoice")} ${t("expires")} ${formatTime(
        dInvoice.value.timeLeft
      )}`
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

function calcSatsFee(sats) {
  let satsWithFees = sats
  satsWithFees += storeApiStatus.apiStatus.config.conv_fee_sats
  satsWithFees *= 1 + storeApiStatus.apiStatus.config.conv_fee_percent
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
  cameraOn.value = false
  cameraShow.value = false
}

function onDecode(content) {
  invoiceText.value = content
  decodeInvoice()
}

async function decodeInvoice() {
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
      invoiceValid.value = true
      invoiceChecking.value = false
      cameraOn.value = false
      cameraShow.value = false
      checkExpiry()
      if (invoiceType() === "lightningAddress") {
        // need to ask for details including amount
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
  invoiceChecking.value = true
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
  console.log("memo, amount, currency ", memo, amount, currency)
  const result = await useHiveKeychainTransfer(null, amount, currency, memo)
  console.log("result", result)
  console.log("username: ", result.data.username)
  if (result.success) {
    q.notify({
      color: "positive",
      timeout: 2000,
      message: "Payment successful",
      position: "top",
    })
    clearReset()
  } else {
    q.notify({
      color: "negative",
      timeout: 2000,
      message: result.message,
      position: "top",
    })
  }
}
</script>
