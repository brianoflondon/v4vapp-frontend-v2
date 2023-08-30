<template>
  <q-dialog v-model="POSDialog.show">
    <q-card>
      <q-toolbar>
        <q-toolbar-title>{{ $t("point_of_sale") }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="POSDialog.show = false" />
      </q-toolbar>
      <q-card-section v-if="false">
        <div class="text-center full-width">
          <q-btn-toggle
            class="full-width"
            spread
            v-model="hiveOrLightning"
            push
            glossy
            toggle-color="primary"
            :options="[
              { label: 'Hive', value: 'Hive' },
              { label: 'Lightning', value: 'Lightning' },
            ]"
          />
        </div>
      </q-card-section>
      <q-card-section style="width: 280px">
        {{ requesting }}
      </q-card-section>
      <q-card-section>
        <div
          class="row text-center justify-center overlay-container"
          :class="{ 'show-tick': POSDialog.paid }"
        >
          <CreateQRCode
            :qrText="POSDialog.qrCodeText"
            :width="280"
            :height="280"
            :hiveAccname="POSDialog.hiveAccTo"
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
        <pre>
          Amount: {{ POSDialog.amountToSend }} {{ POSDialog.currencyToSend }}
          To:     {{ POSDialog.hiveAccTo }}
          Memo:   {{ POSDialog.memo }}
        </pre>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import { useQuasar } from "quasar"
import { useGetHiveTransactionHistory } from "src/use/useHive.js"

const q = useQuasar()

import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useI18n } from "vue-i18n"

const t = useI18n().t
const POSDialog = defineModel(null)

const requesting = computed(() => {
  return (
    t("scan_to_send") +
    " " +
    POSDialog.value.amountToSend +
    " " +
    POSDialog.value.currencyToSend +
    " " +
    t("to") +
    " " +
    POSDialog.value.hiveAccTo
  )
})

const hiveOrLightning = ref("Hive")

const checkTime = 2 // 5 seconds between each check
const maxChecks = 40 // 20 checks total

const checkTimeTotal = checkTime * maxChecks
let currentTime = 0
const progress = ref(1)

const intervalRef = ref([])

onMounted(async () => {
  // write some code to run something every second
  const transactions = await useGetHiveTransactionHistory(
    POSDialog.value.hiveAccTo,
    2
  )
  console.log("transactions")
  console.log(transactions)
  const firstTrxId = transactions[0][1]["trx_id"]
  console.log(firstTrxId)
  POSDialog.value.paid = false
  startCountdown()
  checkHiveTransaction(POSDialog.value.hiveAccTo, firstTrxId)
})

onBeforeUnmount(() => {
  console.log("onBeforeUnmount")
  console.log(intervalRef.value)
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
        // const message = `${t("waiting_for")} ${count}/20`
        // q.notify({
        //   color: "positive",
        //   avatar: "site-logo/v4vapp-logo.svg",
        //   timeout: 1000,
        //   message: message,
        //   position: "top",
        // })
        continue // Continue to the next iteration of the loop
      }
      console.log("transaction_found")
      // Update the most recent trx_id
      trx_id = transaction_found?.trx_id
      console.log("trx_id updated", trx_id)
      console.log(transaction_found?.op[1].memo)
      console.log("posDialog.value.checkCode", POSDialog.value.checkCode)
      console.log(
        "check: ",
        transaction_found?.op[1].memo.endsWith(POSDialog.value.checkCode)
      )
      if (transaction_found?.op[1].memo.endsWith(POSDialog.value.checkCode)) {
        const memo = `${t("transfer")}: ${transaction_found?.op[1].amount}\n${
          transaction_found?.op[1].memo
        }`

        q.notify({
          color: "positive",
          avatar: "site-logo/v4vapp-logo.svg",
          timeout: 10000,
          message: memo,
          position: "top",
        })
        POSDialog.value.paid = true
        // wait 5 seconds before closing the dialog
        await new Promise((resolve) => {
          const watchingInterval = setTimeout(resolve, 1000 * 5)
          intervalRef.value.push(watchingInterval)
        })
        POSDialog.value.show = false
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
    POSDialog.value.show = false
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
  width: 280px; /* Adjust as needed */
  height: 280px; /* Adjust as needed */
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
