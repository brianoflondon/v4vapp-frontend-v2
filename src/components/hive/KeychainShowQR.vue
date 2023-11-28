<template>
  <q-dialog v-model="KeychainDialog.show">
    <q-card>
      <q-toolbar>
        <!-- Title Bar -->
        <q-toolbar-title>
          <!-- {{ titleOptions }} -->
          {{ titleOptions[KeychainDialog.display].title }}
        </q-toolbar-title>
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
        <div class="text-center">
          <q-btn-toggle
            spread
            v-model="KeychainDialog.currencyToSend"
            push
            @update:model-value="updateQRCode()"
            toggle-color="primary"
            :options="[
              { label: '', value: 'hbd', slot: 'hbd' },
              { label: '', value: 'hive', slot: 'hive' },
              // { label: 'other', value: 'other' },
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
                class="column items-center q-pa-none"
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
          </q-btn-toggle>
        </div>
        <div
          class="text-center q-pt-md"
          v-if="titleOptions[KeychainDialog.display].showHiveLightning"
        >
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
          <q-btn
            icon="content_copy"
            round
            @click="copyToClipboard(KeychainDialog.qrCodeText)"
          >
            <q-tooltip>{{ t("copy_qrcode") }}</q-tooltip>
          </q-btn>

          <q-btn icon="download" round @click="downloadQR('png')">
            <q-tooltip>{{ t("download_tooltip") }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, onBeforeMount } from "vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
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
import { tidyNumber } from "src/use/useUtils"
import { encodeOp } from "hive-uri"

const q = useQuasar()
const t = useI18n().t

const KeychainDialog = defineModel({
  paid: false,
  loading: true,
  display: "pos",
})
const storeApiStatus = useStoreAPIStatus()
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
  if (showLightning.value === null) {
    return t("no_fees")
  }
  if (!KeychainDialog.value.lndData[cur]) {
    return t("calculating_fees")
  }
  return `sats: ${tidyNumber(
    KeychainDialog.value?.lndData[cur]?.amount,
    0
  )} - ${t("Fees")}: ${tidyNumber(calcFees().sats, 0)} (${tidyNumber(
    calcFees().currency,
    3
  )} ${KeychainDialog.value.currencyToSend})`
})

const requesting = computed(() => {
  return (
    t("scan_to_send") +
    " " +
    KeychainDialog.value.amountString +
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
  if (q.dark.isActive) {
    if (showLightning.value === null || KeychainDialog.value.loading) {
      return "#1976D2"
    }
    return "#18D231"
  } else {
    if (showLightning.value === null || KeychainDialog.value.loading) {
      return "#1976D2"
    }
    return "#18D231"
  }
})

const checkTime = 2 // 5 seconds between each check
const maxChecks = 80 // 20 checks total

const checkTimeTotal = checkTime * maxChecks
let currentTime = 0
const progress = ref(1)

const intervalRef = ref([])

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
      const firstTrxId = KeychainDialog.value.transactions[0].trx_id
      checkHiveTransaction(KeychainDialog.value.hiveAccTo, firstTrxId)
      KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
      startCountdown()
    }
  )
})

// Calculates the fees charged in the same currency Hive/HBD as
// the amount being sent.
function calcFees() {
  const { currencyToSend, amountToSend } = KeychainDialog.value
  const { HBDSatsNumber, hiveSatsNumber, apiStatus } = storeApiStatus

  const exchangeRate = currencyToSend === "HBD" ? HBDSatsNumber : hiveSatsNumber
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
  KeychainDialog.value.qrCodeTextHive = encodeOp(KeychainDialog.value.op)
  KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
}

async function generateLightningQRCode() {
  const cur = KeychainDialog.value.currencyToSend
  if (showLightning.value && KeychainDialog.value?.lndData[cur] == null) {
    KeychainDialog.value.loading = true
    const lndData = await useGetLightingHiveInvoice(
      KeychainDialog.value.hiveAccTo,
      KeychainDialog.value.amountToSend,
      cur,
      KeychainDialog.value.memo,
      KeychainDialog.value.checkCode,
      checkTimeTotal
    )
    KeychainDialog.value.lndData[cur] = lndData

    KeychainDialog.value.loading = false
  }
  if (
    KeychainDialog.value.lndData[cur]?.error ||
    KeychainDialog.value.lndData == null
  ) {
    const message = KeychainDialog.value.lndData[cur]?.error
      ? KeychainDialog.value.lndData[cur]?.error
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
      "lightning:" + KeychainDialog.value?.lndData[cur]["payment_request"]
    KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextLightning
  } else {
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

async function checkHiveTransaction(username, trx_id, count = 0) {
  try {
    while (count < maxChecks) {
      count += 1

      await new Promise((resolve) => {
        const watchingInterval = setTimeout(resolve, 1000 * checkTime)
        intervalRef.value.push(watchingInterval)
      })

      KeychainDialog.value.transactions = await useGetHiveTransactionHistory(
        username,
        20
      )
      const transaction_found = findObjectBefore(
        KeychainDialog.value.transactions,
        trx_id
      )

      if (!transaction_found) {
        continue // Continue to the next iteration of the loop
      }
      // Update the most recent trx_id
      trx_id = transaction_found?.trx_id
      if (
        transaction_found?.op[1].memo.endsWith(KeychainDialog.value.checkCode)
      ) {
        const message = `${t("payment")}: ${
          transaction_found?.op[1].amount
        }\n${useTruncateLnbc(transaction_found?.op[1].memo)}`

        q.notify({
          color: "positive",
          avatar: "/site-logo/v4vapp-logo.svg",
          timeout: 10000,
          message: message,
          position: "top",
        })
        KeychainDialog.value.paid = true
        // wait 5 seconds before closing the dialog
        await new Promise((resolve) => {
          const watchingInterval = setTimeout(resolve, 1000 * 5)
          intervalRef.value.push(watchingInterval)
        })
        KeychainDialog.value.show = false
        return // Exit the function if the transaction is found
      }
      continue // Continue to the next iteration of the loop
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
 * Finds the object in the 'data' array that occurs before the object with the specified 'target_trx_id'.
 *
 * @param {Array} data - The array of objects to search.
 * @param {string} target_trx_id - The transaction ID to search for.
 * @returns {Object|null} - The object that occurs before the target object, or null if not found.
 */
function findObjectBefore(data, target_trx_id) {
  for (let i = 1; i < data.length; i++) {
    if (data[i].trx_id === target_trx_id) {
      return data[i - 1]
    }
  }
  return null
}
</script>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}

.overlay-container {
  position: relative;
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
