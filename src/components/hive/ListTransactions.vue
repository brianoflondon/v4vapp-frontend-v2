<template>
  <div class="q-pa-md">
    <q-table
      :title="t('list_received_payments')"
      :rows="filteredData"
      :columns="myColumns"
      row-key="trx_id"
      :visible-columns="['time', 'from', 'amount', 'strippedMemo']"
    />
    <pre>
        {{ KeychainDialog.transactions }}
    </pre>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory } from "src/use/useHive"
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
  KeychainDialog.value.transactions = await useGetHiveTransactionHistory(
    KeychainDialog.value.hiveAccTo,
    20
  )
}

onMounted(async () => {
  KeychainDialog.value.transactions = []
  console.log("KeychainDialog.value.hiveAccTo", KeychainDialog.value.hiveAccTo)
  console.log(
    "KeychainDialog.value.transactions",
    KeychainDialog.value.transactions
  )
  await updateTransactions()
  console.log(
    "KeychainDialog.value.transactions",
    KeychainDialog.value.transactions
  )
})

const filteredData = computed(() => {
  if (!KeychainDialog.value.transactions) return []
  KeychainDialog.value.transactions.forEach((transaction) => {
    transaction[1].timestampUnix = Math.floor(
      new Date(transaction[1].timestamp)
    )
  })
  return KeychainDialog.value.transactions.filter((transaction) => {
    const memo = transaction[1].op[1].memo
    return memo && memo.match(/v4v-\w+$/)
  })
})

// useDateFormat(row[1].timestampUnix, "HH:mm DD-MM-YYYY"),
const myColumns = ref([
  {
    name: "date",
    label: t("date"),
    field: (row) => formatDateTimeLocale(row[1].timestamp).date,
    align: "left",
    headerClasses: "bg-grey-7 text-grey-2",
  },
  {
    name: "time",
    label: "Time",
    field: (row) => formatDateTimeLocale(row[1].timestamp).time,
  },
  {
    name: "from",
    label: t("from"),
    field: (row) => row[1].op[1].from,
    align: "left",
  },
  {
    name: "amount",
    label: t("amount"),
    field: (row) => row[1].op[1].amount,
  },
  {
    name: "memo",
    label: t("memo"),
    field: (row) => row[1].op[1].memo,
  },
  {
    name: "strippedMemo",
    label: t("memo"),
    field: (row) => row[1].op[1].memo.replace(/v4v-\w+$/, ""),
  },
  {
    name: "checkCode",
    label: "checkCode",
    field: (row) => row[1].op[1].memo.match(/v4v-\w+$/),
  },
  {
    name: "trx_id",
    label: "trx_id",
    field: (row) => row[1].trx_id,
  },
  {
    name: "timestampUnix",
    label: "Timestamp Unix",
    field: (row) => row[1].timestampUnix,
    sortable: true,
  },
])

function formatDateTime(isoString) {
  const date = new Date(isoString)

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0") // Months are 0-indexed

  const timeFormat = `${hours}:${minutes}:${seconds}`
  const dateFormat = `${day}/${month}`

  return {
    time: timeFormat,
    date: dateFormat,
  }
}

function formatDateTimeLocale(isoString) {
  const { locale } = useI18n({ useScope: "global" })
  console.log(locale.value)
  const date = new Date(isoString)

  const timeFormat = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateFormat = date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
  })

  return {
    time: timeFormat,
    date: dateFormat,
  }
}

const columns = ref([
  {
    name: "name",
    required: true,
    label: "Dessert (100g serving)",
    align: "left",
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "calories",
    align: "center",
    label: "Calories",
    field: "calories",
    sortable: true,
  },
  { name: "fat", label: "Fat (g)", field: "fat", sortable: true },
  { name: "carbs", label: "Carbs (g)", field: "carbs" },
  { name: "protein", label: "Protein (g)", field: "protein" },
  { name: "sodium", label: "Sodium (mg)", field: "sodium" },
  {
    name: "calcium",
    label: "Calcium (%)",
    field: "calcium",
    sortable: true,
    sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
  },
  {
    name: "iron",
    label: "Iron (%)",
    field: "iron",
    sortable: true,
    sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
  },
])
</script>
