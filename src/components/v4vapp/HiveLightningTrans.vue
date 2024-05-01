<template>
  <!-- Refresh button and days select  -->
  <div class="row wrap justify-center">
    <div class="col-auto">
      <div class="refresh-days-button-select row justify-evenly q-py-sm">
        <div class="refresh-button q-px-sm">
          <q-btn
            label="Refresh"
            rounded
            @click="fetchData(dataDays)"
          ></q-btn>
        </div>
        <div class="days-select q-px-sm">
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
      <!--End  Refresh button and days select  -->
      <div class="transaction-data-tables row">
        <!-- Hive to Sats Table -->
        <div class="hivetosats-table q-pa-sm">
          Hive  Sats
          <q-table
            class="q-pa-xs"
            dense
            :rows="data"
            row-key="trx_id"
            :columns="columns"
            :visible-columns="[
              'net_hive',
              'sats',
              'timestamp',
              'link',
              'reason',
            ]"
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
                <q-td colspan="2" class="text-left">Total</q-td>
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
        <!-- End Hive to Sats Table -->
      </div>
    </div>
    <div class="col-auto">
      <!-- Keep Sats Table -->
      <div class="keepsats-table q-pa-sm">
        KeepSats
        <q-table
          class="q-pa-xs"
          dense
          :rows="keepSatsData"
          :columns="keepSatsColumns"
          v-model:expanded="rowsExpanded"
          row-key="group_id"
          :visible-columns="['timestamp', 'sats', 'hive', 'reason', 'expand']"
        >
          <!-- Expansion icon header of the table -->
          <template v-slot:header-cell-expand="props">
            <q-th :props="props" style="text-align: right">
              <q-btn
                round
                flat
                dense
                :icon="
                  rowsExpanded.length === 0 ? 'expand_more' : 'expand_less'
                "
                @click="expandAll"
              ></q-btn>
            </q-th>
          </template>
          <!-- End Expansion icon header of the table -->

          <template #body="props">
            <q-tr :props="props">
              <q-td :props="props" style="text-align: left" key="timestamp">
                {{ formatPrettyDate(props.row.timestamp) }}
              </q-td>
              <q-td :props="props" style="text-align: left" key="reason">
                {{ props.row.reason_str }}
              </q-td>
              <q-td :props="props" style="text-align: right" key="hive">
                {{ tidyNumber(props.row.hive, 3) }}
              </q-td>
              <q-td :props="props" style="text-align: right" key="sats">
                {{ tidyNumber(props.row.sats, 0) }}
              </q-td>
              <q-td :props="props" key="expand" style="text-align: right">
                <q-btn
                  round
                  size="sm"
                  flat
                  dense
                  :icon="props.expand ? 'expand_less' : 'expand_more'"
                  @click="props.expand = !props.expand"
                ></q-btn>
              </q-td>
            </q-tr>
            <!-- Expansion Item -->
            <q-tr v-if="props.expand">
              <q-td :colspan="5">
                <KeepSatsDetail :tableData="props.row.details" />
              </q-td>
            </q-tr>
            <!-- End Expansion Item -->
          </template>

          <!-- Show total for this age range at the bottom -->
          <template v-slot:bottom-row v-if="data.length > 0">
            <q-tr class="text-bold">
              <q-td class="text-left" colspan="2">Total</q-td>
              <q-td class="text-right">
                {{ tidyNumber(keepHiveTotal, 3) }}
              </q-td>
              <q-td class="text-right">
                {{ tidyNumber(keepSatsTotal, 0) }}
              </q-td>
              <q-td colspan="1"></q-td>
            </q-tr>
          </template>
          <!-- End Show total for this age range at the bottom -->
        </q-table>
      </div>
      <!-- End Keep Sats Table -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useStoreUser } from "src/stores/storeUser"
import { useFetchSatsHistory, useKeepSats } from "src/use/useV4vapp"
import { useGenerateTxUrl } from "src/use/useHive"
import KeepSatsDetail from "src/components/v4vapp/KeepSatsDetail.vue"
import { formatPrettyDate, tidyNumber } from "src/use/useUtils"

const storeUser = useStoreUser()
const data = ref([])
const dataDays = ref({ label: "7 days", value: 7 })
const totals = ref({ totalHive: 0, totalSats: 0 })

const t = useI18n().t

const rowsExpanded = ref([])

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
      name: "reason",
      required: true,
      label: t("reason"),
      align: "left",
      field: "reason",
      format: (val) => val,
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
  ]
})

const keepSatsData = ref([])
const keepSatsTotal = ref(0)
const keepHiveTotal = ref(0)
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
      name: "reason",
      required: true,
      label: t("reason"),
      align: "left",
      field: "reason",
      format: (val) => val,
    },
    {
      name: "hive",
      required: true,
      sortable: true,
      label: "Hive",
      align: "right",
      field: "hive",
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
      name: "expand",
      field: "expand",
    },
  ]
})

watch(
  () => storeUser.currentUser,
  async (newVal) => {
    if (newVal) {
      await fetchData()
    }
    if (newVal === null || newVal === undefined) {
      data.value = []
      keepSatsData.value = []
    }
    return
  }
)

async function fetchData(newValue = dataDays.value) {
  if (!storeUser.hiveAccname) {
    data.value = []
    keepSatsData.value = []
    return
  }
  const [satsHistory, keepSats] = await Promise.all([
    useFetchSatsHistory(storeUser.hiveAccname, newValue.value),
    useKeepSats(false, true),
  ])

  if (keepSats.summary_transactions) {
    const oldTimestamp = new Date() - 1000 * 60 * 60 * 24 * dataDays.value.value
    keepSatsData.value = keepSats.summary_transactions.filter(
      (trx) => trx.reason !== "Fees" && trx.timestamp > oldTimestamp
    )

    const tempTotal = keepSats.summary_transactions.filter(
      (trx) => trx.timestamp > oldTimestamp
    )
    keepSatsTotal.value = 0
    keepHiveTotal.value = 0
    for (let i = 0; i < tempTotal.length; i++) {
      keepSatsTotal.value += tempTotal[i].msats
      keepHiveTotal.value += tempTotal[i].hive
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
  fetchData()
})

/**
 * Toggles the expansion of all rows in the table.
 *
 * If no rows are currently expanded, it expands all rows by setting `rowsExpanded.value` to an array of all checkCodes.
 * If there are any expanded rows, it collapses all rows by setting `rowsExpanded.value` to an empty array.
 */
function expandAll() {
  if (rowsExpanded.value.length === 0) {
    rowsExpanded.value = keepSatsData.value.map((row) => row.group_id)
  } else {
    rowsExpanded.value = []
  }
}
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #e0e0e0;
}
</style>
