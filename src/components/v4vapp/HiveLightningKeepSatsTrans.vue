<template>
  <!-- Refresh button and days select  -->
  <div class="row wrap justify-center">
    <div class="col-auto">
      <div class="refresh-days-button-select row justify-evenly q-py-sm">
        <div class="refresh-button q-px-sm">
          <q-btn
            label="Refresh"
            :loading="storeUser.dataLoading"
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
    </div>
  </div>

  <!-- Ledger Transactions Table -->
  <div class="q-pa-md">
    <q-table
      :rows="tableData"
      :columns="ledgerColumns"
      row-key="group_id"
      :pagination="{ rowsPerPage: 10 }"
      :loading="storeUser.dataLoading"
      class="keepsats-table"
    >
      <template v-slot:body-cell-description="props">
        <q-td :props="props">
          <div
            v-if="props.value && props.value.length > 30"
            class="description-cell"
          >
            <q-expansion-item
              dense
              class="description-expansion"
              header-class="description-header"
              hide-expand-icon
            >
              <template v-slot:header>
                <div class="description-inline">
                  <span class="short-description">
                    {{ props.value.substring(0, 30) }}...
                  </span>
                  <q-icon name="expand_more" class="expansion-icon" />
                </div>
              </template>
              <q-card class="description-card">
                <q-card-section class="description-full">
                  {{ props.value }}
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
          <div v-else class="description-cell">
            {{ props.value }}
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-sats="props">
        <q-td :props="props" class="text-right">
          <strong v-if="isPrimaryAmount(props.row, 'sats')">
            {{ tidyNumber(props.value, 0) }}
          </strong>
          <span v-else>
            {{ tidyNumber(props.value, 0) }}
          </span>
        </q-td>
      </template>
      <template v-slot:body-cell-hive="props">
        <q-td :props="props" class="text-right">
          <strong v-if="isPrimaryAmount(props.row, 'hive')">
            {{ tidyNumber(props.value, 3) }}
          </strong>
          <span v-else>
            {{ tidyNumber(props.value, 3) }}
          </span>
        </q-td>
      </template>
      <template v-slot:body-cell-hbd="props">
        <q-td :props="props" class="text-right">
          <strong v-if="isPrimaryAmount(props.row, 'hbd')">
            {{ tidyNumber(props.value, 3) }}
          </strong>
          <span v-else>
            {{ tidyNumber(props.value, 3) }}
          </span>
        </q-td>
      </template>
      <template v-slot:body-cell-total="props">
        <q-td :props="props" class="text-right">
          {{ tidyNumber(props.value, 0) }}
        </q-td>
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
import KeepSatsDetail from "src/components/v4vapp/KeepSatsDetail.vue"
import { formatPrettyDate, tidyNumber } from "src/use/useUtils"
import { useShortEVMAddress } from "src/use/useEVM"

const storeUser = useStoreUser()
const data = ref([])
const dataDays = ref({ label: "7 days", value: 7 })
const totals = ref({ totalHive: 0, totalSats: 0 })

const keepSatsDataReasonFilter = ref("All")
const keepSatsDataReasons = ref([])
const keepSatsDataCategoryFilter = ref("All")
const keepSatsDataCategories = ref(["All"])
const keepSatsDataFiltered = ref([])

const keepSatsResponse = ref(null)

const t = useI18n().t

const rowsExpanded = ref([])

const props = defineProps({
  adminOverride: Boolean,
})

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

const ledgerColumns = computed(() => {
  return [
    {
      name: "timestamp",
      required: true,
      sortable: true,
      label: "Date",
      align: "left",
      field: "timestamp",
      format: (val) => formatPrettyDate(val),
    },
    {
      name: "description",
      required: true,
      label: "Description",
      align: "left",
      field: "description",
    },
    {
      name: "sats",
      required: true,
      sortable: true,
      label: "Sats",
      align: "right",
      field: (row) => row.conv_signed?.sats || row.sats || 0,
    },
    {
      name: "hive",
      required: true,
      sortable: true,
      label: "Hive",
      align: "right",
      field: (row) => row.conv_signed?.hive || row.hive || 0,
    },
    {
      name: "hbd",
      required: true,
      sortable: true,
      label: "HBD",
      align: "right",
      field: (row) => row.conv_signed?.hbd || row.hbd || 0,
    },
    {
      name: "total",
      required: true,
      sortable: true,
      label: "Total",
      align: "right",
      field: (row) => row.conv_running_total?.sats || 0,
    },
    {
      name: "ledger_type",
      required: true,
      label: "Type",
      align: "left",
      field: "ledger_type",
    },
  ]
})

const tableData = computed(() => {
  return keepSatsResponse.value?.all_transactions?.combined_balance || []
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
      keepSatsResponse.value = null
    }
    return
  }
)

/**
 * Fetches data from the server.
 *
 * @param {number} [newValue=dataDays.value] - The value to use for fetching data. Defaults to the value of `dataDays.value`.
 * @returns {Promise} - A promise that resolves with the fetched data.
 */
async function fetchData(newValue = dataDays.value) {
  storeUser.dataLoading = true
  if (!storeUser.hiveAccname) {
    data.value = []
    keepSatsData.value = []
    keepSatsResponse.value = null
    return
  }
  const keepSats = await useKeepSats(false, true, props.adminOverride)
  console.log("KeepSats data", keepSats)

  keepSatsResponse.value = keepSats

  storeUser.dataLoading = false
}

onMounted(() => {
  fetchData()
})

/**
 * Determines if the specified field is the primary amount in the transaction
 * @param {Object} row - The transaction row data
 * @param {string} field - The field to check ('sats', 'hive', or 'hbd')
 * @returns {boolean} - True if this field matches the unit type
 */
function isPrimaryAmount(row, field) {
  const unit = row.unit
  if (!unit) return false

  // Map unit values to field names
  if (unit === "hive" && field === "hive") return true
  if (unit === "hbd" && field === "hbd") return true
  if (unit === "msats" && field === "sats") return true

  return false
}
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 1px solid #e0e0e0;
}

.keepsats-table .q-table__container .q-table tbody tr td {
  padding: 5px;
}

.description-cell {
  width: 100%;
}

.description-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.short-description {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.2;
  margin-right: 8px;
}

.expansion-icon {
  font-size: 1.2rem;
  color: #1976d2;
  transition: transform 0.3s ease;
}

.description-expansion {
  .q-expansion-item__header {
    padding: 4px 8px;
    min-height: auto;
    border: none;
    background: transparent;

    &:hover {
      background-color: rgba(25, 118, 210, 0.04);
    }

    &.q-expansion-item--expanded .expansion-icon {
      transform: rotate(180deg);
    }
  }

  .q-expansion-item__content {
    padding: 0;
  }
}

.description-card {
  margin-top: 8px;
  border-left: 3px solid #1976d2;
}

.description-full {
  padding: 12px;
  font-size: 0.875rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
