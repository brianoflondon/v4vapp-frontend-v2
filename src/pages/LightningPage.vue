<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div v-if="!cameraShow" class="q-pb-lg">
        <CreditCard />
      </div>
      <div v-if="cameraShow">
        <QrcodeStream @decode="onDecode" @init="onInitCamera"></QrcodeStream>
      </div>
      <div class="progress-screen">
        <ShowProgress v-model="dInvoice" />
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
          <CountdownBar
            class="q-pt-xs"
            :expiry="dInvoice?.timeExpireDate"
            @message="(val) => (timeMessage = val)"
            @time-left="(val) => checkInvoiceProgress(val)"
          />
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
        <!-- Payment Buttons -->
        <div class="payment-buttons column q-pt-sm" v-show="invoiceValid">
          <div class="keychain-buttons row flex-center q-pb-sm q-gutter-lg">
            <q-btn
              class="payment-button-hive"
              @click="payInvoice('HIVE', 'HiveKeychain')"
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
              @click="payInvoice('HBD', 'HiveKeychain')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:keychain/hive-keychain-round.svg"
              icon-right="img:/avatars/hbd_logo.svg"
              :label="HBD"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
          <div class="has-buttons row flex-center q-gutter-lg">
            <q-btn
              class="payment-button-hive"
              @click="payInvoice('HIVE', 'HAS')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/has/hive-auth-logo.svg"
              icon-right="img:avatars/hive_logo_dark.svg"
              :label="Hive"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
            <q-btn
              class="payment-button-hbd"
              @click="payInvoice('HBD', 'HAS')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/has/hive-auth-logo.svg"
              icon-right="img:/avatars/hbd_logo.svg"
              :label="HBD"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
        </div>
        <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
        <!-- Vote Button -->
        <div class="vote-button q-pa-lg text-center">
          <VoteProposal v-model="voteOptions" />
          <div style="max-width: 265px">
            <ExplanationBox class="q-pt-md"></ExplanationBox>
          </div>
        </div>
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
import { computed, ref, watch } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { QrcodeStream } from "qrcode-reader-vue3"
import { useDecodeLightningInvoice } from "src/use/useLightningInvoice"
import { useGetHiveTransactionHistory } from "src/use/useHive.js"
import { useHiveKeychainTransfer } from "src/use/useKeychain.js"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import AskHASDialog from "components/hive/AskHASDialog.vue"
import ShowProgress from "components/lightning/ShowProgress.vue"
import VoteProposal from "components/utils/VoteProposal.vue"
import CountdownBar from "components/utils/CountdownBar.vue"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"
import CreditCard from "components/hive/CreditCard.vue"
import { useStoreUser } from "src/stores/storeUser"
import ExplanationBox from "components/utils/ExplanationBox.vue"

const invoiceText = ref(null)
const invoiceChecking = ref(false)
const invoiceValid = ref(null)
const dInvoice = ref(null)
const callbackResult = ref(null)
const errorMessage = ref("")
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
const storeUser = useStoreUser()

const HASDialog = ref({ show: false })

let timeMessage = ref("")
// Invoice hint shows expiry time and sats costs and fee
const invoiceHint = computed(() => {
  if (!invoiceValid.value) {
    return t("invoice_hint")
  } else {
    if (invoiceValid.value && dInvoice.value.timeLeft > 1) {
      const message = `${t("invoice")} ${sats.value} (${t("fee")}: ${
        satsFee.value
      }) - ${t("expires")} ${timeMessage.value}`
      return message
    }
    return t("invoice_hint")
  }
})

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

function checkInvoiceProgress(timeLeft) {
  dInvoice.value.timeLeft = timeLeft
  if (timeLeft < 0) {
    // Check if invoice is expired return true if expired
    console.log("Invoice expired")
    dInvoice.value.errors.expired = true
    dInvoice.value.errors.text.push("invoice_expired")
    errorMessage.value = dInvoice.value?.errors.text
      .map((error) => t(error))
      .join(", ")
    dInvoice.value.timeLeft = 0
    invoiceValid.value = false
    invoiceChecking.value = false
    console.log("Invoice expired")
    console.log("errors", dInvoice.value.errors)
  }
}

function receiveNewInvoice(val) {
  if (val === null) {
    // Need to notify of problem with Lightning service of invoice provider
    console.log("Lightning service provider not working")
    dInvoice.value.askDetails = false
    q.notify({
      message: t("invoice_provider_not_working"),
      color: "warning",
      icon: "report_problem",
      position: "top",
      timeout: 3000,
    })
    return
  }
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
  invoiceText.value = null
  invoiceValid.value = null
  invoiceChecking.value = false
  dInvoice.value = {}
  cameraOn.value = false
  cameraShow.value = false
  HASDialog.value = { show: false }
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
      console.log("dInvoice.value", dInvoice.value)
      dInvoice.value.progress = []
      invoiceValid.value = true
      invoiceChecking.value = false
      cameraOn.value = false
      cameraShow.value = false
      if (invoiceType() === "lightningAddress") {
        // need to ask for details including amount
        // make sure we clear any earlier errors
        invoiceValid.value = null
        errorMessage.value = ""
        dInvoice.value.sending = true // Flag to show this is for sending Hive to Lightning
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

async function payInvoice(currency, method) {
  // Pay the invoice using Hive Keychain
  // Add 6 Hive to the amount to cover the fee or 2 HBD
  console.log("payInvoice currency ", currency, "method ", method)
  let amount = 0
  if (currency == "HIVE") {
    amount = parseFloat(Hive.value) + 3 + 0.002 * parseFloat(Hive.value)
  } else if (currency == "HBD") {
    amount = parseFloat(HBD.value) + 2 + 0.002 * parseFloat(Hive.value)
  }
  amount = amount.toFixed(3)
  const memo = `${dInvoice.value.paymentRequest} v4v.app`
  dInvoice.value.progress.push(`${t("requesting")} ${amount} ${currency}`)
  // replace null with logged in user
  let username = null
  if (storeUser.currentUser) {
    username = storeUser.currentUser
  }
  let result = {}
  switch (method) {
    case "HiveKeychain":
      // Hive Keychain process
      result = await useHiveKeychainTransfer(username, amount, currency, memo)
      console.log("pay result", result)
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
        return
      }
      break
    case "HAS":
      HASDialog.value.show = true
      HASDialog.value.payment = {
        username: username,
        amount: amount,
        currency: currency,
        memo: memo,
      }

      // result = await useHASTransfer(username, amount, currency, memo)
      const message = `${t("open_HAS")} <a href="has://sign_wait/">Click</a>`
      dInvoice.value.progress.push(`${t("open_HAS")}`)
      // Code will finish within the useHAS code
      break
  }
}

watch(
  HASDialog,
  async (value) => {
    if (value) {
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_nack") {
        const message = `${t("rejected_payment")}`
        dInvoice.value.progress.push(message)
        q.notify({
          color: "negative",
          avatar: "site-logo/v4vapp-logo.svg",
          timeout: 5000,
          message: message,
          position: "top",
        })
      }
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_ack") {
        const message = `${t("payment_sent")}`
        dInvoice.value.progress.push(message)
        const notif = q.notify({
          avatar: "site-logo/v4vapp-logo.svg",
          color: "positive",
          group: false,
          timeout: 0,
          message: message,
          position: "top",
        })
        await checkHiveTransaction(
          value.payment.username,
          value.resolvedHAS.data,
          notif
        )
      }
    }
  },
  { deep: true }
)

async function checkHiveTransaction(username, trx_id, notif, count = 0) {
  // wait 5 seconds then check for a transaction. Looks for the next transaction
  // after the trx_id. If not found, wait another 5 seconds and check again.
  if (trx_id == null) {
    console.log("checkHiveTransaction trx_id is null")
    return
  }
  count += 1
  await new Promise((resolve) => setTimeout(resolve, 5000))
  const transactions = await useGetHiveTransactionHistory(username)
  const transaction_found = findObjectBefore(transactions, trx_id)
  let memo = ""
  if (!transaction_found) {
    if (count < 20) {
      const message = `${t("waiting_for")} ${count}/20`
      const progressList = dInvoice.value.progress
      if (count > 1) {
        progressList[progressList.length - 1] = message // Overwrite the last item
      } else {
        progressList.push(message) // Add the message as the first item if the list is empty
      }
      notif({
        color: "positive",
        avatar: "site-logo/v4vapp-logo.svg",
        timeout: 0,
        message: message,
        position: "top",
      })
      await checkHiveTransaction(username, trx_id, notif, count)
      return
    }
    memo = `${t("transfer")}: ${t("not_found")}:`
    notif({
      color: "negative",
      avatar: "site-logo/v4vapp-logo.svg",
      timeout: 10000,
      message: memo,
      position: "top",
    })
    return
  }
  memo = `${t("transfer")}: ${transaction_found?.op[1].amount}\n${
    transaction_found?.op[1].memo
  }`
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
