<template>
  <div class="q-pb-sm fit row wrap justify-start items-center content-start">
    <div class="col-grow">
      <q-input dense v-model="searchFilter" label="Search"></q-input>
    </div>
    <div>
      <q-btn-toggle
        v-model="paidFilter"
        dense
        :options="[
          { label: '', value: 'all', icon: 'fa-solid fa-dollar-sign' },
          { label: '', value: 'paid', icon: 'fa-solid fa-check' },
          { label: '', value: 'pending', icon: 'fa-solid fa-clock' },
        ]"
      ></q-btn-toggle>
    </div>
  </div>
  <!-- Main table -->
  <div class="q-pa-none">
    <q-table
      class="q-pa-xs"
      :rows="filteredDataLocal"
      dense
      v-model:expanded="rowsExpanded"
      row-key="checkCode"
      :columns="localSalesColumns"
      :visible-columns="['date', 'amountstring', 'status', 'expand']"
      separator="none"
      :pagination="{
        rowsPerPage: 5,
        display: false,
        sortBy: 'date',
      }"
    >
      <template v-slot:header-cell-amountstring="props">
        <q-th :props="props" style="text-align: center">
          {{ props.col.label }}
        </q-th>
      </template>
      <template v-slot:header-cell-status="props">
        <q-th :props="props" style="text-align: center">
          {{ props.col.label }}
        </q-th>
      </template>
      <template v-slot:header-cell-expand="props">
        <q-th :props="props" style="text-align: right">
          <q-btn
            round
            flat
            dense
            :icon="rowsExpanded.length === 0 ? 'expand_more' : 'expand_less'"
            @click="expandAll"
          ></q-btn>
        </q-th>
      </template>
      <!-- Main table body  -->
      <template #body="props">
        <q-tr :props="props">
          <q-td :props="props" key="date">
            {{ prettyDate(props.row) }}
          </q-td>
          <q-td k:props="props" key="amountstring" dense>
            {{ props.row.amountString }}
          </q-td>
          <q-td :props="props" key="status">
            <span @click="retryPending(props)">
              <q-chip
                dense
                :color="props.row.paid ? 'green' : 'yellow-10'"
                :icon="
                  props.row.lightning
                    ? 'fa-sharp fa-solid fa-bolt'
                    : 'fa-brands fa-hive'
                "
              >
                <div class="q-px-xs">
                  {{ props.row.paid ? $t("paid") : $t("pending") }}
                </div>
              </q-chip>
            </span>
            <span v-if="!props.row.paid">
              <q-btn icon="delete" dense flat @click="deletePending(props)">
                <!-- <q-tooltip>{{ $t("delete_pending_tooltip") }}</q-tooltip> -->
              </q-btn>
            </span>
          </q-td>
          <q-td :props="props" key="expand" style="text-align: right">
            <q-btn
              round
              flat
              dense
              :icon="props.expand ? 'expand_less' : 'expand_more'"
              @click="props.expand = !props.expand"
            ></q-btn>
          </q-td>
        </q-tr>
        <!-- End of main table  -->
        <!-- Expanded row details  -->
        <q-tr v-if="props.expand">
          <q-td colspan="100%">
            <div class="fit row justify-start items-start content-start">
              <div>
                <!-- Payee  -->
                <div class="q-pr-sm">
                  <div class="small-text">
                    {{ $t("pay_to") }}
                  </div>
                  <div class="">
                    <q-avatar rounded size="md">
                      <HiveAvatar :hiveAccname="props.row.hiveAccTo" />
                    </q-avatar>
                  </div>
                  <div class="small-text">
                    {{ props.row.hiveAccTo }}
                  </div>
                </div>
              </div>
              <!-- End of Payee -->
              <!-- Payer  -->
              <div v-if="props.row.paid" class="q-px-sm">
                <div class="small-text">
                  {{ $t("paid_by") }}
                </div>
                <div class="">
                  <q-avatar rounded size="md">
                    <HiveAvatar :hiveAccname="props.row.hiveAccFrom" />
                  </q-avatar>
                </div>
                <div class="small-text">
                  {{ props.row.hiveAccFrom }}
                </div>
              </div>
              <!-- End of Payer -->
              <!-- details of transaction  -->
              <div class="col-grow self-end text-right">
                <div v-if="props.row.paid">
                  {{ formatDateTimeLocale(props.row.paidDate).date }}
                  {{ formatDateTimeLocale(props.row.paidDate).time }}
                  <a
                    :href="useGenerateTxUrl(props.row.trx_id)"
                    target="_blank"
                    class="custom-link"
                  >
                    <q-btn
                      size="xs"
                      text-color="inherit"
                      flat
                      dense
                      icon="open_in_new"
                      name="open_in_new"
                    />
                  </a>
                </div>
                <div v-else>
                  {{ formatDateTimeLocale(props.row.timestamp).date }}
                  {{ formatDateTimeLocale(props.row.timestamp).time }}
                </div>
                <div class="">{{ props.row.amountString }}</div>
                <div v-if="props.row.memo" class="">
                  {{ props.row.memo }}
                </div>
                <div>USD ${{ props.row.usd.toFixed(2) }}</div>
                <div class="small-text">
                  {{ props.row.checkCode }}
                </div>
              </div>
            </div>
          </q-td>
        </q-tr>
        <!-- End of expanded row details -->
      </template>
    </q-table>
  </div>
  <q-separator />
  <!-- End of main table -->
  <!-- Totals  and import buttons-->
  <div class="q-pt-sm bordered-div">
    <!-- total amounts -->
    <div class="q-pb-sm fit row no-wrap justify-center bordered-div">
      <div class="q-px-sm bordered-div">
        <i class="fa-brands fa-hive" />{{ totalAmounts.hive }}
      </div>
      <div><q-icon name="add" /></div>
      <div class="q-px-sm bordered-div">
        <hbd-logo-icon />&nbsp;{{ totalAmounts.hbd }}
      </div>
      <div><q-icon name="drag_handle" /></div>
      <div class="q-px-sm bordered-div">${{ totalAmounts.usd }}</div>
    </div>
    <!-- end total amounts -->
    <!-- Import and delete buttons -->
    <div
      class="q-pb-sm fit row no-wrap justify-evenly items-center bordered-div"
    >
      <div class="bordered-div">
        <q-btn
          dense
          rounded
          size="sm"
          icon="fa-brands fa-hive"
          @click="importFromHive"
          class="q-mr-sm"
        >
          <q-tooltip>{{ $t("import_from_hive_tooltip") }}</q-tooltip>
          <div class="q-px-xs">
            {{ $t("import_hive") }}
          </div>
        </q-btn>
      </div>
      <div class="bordered-div">
        <q-btn
          dense
          rounded
          size="sm"
          icon="delete"
          @click="deleteLocalSales"
          class="q-mr-sm"
        >
          <q-tooltip>{{ $t("delete_local_records_tooltip") }}</q-tooltip>
          <div class="q-px-">
            {{ $t("local_records") }}
          </div>
        </q-btn>
      </div>
    </div>
    <!-- End of import and delete buttons -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory, useGenerateTxUrl } from "src/use/useHive"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { formatDateTimeLocale, formatTimeDifference } from "src/use/useUtils"
import { useStoreSales } from "src/stores/storeSales"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useI18n } from "vue-i18n"
import { Dialog } from "quasar"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
const t = useI18n().t
const storeAPIStatus = useStoreAPIStatus()

const totalAmounts = ref({
  hive: 0,
  hbd: 0,
  usd: 0,
})
const storeSales = useStoreSales()
const KeychainDialog = defineModel()
const searchFilter = ref()
const paidFilter = ref("all")
const emit = defineEmits(["update-fields"])

const rowsExpanded = ref([])
const localSalesColumns = ref([
  {
    name: "date",
    label: t("date"),
    sortable: true,
    field: (row) => row.timestampUnix,
    align: "left",
    sort: (a, b, rowA, rowB) => rowB.timestampUnix - rowA.timestampUnix,
  },
  {
    name: "amountstring",
    label: t("amount"),
    field: (row) => row.amountString,
    align: "right",
    sortable: true,
    sort: (a, b, rowA, rowB) => rowB.usd - rowA.usd,
  },
  {
    name: "status",
    label: t("status"),
    align: "center",
    field: (row) => row.paid,
  },
  {
    name: "expand",
    field: "expand",
  },
])

const filteredDataLocal = computed(() => {
  const localData = storeSales.salesAll
  const filteredByPaidStatus = localData.filter((row) => {
    return (
      paidFilter.value === "all" ||
      (paidFilter.value === "paid" && row.paid) ||
      (paidFilter.value === "pending" && !row.paid)
    )
  })

  if (!searchFilter.value) return filteredByPaidStatus

  const filteredData = filteredByPaidStatus.filter((row) => {
    return (
      row.hiveAccTo?.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
      row.hiveAccFrom
        ?.toLowerCase()
        .includes(searchFilter.value.toLowerCase()) ||
      row.memo?.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
      row.checkCode?.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
      row.amountString?.toLowerCase().includes(searchFilter.value.toLowerCase())
    )
  })

  return filteredData
})

watch(
  () => filteredDataLocal.value,
  (val) => {
    getAmounts()
  }
)

function getAmounts() {
  const amounts = {
    hive: 0,
    hbd: 0,
    usd: 0,
  }
  filteredDataLocal.value.forEach((row) => {
    if (row.currencyToSend === "hive") {
      amounts.hive += parseFloat(row.amount)
    } else if (row.currencyToSend === "hbd") {
      amounts.hbd += parseFloat(row.amount)
    }
  })
  amounts.hive = amounts.hive.toFixed(3)
  amounts.hbd = amounts.hbd.toFixed(3)
  // convert hive to USD
  totalAmounts.value = amounts
  if (storeAPIStatus.prices === "fetching prices") {
    // wait a bit and try again
    setTimeout(() => {
      getAmounts()
    }, 1000)
    return
  }
  amounts.usd = amounts.hive * storeAPIStatus.prices?.hive?.usd
  amounts.usd += amounts.hbd * storeAPIStatus.prices?.hive_dollar?.usd
  totalAmounts.value.usd = amounts.usd.toFixed(2)
}

/**
 * Watches for changes in `KeychainDialog.value.hiveAccTo`.
 *
 * When `KeychainDialog.value.hiveAccTo` changes, it assigns the new value to `KeychainDialog.value.transactions`
 * and then calls the `updateTransactions` function.
 *
 * Note: This function is asynchronous.
 */
watch(
  () => KeychainDialog.value.hiveAccTo,
  async (val) => {
    KeychainDialog.value.transactions = val
    updateTransactions()
  }
)

watch(
  () => KeychainDialog.value.paid,
  async (val) => {
    KeychainDialog.value.paid = val
    updateTransactions()
  }
)

/**
 * Toggles the expansion of all rows in the table.
 *
 * If no rows are currently expanded, it expands all rows by setting `rowsExpanded.value` to an array of all checkCodes.
 * If there are any expanded rows, it collapses all rows by setting `rowsExpanded.value` to an empty array.
 */
function expandAll() {
  if (rowsExpanded.value.length === 0) {
    rowsExpanded.value = filteredDataLocal.value.map((row) => row.checkCode)
  } else {
    rowsExpanded.value = []
  }
}

/**
 * Asynchronously imports transactions from Hive blockchain.
 *
 * This function first updates the transactions by calling `updateTransactions()`.
 * Then, for each transaction in `filteredDataHive`, it creates a `sale` object
 * with various properties derived from the transaction data, including a `lightning`
 * property that is `true` if the transaction is from the "v4vapp" account.
 * Finally, it updates the sales store with the `sale` object.
 *
 * Note: This function modifies `filteredDataHive` in-place by reversing it.
 *
 * @async
 */
async function importFromHive() {
  updateTransactions()
  // for all the records in transactions add them to the local sales store
  filteredDataHive.value.reverse().forEach((transaction) => {
    const hiveAccTo = transaction.op[1].to
    const amountString = transaction.op[1].amount
    const amount = transaction.op[1].amount.split(" ")[0]
    const currencyToSend = transaction.op[1].amount.split(" ")[1].toLowerCase()
    const checkCode = transaction.checkCode
    const hiveAccFrom = transaction.op[1].from
    const trx_id = transaction.trx_id
    const timestampUnix = transaction.timestampUnix
    const strippedMemo = transaction.strippedMemo
    const currency =
      currencyToSend === "hbd"
        ? "hive_dollar"
        : currencyToSend === "hive"
        ? "hive"
        : ""
    const usd = amount * storeAPIStatus.prices[currency]?.usd

    // turn timestampUnix into a date object
    const paidDate = new Date(timestampUnix)

    const sale = {
      checkCode: checkCode,
      hiveAccTo: hiveAccTo,
      hiveAccFrom: hiveAccFrom,
      amount: amount,
      currencyToSend: currencyToSend,
      amountString: amountString,
      memo: strippedMemo,
      timestamp: paidDate,
      timestampUnix: timestampUnix,
      paidDate: paidDate,
      trx_id: trx_id,
      lightning: hiveAccFrom === "v4vapp",
      paid: true,
      usd: usd,
    }
    storeSales.updateSale(sale)
  })
  getAmounts()
}

const deleteLocalSales = () => {
  Dialog.create({
    // todo: replace these with i18n
    title: t("confirm"),
    message: t("delete_pending_message"),
    ok: {
      label: t("yes"),
      icon: "delete",
      color: "primary",
    },
    cancel: {
      label: t("no"),
      color: "negative",
    },
  }).onOk(() => {
    storeSales.clearSales()
  })
}

/**
 * Handles the click event on a row in the transactions list. Generates a new invoice
 * if necessary and shows the KeychainDialog.
 *
 * @param {Object} props - The properties of the row that was clicked.
 * @param {Object} props.row - The data of the row that was clicked.
 * @param {boolean} props.row.paid - Whether the transaction has been paid.
 * @param {string} props.row.hiveAccTo - The account to which the transaction is to be made.
 * @param {number} props.row.amount - The amount of the transaction.
 * @param {string} props.row.memo - The memo of the transaction.
 * @param {string} props.row.currencyToSend - The currency to be sent in the transaction.
 * @param {string} props.row.checkCode - The check code of the transaction.
 * @param {boolean} props.expand - Whether the row is expanded.
 *
 * If the transaction has been paid, it toggles the expansion of the row.
 * If the transaction has not been paid, it emits an 'update-fields' event with the transaction data,
 * waits for a bit, shows the KeychainDialog, and then removes the sale from the store.
 */
async function retryPending(props) {
  console.log("retryPending row", props.row)
  if (props.row.paid) {
    console.log("paid")
    props.expand = !props.expand
  } else {
    emit("update-fields", {
      hiveAccTo: props.row.hiveAccTo,
      amount: props.row.amount,
      memo: props.row.memo,
      currencyToSend: props.row.currencyToSend,
    })
    // wait a bit for the fields to update
    await new Promise((resolve) => setTimeout(resolve, 700))
    // After updating fields on the parent, show the dialog
    console.log("show dialog", KeychainDialog.value)
    try {
      // KeychainDialog.value.show = true
      // then delete the previous attempt at the transaction
      storeSales.removeSale(props.row.checkCode)
    } catch (e) {
      console.log("error showing dialog", e)
    }
  }
}

function deletePending(props) {
  console.log("deletePending row", props.row)
  storeSales.removeSale(props.row.checkCode)
}

/**
 * Updates transactions by fetching the latest transaction history for the Hive account,
 * filtering for POS transactions, and adding additional fields for each relevant transaction.
 *
 * 1. Retrieves transaction history for the given Hive account.
 * 2. Filters out transactions that don't match the POS criteria based on their memo.
 * 3. For each filtered transaction:
 *    - Converts its timestamp to Unix format.
 *    - Strips the memo and truncates it if its length is greater than 30 characters.
 *    - Extracts the check code from the memo.
 * 4. Assigns the filtered and modified transactions to KeychainDialog.value.transactions.
 *
 * @async
 * @function
 * @throws {Error} If there's an issue fetching the transaction history.
 * @returns {void}
 */
async function updateTransactions() {
  const trans = await useGetHiveTransactionHistory(
    KeychainDialog.value.hiveAccTo,
    200
  )

  if (trans) {
    // Filter out the transactions that are not from the POS
    let posTrans = trans.filter((transaction) => {
      const memo = transaction.op[1].memo
      return memo && memo.match(/v4v-\w+$/)
    })

    // If posTrans is empty, exit early
    if (posTrans.length === 0) {
      return
    }

    // Add extra fields to the transactions
    posTrans.forEach((transaction) => {
      const memo = transaction.op[1].memo

      // Convert timestamp to Unix
      const newDate = new Date(transaction.timestamp + "Z")
      transaction.timestampUnix = Math.floor(newDate.getTime())

      // Strip the memo and limit its length
      transaction.strippedMemo = memo.replace(/v4v-\w+$/, "")
      if (transaction.strippedMemo.length > 30) {
        transaction.strippedMemo =
          transaction.strippedMemo.substring(0, 30) + "..."
      }

      // Extract the checkCode
      transaction.checkCode = memo.match(/v4v-\w+$/)[0]
    })

    KeychainDialog.value.transactions = posTrans
  }
}

onMounted(() => {
  KeychainDialog.value.transactions = []
  updateTransactions()
  importFromHive()
})

/**
 * Computes a list of filtered transactions based on specific criteria.
 *
 * 1. Ensures the transactions are present and are an array.
 * 2. Processes each transaction to:
 *    - Convert its timestamp to a Unix format.
 * 3. Filters the transactions to:
 *    - Match a specific recipient (`KeychainDialog.value.hiveAccTo`).
 *    - Have a memo that matches a certain pattern (`/v4v-\w+$/`).
 *
 * @computed
 * @returns {Array} An array of filtered transactions that meet the criteria.
 * If no transactions exist or they don't match the criteria, an empty array is returned.
 */
const filteredDataHive = computed(() => {
  const transactions = KeychainDialog.value.transactions

  if (!Array.isArray(transactions)) return []

  // If the transactions exist and is an array, then process them
  transactions.forEach((transaction) => {
    const newDate = new Date(transaction.timestamp + "Z")
    transaction.timestampUnix = Math.floor(newDate.getTime())
  })

  return transactions.filter((transaction) => {
    const memo = transaction.op[1].memo
    const to = transaction.op[1].to
    return (
      to === KeychainDialog.value.hiveAccTo && memo && memo.match(/v4v-\w+$/)
    )
  })
})

function prettyDate(row) {
  const timeDiff = Date.now() - row.timestampUnix
  // check if timediff is less than one day
  if (timeDiff < 86400000) {
    return formatTimeDifference(timeDiff)
  }
  return formatDateTimeLocale(row.timestamp).date
}

function prettyTime(timestampUnix) {
  const timeDiff = Date.now() - timestampUnix
  return formatTimeDifference(timeDiff)
}
</script>

<style lang="scss" scoped>
.no-border {
  border-bottom: none;
}
.bordered-div {
  // border: 1px solid #eee; /* light gray */
}

.small-text {
  font-size: x-small;
}

.custom-link {
  color: var(--q-color-on-background); /* Default color for light mode */
}

.q-tr {
  border-bottom: 1px solid #eee;
}

.q-table--dense .q-table th,
.q-table--dense .q-table td {
  padding: 0px 2px !important;
}
</style>
