<template>
  <div class="q-pa-none">
    <q-input class="q-pa-none" v-model="searchFilter" label="Search"></q-input>
  </div>
  <div class="q-pa-none">
    <q-table
      :rows="filteredDataLocal"
      dense
      v-model:expanded="rowsExpanded"
      row-key="checkCode"
      :columns="localSalesColumns"
      :visible-columns="['date', 'amountstring', 'status', 'expand']"
      separator="none"
      :pagination="{
        rowsPerPage: 5,
        display: true,
        sortBy: 'props.timestamp',
      }"
    >
      <template v-slot:top> </template>
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
        <q-th :props="props" style="text-align: center">
          <q-td :props="props" key="expand">
            <q-btn
              round
              flat
              dense
              :icon="rowsExpanded.length === 0 ? 'expand_more' : 'expand_less'"
              @click="expandAll"
            ></q-btn>
          </q-td>
        </q-th>
      </template>
      <template #body="props">
        <!-- Main table  -->
        <q-tr :props="props">
          <q-td :props="props" key="date">
            {{ formatDateTimeLocale(props.row.timestamp).date }}
          </q-td>
          <q-td k:props="props" key="amountstring" dense>
            {{ props.row.amountString }}
          </q-td>
          <q-td :props="props" key="status" @click="handleRowClick(props)">
            <q-chip
              dense
              :color="props.row.paid ? 'green' : 'yellow-10'"
              :icon="
                props.row.lightning
                  ? 'fa-sharp fa-solid fa-bolt'
                  : 'fa-brands fa-hive'
              "
            >
              {{ props.row.paid ? $t("paid") : $t("pending") }}
            </q-chip>
          </q-td>
          <q-td :props="props" key="expand">
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
            <div
              class="fit row justify-start items-start content-start bordered-div"
            >
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
  <div v-if="false">
    <q-table :rows="storeSales.salesAll" dense row-key="checkCode">
      <q-tr :props="props" @click="handleRowClick(props.row)"> </q-tr>
    </q-table>
  </div>
  <!-- Data from Hive only -->
  <div v-if="false">
    <q-table
      :rows="filteredDataHive"
      :columns="myColumns"
      dense
      row-key="trx_id"
      :visible-columns="['age', 'from', 'amount']"
    >
      <template #body="props">
        <q-tr :props="props" @click="handleRowClick(props.row)">
          <q-td class="no-border">
            {{ prettyTime(props.row.timestampUnix) }}
          </q-td>
          <q-td class="no-border text-left">
            {{ props.row.op[1].from }}
          </q-td>
          <q-td class="no-border text-right">
            {{ props.row.op[1].amount }}
          </q-td>
        </q-tr>
        <q-tr :props="props" @click="handleRowClick(props.row)">
          <q-td>
            {{ formatDateTimeLocale(props.row.timestampUnix).date }}
          </q-td>
          <q-td colspan="2" class="text-left">
            {{ props.row.strippedMemo }}
            <span class="text-right" style="font-size: x-small">{{
              props.row.checkCode
            }}</span>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
  <div class="q-pt-sm">
    <div
      class="q-pb-sm fit row no-wrap justify-center items-end content-center"
    >
      <div>
        <q-btn
          dense
          flat
          icon="fa-brands fa-hive"
          @click="importFromHive"
          class="q-mr-sm"
        >
          <q-tooltip>{{ $t("import_from_hive_tooltip") }}</q-tooltip>
          {{ $t("import_hive") }}</q-btn
        >
      </div>
      <div>
        <q-btn
          dense
          flat
          icon="delete"
          @click="deleteLocalSales"
          class="q-mr-sm"
        >
          <q-tooltip>{{ $t("delete_local_records_tooltip") }}</q-tooltip>
          {{ $t("local_records") }}</q-btn
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory, useGenerateTxUrl } from "src/use/useHive"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { formatDateTimeLocale, formatTimeDifference } from "src/use/useUtils"
import { useStoreSales } from "src/stores/storeSales"
import { useI18n } from "vue-i18n"
import { Dialog } from "quasar"
const t = useI18n().t

const storeSales = useStoreSales()
const KeychainDialog = defineModel()
const searchFilter = ref()
const emit = defineEmits(["update-fields"])

const rowsExpanded = ref([])
const localSalesColumns = ref([
  {
    name: "date",
    label: t("date"),
    field: (row) => row.timestampUnix,
    sortable: true,
    align: "left",
    sortBy: (row) => row.timestampUnix,
    sortMethod: (a, b) => parseInt(a) - parseInt(b), // Assuming timestampUnix is a string of a number
  },
  {
    name: "amountstring",
    label: t("amount"),
    field: (row) => row.amountString,
    align: "right",
  },
  {
    name: "status",
    label: t("status"),
    sortable: true,
    align: "right",
    field: (row) => row.paid,
  },
  {
    name: "expand",
    field: "expand",
    align: "center",
  },
])

const filteredDataLocal = computed(() => {
  const localData = storeSales.salesAll
  if (!searchFilter.value) return localData
  return localData.filter((row) => {
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
})

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
  console.log("importFromHive running for ", KeychainDialog.value.hiveAccTo)
  await updateTransactions()
  // for all the records in transactions add them to the local sales store
  filteredDataHive.value.reverse().forEach((transaction) => {
    const memo = transaction.op[1].memo
    const hiveAccTo = transaction.op[1].to
    const amount = transaction.op[1].amount
    const checkCode = transaction.checkCode
    const hiveAccFrom = transaction.op[1].from
    const amountString = amount
    const currencyToSend = transaction.op[1].amount.split(" ")[1].toLowerCase()
    const trx_id = transaction.trx_id
    const timestampUnix = transaction.timestampUnix
    const strippedMemo = transaction.strippedMemo
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
    }
    storeSales.updateSale(sale)
  })
}

const deleteLocalSales = () => {
  Dialog.create({
    // todo: replace these with i18n
    title: "Confirm",
    message: "Are you sure you want to delete all pending sales?",
    ok: {
      label: "Yes",
      icon: "delete",
      color: "primary",
    },
    cancel: {
      label: "No",
      color: "negative",
    },
  }).onOk(() => {
    storeSales.clearSales()
  })
}

/**
 * Handles the click event on a row in the transactions list.
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
async function handleRowClick(props) {
  console.log("row", props.row)
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
    await new Promise((resolve) => setTimeout(resolve, 300))
    // After updating fields on the parent, show the dialog
    KeychainDialog.value.show = true
    // then delete the previous attempt at the transaction
    storeSales.removeSale(props.row.checkCode)
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
  console.log("mounted ListTransactions.vue")
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

function prettyTime(timestampUnix) {
  const timeDiff = Date.now() - timestampUnix
  return formatTimeDifference(timeDiff)
}

// useDateFormat(row.timestampUnix, "HH:mm DD-MM-YYYY"),
const myColumns = ref([
  {
    name: "age",
    label: "Age",
    field: (row) => prettyTime(row.timestampUnix),
    align: "center",
  },
  {
    name: "time",
    label: "Time",
    field: (row) => formatDateTimeLocale(row.timestamp).time,
  },
  {
    name: "from",
    label: t("from"),
    field: (row) => row.op[1].from,
    align: "left",
    sortable: true,
  },
  {
    name: "amount",
    label: t("amount"),
    field: (row) => row.op[1].amount,
  },
  {
    name: "memo",
    label: t("memo"),
    field: (row) => row.op[1].memo,
  },
  {
    name: "strippedMemo",
    label: t("memo"),
    field: (row) => row.op[1].memo.replace(/v4v-\w+$/, ""),
  },
  {
    name: "checkCode",
    label: "checkCode",
    field: (row) => row.op[1].memo.match(/v4v-\w+$/),
  },
  {
    name: "trx_id",
    label: "trx_id",
    field: (row) => row.trx_id,
  },
])
</script>

<style lang="scss" scoped>
.no-border {
  border-bottom: none;
}
.bordered-div {
  border: 1px solid #eee; /* light gray */
}

.small-text {
  font-size: x-small;
}

.custom-link {
  color: var(--q-color-on-background); /* Default color for light mode */
}
</style>
