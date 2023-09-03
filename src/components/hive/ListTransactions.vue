<template>
  <div class="q-pa-md">
    <q-table
      :rows="filteredData"
      :columns="myColumns"
      row-key="trx_id"
      :visible-columns="[
        'prettyTime',
        'timestampUnix',
        'localtime',
        'timestamp',
        'date',
        'from',
        'amount',
        'strippedMemo',
      ]"
    />
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
  KeychainDialog.value.transactions = await useGetHiveTransactionHistory(
    KeychainDialog.value.hiveAccTo,
    20
  )
}

onMounted(async () => {
  KeychainDialog.value.transactions = []
  await updateTransactions()
})

const filteredData = computed(() => {
  if (!KeychainDialog.value.transactions) return []

  KeychainDialog.value.transactions.forEach((transaction) => {
    const newDate = new Date(transaction[1].timestamp + "Z")
    console.log("newDate", newDate)
    transaction[1].timestampUnix = Math.floor(newDate.getTime())
    transaction[1].timeSinceTransaction = formatTimeDifference(
      Date.now() - transaction[1].timestampUnix
    )
  })
  return KeychainDialog.value.transactions.filter((transaction) => {
    const memo = transaction[1].op[1].memo
    return memo && memo.match(/v4v-\w+$/)
  })
})

function prettyTime(unixTimestamp) {
  const timeDiff = Date.now() - unixTimestamp
  console.log("timeDiff", timeDiff)
  return formatTimeDifference(timeDiff)
}

// useDateFormat(row[1].timestampUnix, "HH:mm DD-MM-YYYY"),
const myColumns = ref([
  {
    name: "prettyTime",
    label: "Time",
    field: (row) => prettyTime(row[1].timestampUnix),
    align: "center",
    sortable: true,
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
    sortable: true,
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
])

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
