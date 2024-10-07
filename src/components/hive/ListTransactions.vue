<template>
  <!-- List header and search filter -->
  <div
    class="list-trans-header q-pb-md full-width row items-center bordered-div"
  >
    <div class="col-grow bordered-div">
      <q-input dense v-model="searchFilter" clearable label="Search"></q-input>
    </div>
    <div class="q-pl-lg bordered-div">
      <q-btn-toggle
        v-model="paidFilter"
        dense
        :options="[
          { label: '', value: 'all', icon: 'fa-solid fa-dollar-sign' },
          { label: '', value: 'paid', icon: 'fa-solid fa-check' },
          { label: '', value: 'pending', icon: 'fa-solid fa-clock' },
        ]"
      >
        <q-tooltip>
          <q-icon name="fa-solid fa-dollar-sign" /> {{ $t("all") }}<br />
          <q-icon name="fa-solid fa-check" /> {{ $t("paid") }}<br />
          <q-icon name="fa-solid fa-clock" /> {{ $t("pending") }}<br />
        </q-tooltip>
      </q-btn-toggle>
    </div>
  </div>
  <!-- End of list header and search filter -->
  <!-- Main table -->
  <div class="list-trans-main-table full-width row items-center bordered-div">
    <div class="col-grow bordered-div">
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
                <q-btn
                  icon="delete"
                  dense
                  flat
                  @click="deleteLocalSalesConfirm(props.row)"
                >
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
                  <div class="q-pr-sm fixed-width-to-from-hive">
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
                <div
                  v-if="props.row.paid"
                  class="q-px-sm fixed-width-to-from-hive"
                >
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
  </div>
  <!-- End of main table -->
  <!-- Totals -->
  <div
    class="list-trans-totals full-width justify-center row items-center bordered-div"
  >
    <div class="q-px-sm q-py-md">
      <i class="fa-brands fa-hive" />&nbsp;{{ totalAmounts.hive }}
    </div>
    <div class="q-px-sm q-py-md">+</div>
    <div class="q-px-sm q-py-md">
      <hbd-logo-icon />&nbsp;{{ totalAmounts.hbd }}
    </div>
    <div class="q-px-sm q-py-md">=</div>
    <div class="q-px-sm q-py-md">USD ${{ totalAmounts.usd }}</div>
    <div class="q-px-sm q-py-md">
      {{ totalAmounts.localSymbol }}&nbsp;{{ totalAmounts.local }}
    </div>
  </div>
  <!-- End Totals -->
  <!-- Import buttons and delete buttons -->
  <div
    class="list-trans-buttons full-width justify-evenly row items-center bordered-div"
  >
    <div class="q-px-sm q-py-md">
      <q-btn
        dense
        rounded
        size="sm"
        icon="fa-brands fa-hive"
        @click="importFromHive"
      >
        <q-tooltip>{{ $t("import_from_hive_tooltip") }}</q-tooltip>
        <div class="q-px-xs">
          {{ $t("import_hive") }}
        </div>
      </q-btn>
    </div>
    <div class="q-px-sm q py-md">
      <q-btn
        dense
        rounded
        size="sm"
        icon="delete"
        @click="deleteLocalSalesConfirm"
      >
        <q-tooltip>{{ $t("delete_local_records_tooltip") }}</q-tooltip>
        <div class="q-px-xs">
          {{ $t("local_records") }}
        </div>
      </q-btn>
    </div>
    <div class="q-px-sm q py-md">
      <q-btn dense rounded size="sm" icon="archive" @click="exportToCsv">
        <q-tooltip>{{ $t("export_to_csv_tooltip") }}</q-tooltip>
        <div class="q-px-xs">
          {{ $t("export_to_csv") }}
        </div>
      </q-btn>
    </div>
  </div>
  <!-- End of import buttons and delete buttons -->

  <q-expansion-item
    class="q-mt-md debug-only"
    :label="`${KeychainDialog.transactions?.length || 0}`"
    icon="fa-solid fa-dollar-sign"
    :default-open="false"
  >
    {{ KeychainDialog.transactions }}
    >
  </q-expansion-item>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory, useGenerateTxUrl } from "src/use/useHive"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import {
  formatDateTimeLocale,
  formatTimeDifference,
  formatPrettyDate,
} from "src/use/useUtils"
import { useStoreSales } from "src/stores/storeSales"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreUser } from "src/stores/storeUser"
import { useCoingeckoStore } from "src/stores/storeCoingecko"
import { useI18n } from "vue-i18n"
import { Dialog, exportFile } from "quasar"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useIsEVMAddress, useShortEVMAddress } from "src/use/useEVM"
import { serverHiveAccountTreasury } from "src/boot/axios"

const t = useI18n().t
const storeAPIStatus = useStoreAPIStatus()
const storeUser = useStoreUser()
const storeCoingecko = useCoingeckoStore()

const maxNumTransactions = 40 // max number of transactions to show in the table

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
    calcTotalAmounts()
  }
)

watch([() => storeUser.localCurrency, () => storeUser.pos.fixedRate], () => {
  calcTotalAmounts()
})

watch(
  () => KeychainDialog.value.checkCode,
  () => {
    updateTransactions()
  }
)

async function calcTotalAmounts() {
  calcLocalTotal()
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
      calcTotalAmounts()
    }, 1000)
    return
  }
  amounts.usd = amounts.hive * storeAPIStatus.prices?.hive?.usd
  amounts.usd += amounts.hbd * storeAPIStatus.prices?.hive_dollar?.usd
  totalAmounts.value.usd = amounts.usd.toFixed(2)
}

async function calcLocalTotal() {
  const localRates = await storeCoingecko.getCoingeckoRate(
    storeUser.localCurrency.value
  )
  var adustRate = 1
  if (storeUser.pos.fixedRate) {
    adustRate =
      storeUser.pos.fixedRate /
      localRates.hive_dollar[storeUser.localCurrency.value]
  }

  const convertLocal = (amount, currency) => {
    return (
      amount * localRates[currency][storeUser.localCurrency.value] * adustRate
    )
  }

  totalAmounts.value.local = convertLocal(
    totalAmounts.value.usd,
    "usd"
  ).toFixed(2)

  totalAmounts.value.localSymbol = storeUser.localCurrency.unit
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
  async () => {
    // pause for 0.5 seconds to allow the transactions to update
    await new Promise((resolve) => setTimeout(resolve, 500))
    await storeSales.clearSales()
    await importFromHive()
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
 * Imports transactions from Hive.
 *
 * 1. Gets the length of the transactions before importing.
 * 2. Calls `updateTransactions` to update the transactions.
 * 3. For each transaction, it:
 *    - Adds it to the local sales store.
 *    - Gets the amount in USD.
 * 4. Gets the length of the transactions after importing.
 * 5. Calculates the number of new transactions.
 */
async function importFromHive() {
  const lengthBefore = filteredDataHive.value.length
  await updateTransactions()
  // for all the records in transactions add them to the local sales store
  filteredDataHive.value.forEach((transaction) => {
    let hiveAccTo = transaction.op[1].to
    if (hiveAccTo === serverHiveAccountTreasury) {
      hiveAccTo = useShortEVMAddress(KeychainDialog.value.hiveAccTo)
    }
    let amountString = transaction.op[1].amount
    let amount = transaction.op[1].amount.split(" ")[0]
    const currencyToSend = transaction.op[1].amount.split(" ")[1].toLowerCase()
    const checkCode = transaction.checkCode
    const hiveAccFrom = transaction.op[1].from
    const trx_id = transaction.trx_id
    const timestampUnix = transaction.timestampUnix
    let strippedMemo = transaction.strippedMemo
    let currency =
      currencyToSend === "hbd"
        ? "hive_dollar"
        : currencyToSend === "hive"
        ? "hive"
        : ""
    const { sats, extractedMemo } = extractEvmInformation(
      transaction.op[1].memo
    )
    let usd = amount * storeAPIStatus.prices[currency]?.usd
    console.debug("currency", currency, amount)
    if (amount === "0.001" && sats > 0) {
      console.debug("amount is 0.001")
      currency = "sats"
      usd = sats / storeAPIStatus.prices["v4vapp"]["sats_USD"]
      amountString = sats + " sats"
      strippedMemo = extractedMemo
    }

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
  calcTotalAmounts()
  const lengthAfter = filteredDataHive.value.length
  const newTransactions = lengthAfter - lengthBefore
}

function extractEvmInformation(memo) {
  console.debug("extractEvmInformation", memo)
  const parsedMemo = memo.split("|")
  console.debug("parsedMemo", parsedMemo)
  let extractedMemo = ""
  let sats = 0
  if (parsedMemo.length > 2 && parsedMemo[1].includes("#sats")) {
    sats = parsedMemo[1].split("#sats")[1]
    console.debug("sats", sats)
    if (parsedMemo[0].includes("evm:")) {
      extractedMemo = memo.replace(/^evm: 0x[^\s]+\s/, "")
    }
    return { sats, extractedMemo }
  }
  return { sats, extractedMemo }
}

const deleteLocalSalesConfirm = (row) => {
  let message = ""
  if (row?.checkCode) {
    message =
      t("delete_one_pending_message") +
      "<br>" +
      row.checkCode +
      "<br>" +
      row.amountString +
      "<br>" +
      sanitizeHTML(row.memo)
  } else {
    message = t("delete_all_pending_message")
  }
  Dialog.create({
    message: message,
    html: true,
    title: t("confirm"),
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
    if (row?.checkCode) {
      storeSales.removeSale(row.checkCode)
    } else {
      storeSales.clearSales()
      importFromHive()
    }
  })
}

function sanitizeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
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
  if (props.row.paid) {
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
    try {
      // KeychainDialog.value.show = true
      // then delete the previous attempt at the transaction
      storeSales.removeSale(props.row.checkCode)
    } catch (e) {
      console.error("error showing dialog", e)
    }
  }
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
  let checkHiveAccount = KeychainDialog.value.hiveAccTo
  let evmFilter = false
  if (useIsEVMAddress(KeychainDialog.value.hiveAccTo)) {
    checkHiveAccount = serverHiveAccountTreasury
    evmFilter = true
  }

  const trans = await useGetHiveTransactionHistory(checkHiveAccount, 200)

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
    posTrans = posTrans.slice(0, maxNumTransactions)

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
    KeychainDialog.value.transactions = posTrans.reverse()
  }
}

/**
 * Runs when the component is mounted.
 *
 * 1. Clears the transactions.
 * 2. Calls `updateTransactions` to update the transactions.
 */
onMounted(async () => {
  // KeychainDialog.value.transactions = []
  // updateTransactions()
  await importFromHive()
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
  let checkHiveAccount = KeychainDialog.value.hiveAccTo
  let evmFilter = false
  if (useIsEVMAddress(KeychainDialog.value.hiveAccTo)) {
    checkHiveAccount = serverHiveAccountTreasury
    evmFilter = true
  }
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
    // EVM transactions have the v4v- in the memo and at the end of the memo.
    if (evmFilter) {
      return (
        to === checkHiveAccount &&
        memo &&
        memo.match(/v4v-\w+/) &&
        memo.includes(KeychainDialog.value.hiveAccTo)
      )
    } else {
      return to === checkHiveAccount && memo && memo.match(/v4v-\w+$/)
    }
  })
})

function prettyDate(row) {
  return formatPrettyDate(row.timestampUnix)
}

function prettyTime(timestampUnix) {
  const timeDiff = Date.now() - timestampUnix
  return formatTimeDifference(timeDiff)
}

function wrapCsvValue(val, formatFn, row) {
  let formatted = formatFn !== void 0 ? formatFn(val, row) : val

  formatted =
    formatted === void 0 || formatted === null ? "" : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`
}

/**
 * Exports the transactions to a CSV file.
 *
 * 1. Creates an array of column names.
 * 2. Creates an array of rows.
 * 3. Encodes the column names and rows to CSV format.
 * 4. Exports the CSV file.
 *
 * @function
 * @returns {void}
 */
function exportToCsv() {
  // naive encoding to csv format

  const columns = [
    { name: "amount", label: "amount" },
    { name: "amountPaid", label: "amountPaid" },
    { name: "amountString", label: "amountString" },
    { name: "checkCode", label: "checkCode" },
    { name: "currencyToSend", label: "currencyToSend" },
    { name: "hiveAccFrom", label: "hiveAccFrom" },
    { name: "hiveAccTo", label: "hiveAccTo" },
    { name: "memo", label: "memo" },
    { name: "paid", label: "paid" },
    { name: "paidDate", label: "paidDate" },
    { name: "timestamp", label: "timestamp" },
    { name: "timestampUnix", label: "timestampUnix" },
    { name: "trx_id", label: "trx_id" },
    { name: "usd", label: "usd" },
  ]

  const rows = filteredDataLocal.value
  // naive encoding to csv format
  const content = [columns.map((col) => wrapCsvValue(col.label))]
    .concat(
      rows.map((row) =>
        columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === "function"
                ? col.field(row)
                : row[col.field === void 0 ? col.name : col.field],
              col.format,
              row
            )
          )
          .join(",")
      )
    )
    .join("\r\n")

  const status = exportFile("table-export.csv", content, "text/csv")

  if (status !== true) {
    $q.notify({
      message: "Browser denied file download...",
      color: "negative",
      icon: "warning",
    })
  }
}
</script>

<style lang="scss" scoped>
.no-border {
  border-bottom: none;
}
.bordered-div {
  // border: 1px solid #eee; /* light gray */
}

.fixed-width-to-from-hive {
  width: 13ch;
}

.small-text {
  font-size: x-small;
}

.custom-link {
  color: var(--q-color-on-background); /* Default color for light mode */
}

.q-table--dense .q-table th,
.q-table--dense .q-table td {
  padding: 0px 2px !important;
}
</style>
