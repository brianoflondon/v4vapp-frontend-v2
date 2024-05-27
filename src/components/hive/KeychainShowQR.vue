<template>
  <q-dialog v-model="KeychainDialog.show">
    <q-card>
      <q-toolbar>
        <!-- Title Bar -->
        <q-toolbar-title>
          <!-- {{ titleOptions }} -->
          {{ titleOptions[KeychainDialog.display].title }}
        </q-toolbar-title>
        <q-circular-progress
          :value="hiveCheckTimer"
          size="xs"
          color="primary"
          class="q-ma-md"
        />
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="KeychainDialog.show = false"
        />
      </q-toolbar>
      <!-- Hive or Lightning button toggle -->
      <q-card-section>
        <!-- Hive HBD Button Toggle -->
        <div
          class="text-center flex"
          :style="{ width: maxUseableWidth + 'px' }"
        >
          <q-btn-toggle
            spread
            v-model="KeychainDialog.currencyToSend"
            push
            no-caps
            @update:model-value="updateQRCode()"
            toggle-color="primary"
            :options="[
              { label: '', value: 'hbd', slot: 'hbd' },
              { label: '', value: 'hive', slot: 'hive' },
              {
                label: '',
                value: 'sats',
                slot: 'sats',
                disabled: !showLightning,
              },
            ]"
          >
            <!-- HBD Button -->
            <template #hbd>
              <div
                class="column items-center q-pa-none"
                style="font-size: 1.2rem"
              >
                <div><HbdLogoIcon /></div>
                <div
                  class="text-center"
                  style="font-size: 0.5rem; margin: -8px"
                >
                  HBD
                </div>
              </div>
              <div class="q-px-md" style="font-size: 1.2rem">
                {{ tidyNumber(KeychainDialog.currencyCalc.hbd, 2) }}
              </div>
            </template>
            <!-- Hive Button -->
            <template #hive>
              <div
                class="flex column items-center q-pa-none"
                style="font-size: 2.05rem"
              >
                <div><i class="fa-brands fa-hive" /></div>
                <div
                  class="text-center"
                  style="font-size: 0.5rem; margin: -8px"
                >
                  Hive
                </div>
              </div>
              <div class="q-px-md" style="font-size: 1.2rem">
                {{ tidyNumber(KeychainDialog.currencyCalc.hive, 2) }}
              </div>
            </template>
            <template #sats>
              <div class="flex column">
                <div
                  class="column items-center q-pa-none"
                  style="font-size: 2.05rem"
                >
                  <div><i class="fa-brands fa-btc" /></div>
                  <div
                    class="text-center"
                    style="font-size: 0.5rem; margin: -8px"
                  >
                    KeepSats
                  </div>
                </div>
                <div class="q-px-md" style="font-size: 1rem">
                  {{ tidyNumber(KeychainDialog.currencyCalc.sats, 0) }}
                </div>
              </div>
            </template>
          </q-btn-toggle>
        </div>
        <div
          class="text-center q-pt-md"
          v-if="titleOptions[KeychainDialog.display].showHiveLightning"
        >
          <!-- Removed this options for now, don't want to re-write the entire
             history page -->
          <q-toggle
            v-if="false"
            v-model="keepSats"
            :label="t('keepsats')"
            @update:model-value="generateLightningQRCode()"
          >
          </q-toggle>
          <q-btn-toggle
            v-model="showLightning"
            icon="fa-sharp fa-solid fa-bolt"
            spread
            clearable
            @update:model-value="generateLightningQRCode()"
            :options="[{ label: '', value: true, slot: 'lightning' }]"
          >
            <template #lightning>
              <div class="row items-center q-pa-none" style="font-size: 1.2rem">
                <div><i class="fa-sharp fa-solid fa-bolt" /></div>
                <div class="text-center q-px-md" style="font-size: 1.2rem">
                  {{ t("lightning") }}
                </div>
                <div><i class="fa-brands fa-btc" /></div>
              </div>
            </template>
          </q-btn-toggle>
        </div>
      </q-card-section>
      <!-- Text description of request -->
      <q-card-section :style="{ width: maxUseableWidth + 'px' }">
        {{ requesting }} {{ useTruncateLnbc(KeychainDialog.memo) }}
      </q-card-section>
      <q-card-section>
        <!-- Green tick -->
        <div
          v-show="KeychainDialog.qrCodeText"
          class="row text-center justify-center overlay-container"
          :class="{ 'show-tick': KeychainDialog.paid }"
        >
          <CreateQRCode
            :qrText="KeychainDialog.qrCodeText"
            :width="maxUseableWidth"
            :height="maxUseableWidth"
            :hiveAccname="KeychainDialog.hiveAccTo"
            :color="dotColor"
            :loading="KeychainDialog.loading"
            @qr-code="(val) => (qrCode = val)"
          />
        </div>
        <div class="q-pt-none">
          <q-linear-progress
            :width="maxUseableWidth"
            class="invoice-timer"
            size="10px"
            :value="progress"
            color="positive"
          >
          </q-linear-progress>
        </div>
        <!-- Fees -->
        <div
          v-if="titleOptions[KeychainDialog.display].showHiveLightning"
          class="text-center q-pt-sm"
        >
          {{ fees }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="flex q-gutter-sm items-center">
          <div class="q-px-sm">
            <q-btn
              icon="content_copy"
              round
              @click="copyToClipboard(KeychainDialog.qrCodeText)"
            >
              <q-tooltip>{{ t("copy_qrcode") }}</q-tooltip>
            </q-btn>
          </div>
          <div>
            <q-btn icon="download" round @click="downloadQR('png')">
              <q-tooltip>{{ t("download_tooltip") }}</q-tooltip>
            </q-btn>
          </div>
          <div class="col-grow text-right">
            <pre>{{ KeychainDialog.checkCode }}</pre>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, onBeforeMount } from "vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreSales } from "src/stores/storeSales"

import { useQuasar, copyToClipboard } from "quasar"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useTruncateLnbc } from "src/use/useUtils.js"
import {
  useGetHiveTransactionHistory,
  useGetCheckCode,
  useGetHiveAmountString,
  useGenerateHiveTransferOp,
} from "src/use/useHive.js"
import { useGetLightingHiveInvoice } from "src/use/useLightningInvoice.js"
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useI18n } from "vue-i18n"
import { tidyNumber, QRLightningHiveColor } from "src/use/useUtils"
import { encodeOp, Parameters } from "hive-uri"

const hiveCheckTime = 1 // seconds between each check
const hiveCheckTimer = ref(100)

const maxChecks = 100 // 20 checks total

const checkTimeTotal = hiveCheckTime * maxChecks
let currentTime = 0
const progress = ref(1)

const intervalRef = ref([])

const q = useQuasar()
const t = useI18n().t

const KeychainDialog = defineModel()
const keepSats = ref(false)
const storeApiStatus = useStoreAPIStatus()
const storeSales = useStoreSales()
const qrCode = ref(null)

const showLightning = ref(null)

const titleOptions = ref({
  pos: {
    title: t("point_of_sale"),
    showHiveLightning: true,
  },
  hive: {
    title: t("scan_for_keychain"),
    showHiveLightning: false,
  },
})

const fees = computed(() => {
  const cur = KeychainDialog.value.currencyToSend
  const receiveCurrency = keepSats.value ? "sats" : cur.toLowerCase()
  const storeLndKey = cur + receiveCurrency
  if (
    showLightning.value === null ||
    KeychainDialog.value.currencyToSend === "sats"
  ) {
    return t("no_fees")
  }
  if (!KeychainDialog.value.lndData[storeLndKey]) {
    return t("calculating_fees")
  }
  return `sats: ${tidyNumber(
    KeychainDialog.value?.lndData[storeLndKey]?.amount,
    0
  )} - ${t("Fees")}: ${tidyNumber(calcFees().sats, 0)} (${tidyNumber(
    calcFees().currency,
    3
  )} ${KeychainDialog.value.currencyToSend})`
})

const requesting = computed(() => {
  console.log("KeychainDialog.value", KeychainDialog.value)
  let amountString = KeychainDialog.value.amountString
  if (KeychainDialog.value.currencyToSend === "sats") {
    amountString = tidyNumber(KeychainDialog.value.amountToSend, 0) + " sats"
  }
  return (
    t("scan_to_send") +
    " " +
    amountString +
    " " +
    t("to") +
    " " +
    KeychainDialog.value.hiveAccTo
  )
})

// const maxUseableWidth = ref(400)

const maxUseableWidth = computed(() => {
  if (q.screen.width < 460) {
    return q.screen.width - 120
  }
  return 350
})

const dotColor = computed(() => {
  let lightning = true
  if (showLightning.value === null || !showLightning.value) {
    lightning = false
  }
  return QRLightningHiveColor(showLightning.value, KeychainDialog.value.loading)
})

onBeforeMount(() => {
  KeychainDialog.value.checkCode = useGetCheckCode()
  KeychainDialog.value.loading = true
  KeychainDialog.value.paid = false
  KeychainDialog.value.lndData = {}
  updateQRCode()
})

onMounted(async () => {
  useGetHiveTransactionHistory(KeychainDialog.value.hiveAccTo, 20).then(
    (val) => {
      KeychainDialog.value.transactions = val
      KeychainDialog.value.paid = false
      KeychainDialog.value.loading = false
      checkHiveTransaction()
      KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
      startCountdown()
    }
  )
})

function updateStoreSales() {
  /**
   * Represents the currency variable used in the KeychainShowQR component.
   * This variable stores the currency information.
   */
  const currency =
    KeychainDialog.value.currencyToSend === "hbd"
      ? "hive_dollar"
      : KeychainDialog.value.currencyToSend === "hive"
      ? "hive"
      : ""
  const usd =
    KeychainDialog.value.amountToSend * storeApiStatus.prices[currency]?.usd
  storeSales.updateSale({
    checkCode: KeychainDialog.value.checkCode,
    hiveAccTo: KeychainDialog.value.hiveAccTo,
    amount: KeychainDialog.value.amountToSend,
    currencyToSend: KeychainDialog.value.currencyToSend,
    amountString: KeychainDialog.value.amountString,
    memo: KeychainDialog.value.memo,
    timestamp: new Date(),
    timestampUnix: new Date().getTime(),
    usd: usd,
    paid: false,
  })
}

// Calculates the fees charged in the same currency Hive/HBD as
// the amount being sent.
function calcFees() {
  /**
   * Retrieves the currency to send and the amount to send from the KeychainDialog value.
   *
   * @type {string} currencyToSend - The currency to send.
   * @type {number} amountToSend - The amount to send.
   */
  const { currencyToSend, amountToSend } = KeychainDialog.value
  const { HBDSatsNumber, hiveSatsNumber, apiStatus } = storeApiStatus

  const exchangeRate = currencyToSend === "hbd" ? HBDSatsNumber : hiveSatsNumber
  const rawSats = parseFloat(amountToSend) * exchangeRate

  const fee =
    rawSats * apiStatus.config.conv_fee_percent + apiStatus.config.conv_fee_sats

  return { currency: fee / exchangeRate, sats: fee }
}

/**
 * Updates the QR code based on the user's input and selected currency.
 *
 * 1. Calculates the amount to send using the user-selected currency.
 * 2. Converts this amount to a human-readable string representation.
 * 3. If the payment method is via Lightning, it triggers a Lightning-specific QR code generation.
 * 4. For other payment methods, it creates a Hive Transfer Operation and encodes it into a QR code.
 *
 * Precondition:
 * - `KeychainDialog.value` should be populated with necessary user inputs including currency, amount, and target account.
 * - `showLightning.value` determines if the payment method is via Lightning or not.
 *
 * Side Effects:
 * - Updates `KeychainDialog.value` with the operation details, QR code text, and other related values.
 *
 * Note:
 * This function is asynchronous and might require awaiting when called.
 */
async function updateQRCode() {
  KeychainDialog.value.amountToSend =
    KeychainDialog.value.currencyCalc[KeychainDialog.value.currencyToSend]

  KeychainDialog.value.amountString = useGetHiveAmountString(
    KeychainDialog.value.amountToSend,
    KeychainDialog.value.currencyToSend
  )
  updateStoreSales()
  if (showLightning.value) {
    await generateLightningQRCode()
    return
  }
  KeychainDialog.value.op = useGenerateHiveTransferOp(
    "",
    KeychainDialog.value.hiveAccTo,
    KeychainDialog.value.amountToSend,
    KeychainDialog.value.currencyToSend,
    KeychainDialog.value.memo,
    KeychainDialog.value.checkCode
  )

  // params seems to break Hive Keychain
  let params = {
    // signer: KeychainDialog.value.hiveAccTo,
    // callback: "https://webhook.site/#!/62064ca7-46d9-49fa-88b8-212cfb7590f3",
    // no_broadcast: true,
  }

  KeychainDialog.value.qrCodeTextHive = encodeOp(
    KeychainDialog.value.op,
    params
  )

  // KeychainDialog.value.qrCodeTextHive = encodeOp(KeychainDialog.value.op)
  KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
}

async function generateLightningQRCode() {
  /**
   * Retrieves the currency to send from the KeychainDialog value.
   *
   * @returns {string} The currency to send.
   */
  const cur = KeychainDialog.value.currencyToSend
  const receiveCurrency = keepSats.value ? "sats" : cur.toLowerCase()
  const storeLndKey = cur + receiveCurrency

  if (
    showLightning.value &&
    KeychainDialog.value?.lndData[storeLndKey] == null
  ) {
    KeychainDialog.value.loading = true
    const lndData = await useGetLightingHiveInvoice(
      KeychainDialog.value.hiveAccTo,
      KeychainDialog.value.amountToSend,
      cur,
      KeychainDialog.value.memo,
      KeychainDialog.value.checkCode,
      checkTimeTotal,
      receiveCurrency
    )
    KeychainDialog.value.lndData[storeLndKey] = lndData
    KeychainDialog.value.loading = false
  }
  if (
    KeychainDialog.value.lndData[storeLndKey]?.error ||
    KeychainDialog.value.lndData == null
  ) {
    const message = KeychainDialog.value.lndData[storeLndKey]?.error
      ? KeychainDialog.value.lndData[storeLndKey]?.error
      : t("lightning_invoice_not_created")
    q.notify({
      color: "negative",
      avatar: "/site-logo/v4vapp-logo.svg",
      timeout: 2000,
      message: "Error: " + message,
      position: "top",
    })
    showLightning.value = null
    return
  }
  if (showLightning.value) {
    KeychainDialog.value.qrCodeTextLightning =
      "lightning:" +
      KeychainDialog.value?.lndData[storeLndKey]["payment_request"]
    KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextLightning
    storeSales.markAsLightning(KeychainDialog.value.checkCode)
  } else {
    storeSales.markAsHive(KeychainDialog.value.checkCode)
    KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
  }
}

onBeforeUnmount(() => {
  KeychainDialog.value.lndData = null
  intervalRef.value.forEach((interval) => clearInterval(interval))
})

function downloadQR(filetype) {
  let fileName = KeychainDialog.value.hiveAccTo
  if (KeychainDialog.value.hiveOrLightning == "Hive") {
    fileName += "_hive_v4vapp_address"
  } else {
    fileName += "_ln_v4vapp_address"
  }
  qrCode.value.download({ name: fileName, extension: filetype })
}

function startCountdown() {
  // Start the countdown
  const intervalId = setInterval(() => {
    currentTime += 1 // Increment by 1 second
    progress.value = 1 - parseFloat(currentTime / checkTimeTotal)

    // Stop the countdown when the progress reaches 0 or the maxChecks time is reached
    if (progress.value <= 0 || currentTime >= checkTimeTotal) {
      clearInterval(intervalId)
      currentTime = 0 // Reset currentTime for future runs
    }
  }, 1000) // Update every second

  // Store the interval ID so it can be cleared later if needed
  intervalRef.value.push(intervalId)
}

function startHiveCheckTimer() {
  const intervalId = setInterval(() => {
    hiveCheckTimer.value -= 2 // Increment by 1 second
    // Stop the countdown when the progress reaches 0 or the maxChecks time is reached
    if (hiveCheckTimer.value <= 0) {
      clearInterval(intervalId)
      hiveCheckTimer.value = 100 // Reset currentTime for future runs
    }
  }, (hiveCheckTime * 1000) / 50) // Update every hiveCheckTime/100 ms

  // Store the interval ID so it can be cleared later if needed
  intervalRef.value.push(intervalId)
}

async function checkHiveTransaction(count = 0) {
  try {
    while (count < maxChecks) {
      count += 1

      // Wait for hiveCheckTime seconds before checking again
      // also displays the countdown timer

      await new Promise((resolve) => {
        const watchingInterval = setTimeout(resolve, 1000 * hiveCheckTime)
        intervalRef.value.push(watchingInterval)
        startHiveCheckTimer()
      })

      KeychainDialog.value.transactions = await useGetHiveTransactionHistory(
        KeychainDialog.value.hiveAccTo,
        5
      )
      hiveCheckTimer.value = 100
      const transactionFound = findTransactionWithCheckCode(
        KeychainDialog.value?.transactions,
        KeychainDialog.value.checkCode
      )
      if (!transactionFound) {
        continue // Continue to the next iteration of the loop
      }
      // Transaction found

      const message = `${t("payment")}: ${
        transactionFound?.op[1].amount
      }\n${useTruncateLnbc(transactionFound?.op[1].memo)}`

      q.notify({
        color: "positive",
        avatar: "/site-logo/v4vapp-logo.svg",
        timeout: 10000,
        message: message,
        position: "top",
      })
      KeychainDialog.value.paid = true
      // wait hiveCheckTime seconds before closing the dialog
      await new Promise((resolve) => {
        const watchingInterval = setTimeout(resolve, 1000 * hiveCheckTime)
        intervalRef.value.push(watchingInterval)
      })
      KeychainDialog.value.show = false
      storeUser.update()
      return // Exit the function if the transaction is found
    } // End of the While Loop
    const memo = `${t("transfer")}: ${t("not_found")}:`
    q.notify({
      color: "negative",
      avatar: "/site-logo/v4vapp-logo.svg",
      timeout: 5000,
      message: memo,
      position: "top",
    })
    KeychainDialog.value.show = false
    return // Exit the function if the transaction is not found after maxChecks
  } catch (error) {
    console.error("Error:", error.message)
  }
}

/**
 * Searches through an array of transactions to find a transaction with a memo that ends with the provided checkCode.
 * If such a transaction is found, it marks the corresponding sale as paid in the storeSales store,
 * and adds additional information (trx_id, hiveAccFrom, amountPaid) to the sale.
 *
 * @param {Array} transactions - An array of transaction objects to search through.
 * @param {string} checkCode - The checkCode to search for in the transaction memos.
 *
 * @returns {Object} The found transaction object, or undefined if no transaction with a matching checkCode is found.
 */
function findTransactionWithCheckCode(transactions, checkCode) {
  if (!transactions || !checkCode) {
    console.error(
      "findTransactionWithCheckCode: missing transactions or checkCode"
    )
    return
  }
  const transactionFound = transactions.find((transaction) =>
    transaction.op[1].memo.endsWith(checkCode)
  )
  if (transactionFound) {
    const trx_id = transactionFound?.trx_id
    // modify the transaction object to include the memo without the checkCode
    const hiveAccFrom = transactionFound.op[1].from
    const amountPaid = transactionFound.op[1].amount
    storeSales.markPaid(
      KeychainDialog.value.checkCode,
      trx_id,
      hiveAccFrom,
      amountPaid
    )
    return transactionFound
  }
}
</script>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}

.overlay-container {
  position: relative;
}

.border-div {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.overlay-container::after {
  content: "";
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  background-image: url("/avatars/green-tick.svg"); /* Replace with the path to your green tick image */
  background-size: contain;
  background-repeat: no-repeat;
  animation: fadeIn 0.2s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.9;
  }
}

.overlay-container.show-tick::after {
  display: block;
  opacity: 0.9;
}
</style>
