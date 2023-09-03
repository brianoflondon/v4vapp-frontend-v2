<template>
  <div class="q-pa-md">
    <q-table
      :title="hiveAccname.value"
      :rows="filteredData"
      :columns="myColumns"
      row-key="trx_id"
    />
    <pre>
        {{ transactions }}
    </pre>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, computed, watch } from "vue"
import { useGetHiveTransactionHistory } from "src/use/useHive"
import { useI18n } from "vue-i18n"
const t = useI18n().t

const props = defineProps({
  hiveAccname: {
    type: String,
    default: "",
  },
})

const transactions = ref([])

const filteredData = computed(() => {
  transactions.value.forEach((transaction) => {
    transaction[1].timestampUnix = Math.floor(
      new Date(transaction[1].timestamp)
    )
  })
  console.log("filteredData", transactions.value)
  return transactions.value.filter((transaction) => {
    const memo = transaction[1].op[1].memo
    return memo && memo.match(/v4v-\w+$/)
  })
})

watch(
  () => props.hiveAccname,
  async (newVal, oldVal) => {
    console.log("props.hiveAccname", newVal)
    transactions.value = await useGetHiveTransactionHistory(newVal, 25)
  }
)

// useDateFormat(row[1].timestampUnix, "HH:mm DD-MM-YYYY"),
const myColumns = ref([
  {
    name: "date",
    label: "Date",
    field: (row) => formatDateTimeLocale(row[1].timestamp).date,
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
    label: "amount",
    field: (row) => row[1].op[1].amount,
  },
  {
    name: "memo",
    label: "memo",
    field: (row) => row[1].op[1].memo,
  },
  {
    name: "trx_id",
    label: "trx_id",
    field: (row) => row[1].trx_id,
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
