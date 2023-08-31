<template>
  <q-dialog v-model="KeychainDialog.show">
    <q-card>
      <q-toolbar>
        <!-- Title Bar -->
        <q-toolbar-title>{{ $t("point_of_sale") }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="KeychainDialog.show = false"
        />
      </q-toolbar>
      <!-- Hive or Lightning button toggle -->
      <q-card-section v-if="true">
        <div class="text-center full-width">
          <q-btn-toggle
            class="full-width"
            spread
            v-model="hiveOrLightning"
            push
            glossy
            @update:model-value="generateLightningQRCode()"
            toggle-color="primary"
            :options="[
              { label: 'Hive', value: 'Hive' },
              { label: 'Lightning', value: 'Lightning' },
            ]"
          />
        </div>
      </q-card-section>
      <!-- Text description of request -->
      <q-card-section :style="{ width: maxUseableWidth + 'px' }">
        {{ requesting }}
      </q-card-section>
      <q-card-section>
        <div
          v-show="KeychainDialog.qrCodeText"
          class="row text-center justify-center overlay-container"
          :style="{
            width: maxUseableWidth + 'px',
            height: maxUseableWidth + 'px',
          }"
          :class="{ 'show-tick': KeychainDialog.paid }"
        >
          <CreateQRCode
            :qrText="KeychainDialog.qrCodeText"
            :width="maxUseableWidth"
            :height="maxUseableWidth"
            :hiveAccname="KeychainDialog.hiveAccTo"
          />
        </div>
        <div v-if="true" class="q-pt-none">
          <q-linear-progress
            class="invoice-timer"
            size="10px"
            :value="progress"
            color="positive"
          >
          </q-linear-progress>
        </div>
      </q-card-section>
      <q-card-section>
        <div :style="{ width: maxUseableWidth + 'px' }">
          Amount: {{ KeychainDialog.amountToSend }}
          {{ KeychainDialog.currencyToSend }}
          <br />
          To: {{ KeychainDialog.hiveAccTo }}<br />
          Memo: {{ KeychainDialog.memo }}
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import { useQuasar } from "quasar"
import { useGetHiveTransactionHistory } from "src/use/useHive.js"
import { useGetLightingHiveInvoice } from "src/use/useLightningInvoice.js"
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useI18n } from "vue-i18n"

const q = useQuasar()

const t = useI18n().t
const KeychainDialog = defineModel(null)

const requesting = computed(() => {
  return (
    t("scan_to_send") +
    " " +
    KeychainDialog.value.amountToSend +
    " " +
    KeychainDialog.value.currencyToSend +
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

const hiveOrLightning = ref("Hive")

const checkTime = 2 // 5 seconds between each check
const maxChecks = 40 // 20 checks total

const checkTimeTotal = checkTime * maxChecks
let currentTime = 0
const progress = ref(1)

const intervalRef = ref([])

onMounted(async () => {
  const transactions = await useGetHiveTransactionHistory(
    KeychainDialog.value.hiveAccTo,
    2
  )
  console.log("transactions")
  console.log(transactions)
  const firstTrxId = transactions[0][1]["trx_id"]
  console.log(firstTrxId)
  KeychainDialog.value.paid = false
  KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
  startCountdown()
  checkHiveTransaction(KeychainDialog.value.hiveAccTo, firstTrxId)
})

async function generateLightningQRCode() {
  console.log("generateLightningQRCode")
  if (
    hiveOrLightning.value == "Lightning" &&
    KeychainDialog.value.lndData == null
  ) {
    KeychainDialog.value.lndData = await useGetLightingHiveInvoice(
      KeychainDialog.value.hiveAccTo,
      KeychainDialog.value.amountToSend,
      KeychainDialog.value.currencyToSend,
      KeychainDialog.value.memo,
      checkTimeTotal
    )
  }
  if (
    KeychainDialog.value.lndData?.error ||
    KeychainDialog.value.lndData == null
  ) {
    const message = KeychainDialog.value.lndData?.error
      ? KeychainDialog.value.lndData?.error
      : t("lightning_invoice_not_created")
    q.notify({
      color: "negative",
      avatar: "site-logo/v4vapp-logo.svg",
      timeout: 2000,
      message: "Error: " + message,
      position: "top",
    })
    hiveOrLightning.value = "Hive"
    return
  }
  if (hiveOrLightning.value == "Lightning") {
    KeychainDialog.value.qrCodeTextLightning =
      "lightning:" + KeychainDialog.value.lndData["payment_request"]
    KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextLightning
  } else {
    KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
  }
}

onBeforeUnmount(() => {
  console.log("onBeforeUnmount")
  console.log(intervalRef.value)
  KeychainDialog.value.lndData = null
  intervalRef.value.forEach((interval) => clearInterval(interval))
})

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
  if (trx_id == null) {
    console.log("checkHiveTransaction trx_id is null")
    return
  }

  try {
    while (count < maxChecks) {
      count += 1

      await new Promise((resolve) => {
        const watchingInterval = setTimeout(resolve, 1000 * checkTime)
        intervalRef.value.push(watchingInterval)
      })

      const transactions = await useGetHiveTransactionHistory(username)
      const transaction_found = findObjectBefore(transactions, trx_id)

      if (!transaction_found) {
        continue // Continue to the next iteration of the loop
      }
      console.log("transaction_found")
      // Update the most recent trx_id
      trx_id = transaction_found?.trx_id
      console.log("trx_id updated", trx_id)
      console.log(transaction_found?.op[1].memo)
      console.log(
        "KeychainDialog.value.checkCode",
        KeychainDialog.value.checkCode
      )
      console.log(
        "check: ",
        transaction_found?.op[1].memo.endsWith(KeychainDialog.value.checkCode)
      )
      if (
        transaction_found?.op[1].memo.endsWith(KeychainDialog.value.checkCode)
      ) {
        const memo = `${t("payment")}: ${transaction_found?.op[1].amount}\n${
          transaction_found?.op[1].memo
        }`

        q.notify({
          color: "positive",
          avatar: "site-logo/v4vapp-logo.svg",
          timeout: 10000,
          message: memo,
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
      avatar: "site-logo/v4vapp-logo.svg",
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
    if (data[i][1].trx_id === target_trx_id) {
      console.log("found transaction")
      console.log(data[i - 1][1])
      return data[i - 1][1]
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
