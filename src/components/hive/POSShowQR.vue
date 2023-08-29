<template>
  <q-dialog v-model="POSDialog.show">
    <q-card>
      <q-toolbar>
        <q-toolbar-title>{{ $t("point_of_sale") }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="POSDialog.show = false" />
      </q-toolbar>
      <q-card-section>
        {{ requesting }}
      </q-card-section>
      <q-card-section>
        <div class="row text-center justify-center">
          <CreateQRCode
            :qrText="POSDialog.qrCodeText"
            :width="350"
            :height="350"
            :hiveAccname="POSDialog.hiveAccTo"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted } from "vue"
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

onMounted(async () => {
  // write some code to run something every second
  const transactions = await useGetHiveTransactionHistory(
    POSDialog.value.hiveAccTo
  )
  console.log("transactions")
  console.log(transactions)
  const firstTrxId = transactions[0][1]["trx_id"]
  console.log(firstTrxId)
  const notif = q.notify({
    avatar: "site-logo/v4vapp-logo.svg",
    color: "positive",
    group: false,
    timeout: 0,
    message: "Hello World",
    position: "top",
  })
  checkHiveTransaction(POSDialog.value.hiveAccTo, firstTrxId, notif)
})

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
      const progressList = []
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
  notif({
    color: "positive",
    avatar: "site-logo/v4vapp-logo.svg",
    timeout: 10000,
    message: memo,
    position: "top",
  })
  POSDialog.value.show = false
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

<style lang="scss" scoped></style>
