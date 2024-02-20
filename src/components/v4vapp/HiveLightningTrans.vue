<template>
  <div class="refresh-days-button-select row justify-evenly q-py-sm">
    <div class="refresh-button">
      <q-btn
        label="Refresh"
        rounded
        @click="fetchData(dataDays)"
        :disable="data.length === 0"
      ></q-btn>
    </div>
    <div class="days-select">
      <q-select
        v-model="dataDays"
        :options="[
          { label: '3 days', value: 3 },
          { label: '7 days', value: 7 },
          { label: '30 days', value: 30 },
          { label: '90 days', value: 90 },
          { label: '365 days', value: 365 },
        ]"
        label="Days"
        dense
        @update:model-value="fetchData($event)"
      ></q-select>
    </div>
  </div>
  <div class="hivetosats-table q-pa-sm">
    <q-table
      class="q-pa-xs"
      dense
      :rows="data"
      row-key="trx_id"
      :columns="columns"
      :visible-columns="['net_hive', 'sats', 'timestamp', 'link', 'reason']"
    >
      <template v-slot:body-cell-link="props">
        <q-td :props="props">
          <a
            :href="useGenerateTxUrl(props.row.answer_trx_id)"
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
        </q-td>
      </template>
      <template v-slot:bottom-row v-if="data.length > 0">
        <q-tr class="text-bold">
          <q-td>Total</q-td>
          <q-td class="text-right">
            {{ tidyNumber(totals.totalHive, 3) }}
          </q-td>
          <q-td class="text-right">
            {{ tidyNumber(totals.totalSats, 0) }}
          </q-td>
          <q-td colspan="1"></q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
  <div class="keepsats-table q-pa-sm">
    <q-table
      class="q-pa-xs"
      dense
      :rows="keepSatsData"
      :columns="keepSatsColumns"
      row-key="unique_id"
      :visible-columns="['timestamp', 'sats', 'reason']"
    >
      <template v-slot:bottom-row v-if="data.length > 0">
        <q-tr class="text-bold">
          <q-td>Total</q-td>
          <q-td class="text-right">
            {{ tidyNumber(keepSatsTotal, 0) }}
          </q-td>
          <q-td colspan="1"></q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useStoreUser } from "src/stores/storeUser"
import { useFetchSatsHistory, useKeepSats } from "src/use/useV4vapp"
import { useGenerateTxUrl } from "src/use/useHive"

import { formatPrettyDate, tidyNumber } from "src/use/useUtils"

const storeUser = useStoreUser()
const data = ref([])
const dataDays = ref({ label: "7 days", value: 7 })
const totals = ref({ totalHive: 0, totalSats: 0 })

const t = useI18n().t

const columns = computed(() => {
  return [
    {
      name: "timestamp",
      required: true,
      sortable: true,
      label: t("date"),
      align: "left",
      field: "timestamp",
      format: (val) => formatPrettyDate(val),
    },
    {
      name: "net_hive",
      required: true,
      sortable: true,
      label: t("hive"),
      align: "right",
      field: "net_hive",
      format: (val) => tidyNumber(val, 3),
    },
    {
      name: "sats",
      required: true,
      sortable: true,
      label: "Sats シ",
      align: "right",
      field: "sats",
      format: (val) => tidyNumber(val, 0),
    },
    {
      name: "link",
      required: true,
      align: "center",
      field: "trx_id",
      format: (val) => val,
    },
    {
      name: "reason",
      required: true,
      label: t("reason"),
      align: "left",
      field: "reason",
      format: (val) => val,
    },
  ]
})

const keepSatsData = ref([])
const keepSatsTotal = ref(0)
const keepSatsColumns = computed(() => {
  return [
    {
      name: "timestamp",
      required: true,
      sortable: true,
      label: t("date"),
      align: "left",
      field: "timestamp",
      format: (val) => formatPrettyDate(val),
    },
    {
      name: "sats",
      required: true,
      sortable: true,
      label: "Sats シ",
      align: "right",
      field: "sats",
      format: (val) => tidyNumber(val, 0),
    },
    {
      name: "reason",
      required: true,
      label: t("reason"),
      align: "left",
      field: "reason",
      format: (val) => val,
    },
  ]
})

watch(
  () => storeUser.currentUser,
  async (newVal) => {
    console.log("HiveLightningTrans.vue watch", newVal)
    fetchData()
    // data.value = rawData
  }
)

async function fetchData(newValue = dataDays.value) {
  if (!storeUser.hiveAccname) {
    return
  }
  console.log("HiveLightningTrans.vue fetchData", newValue)
  const [satsHistory, keepSats] = await Promise.all([
    useFetchSatsHistory(storeUser.hiveAccname, newValue.value),
    useKeepSats(),
  ])

  if (keepSats.all_transactions) {
    console.log(keepSats)
    const oldTimestamp = new Date() - 1000 * 60 * 60 * 24 * dataDays.value.value
    console.log(oldTimestamp)
    keepSatsData.value = keepSats.all_transactions.filter(
      (trx) => trx.reason !== "Fees" && trx.timestamp > oldTimestamp
    )

    const tempTotal = keepSats.all_transactions.filter(
      (trx) => trx.timestamp > oldTimestamp
    )
    keepSatsTotal.value = 0
    for (let i = 0; i < tempTotal.length; i++) {
      keepSatsTotal.value += tempTotal[i].msats
    }

    keepSatsTotal.value = keepSatsTotal.value / 1000
  }

  data.value = satsHistory

  // calculate totals for hive and sats
  if (data.value) {
    totals.value.totalHive = 0
    totals.value.totalSats = 0
    for (let i = 0; i < data.value.length; i++) {
      totals.value.totalHive += data.value[i].net_hive
      totals.value.totalSats += data.value[i].sats
    }
  }
}

onMounted(() => {
  console.log("HiveLightningTrans.vue onMounted")
  fetchData()
})
</script>

<style lang="scss" scoped></style>
