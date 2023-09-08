<template>
  <div class="q-pa-md">
    <q-table
      :rows="filteredData"
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
          <q-td class="no-border">
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
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory } from "src/use/useHive"
import { formatDateTimeLocale, formatTimeDifference } from "src/use/useUtils"
import { useI18n } from "vue-i18n"
const t = useI18n().t

const KeychainDialog = defineModel(null)
const selectedTransaction = ref(null)
const showDetails = ref(false)

watch(
  () => KeychainDialog.value.hiveAccTo,
  async (val) => {
    KeychainDialog.value.transactions = val
    await updateTransactions()
  }
)

watch(
  () => KeychainDialog.value.paid,
  async (val) => {
    KeychainDialog.value.paid = val
    await updateTransactions()
  }
)

function handleRowClick(row) {
  console.log("row", row)
  selectedTransaction.value = row
  showDetails.value = true
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
    20
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
const filteredData = computed(() => {
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
</style>
