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
        <q-tr :props="props">
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
        <q-tr>
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

watch(
  () => KeychainDialog.value.hiveAccTo,
  async () => {
    await updateTransactions()
  }
)

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
    // Add extra fields to the transactions
    posTrans.forEach((transaction) => {
      const newDate = new Date(transaction.timestamp + "Z")
      transaction.timestampUnix = Math.floor(newDate.getTime())
    })
    posTrans.forEach((transaction) => {
      transaction.strippedMemo = transaction.op[1].memo.replace(/v4v-\w+$/, "")
    })
    posTrans.forEach((transaction) => {
      transaction.checkCode = transaction.op[1].memo.match(/v4v-\w+$/)[0]
    })
    KeychainDialog.value.transactions = posTrans
  }
}

onMounted(async () => {
  KeychainDialog.value.transactions = []
  await updateTransactions()
})

const filteredData = computed(() => {
  if (!KeychainDialog.value.transactions) return []

  KeychainDialog.value.transactions.forEach((transaction) => {
    const newDate = new Date(transaction.timestamp + "Z")
    transaction.timestampUnix = Math.floor(newDate.getTime())
  })
  return KeychainDialog.value.transactions.filter((transaction) => {
    const memo = transaction.op[1].memo
    return memo && memo.match(/v4v-\w+$/)
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
