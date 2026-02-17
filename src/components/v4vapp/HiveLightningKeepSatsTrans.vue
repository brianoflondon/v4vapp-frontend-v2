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
            @click="fetchData()"
          ></q-btn>
        </div>
        <!-- Days select (currently fixed to 7 days)
        <div class="days-select q-px-sm">
          <q-select
            :model-value="{ label: '7 days', value: 7 }"
            :options="[
              { label: '3 days', value: 3 },
              { label: '7 days', value: 7 },
              { label: '30 days', value: 30 },
              { label: '90 days', value: 90 },
              { label: '365 days', value: 365 },
            ]"
            label="Days"
            dense
            readonly
          ></q-select>
        </div>
        -->
      </div>
    </div>
  </div>

  <!-- Ledger Transactions Table -->
  <div
    :class="{
      'q-px-none': isMobileView,
      'q-py-xs': isMobileView,
      'q-pa-md': !isMobileView,
    }"
    class="full-width"
  >
    <q-table
      :rows="tableData"
      :columns="ledgerColumns"
      :visible-columns="visibleColumns"
      row-key="group_id"
      :pagination="{ rowsPerPage: 10, sortBy: 'timestamp', descending: true }"
      :loading="storeUser.dataLoading"
      :class="{ 'keepsats-table': true, 'mobile-table': isMobileView }"
    >
      <template v-slot:body-cell-description="props">
        <q-td :props="props" :class="{ 'mobile-desc-cell': isMobileView }">
          <div v-if="isMobileView" class="description-cell">
            <q-expansion-item
              dense
              class="description-expansion"
              header-class="description-header"
              hide-expand-icon
            >
              <template v-slot:header>
                <div class="description-inline">
                  <span class="short-description">
                    <span class="ledger-icon">{{ props.row.icon }}</span>
                    <span v-if="props.row.link" class="hive-link-icon">
                      <a
                        :href="props.row.link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i class="fa-brands fa-hive" />
                      </a>
                    </span>
                    {{ truncateMobile(props.value) }}
                  </span>
                  <q-icon name="expand_more" class="expansion-icon" />
                </div>
              </template>
              <q-card class="description-card">
                <q-card-section class="description-full">
                  {{ props.value }}
                  <div
                    class="rate-line"
                    v-if="props.row.sats_hbd || props.row.sats_hive"
                  >
                    <strong>Rate:</strong>
                    {{ tidyNumber(props.row.sats_hbd, 0) || "-" }}
                    sats/USD&nbsp;|&nbsp;{{
                      tidyNumber(props.row.sats_hive, 0) || "-"
                    }}
                    sats/Hive
                  </div>
                  <div v-if="props.row.user_memo" class="user-memo">
                    <strong>Memo:</strong> "{{ props.row.user_memo }}"
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
          <div v-else class="description-cell">
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
                      {{ props.value.substring(0, 35) }}...
                    </span>
                    <q-icon name="expand_more" class="expansion-icon" />
                  </div>
                </template>
                <q-card class="description-card">
                  <q-card-section class="description-full">
                    {{ props.value }}
                    <div
                      class="rate-line"
                      v-if="props.row.sats_hbd || props.row.sats_hive"
                    >
                      <strong>Rate:</strong>
                      {{ tidyNumber(props.row.sats_hbd, 0) || "-" }}
                      sats/USD&nbsp;|&nbsp;{{
                        tidyNumber(props.row.sats_hive, 0) || "-"
                      }}
                      sats/Hive
                    </div>
                    <div v-if="props.row.user_memo" class="user-memo">
                      <strong>Memo:</strong> "{{ props.row.user_memo }}"
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </div>
            <div v-else class="description-cell">
              {{ props.value }}
            </div>
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-timestamp="props">
        <q-td :props="props" :class="{ 'mobile-date-cell': isMobileView }">
          {{
            formatDate(props.row.timestamp_unix || props.row.timestamp)
          }}
        </q-td>
      </template>
      <template v-slot:body-cell-sats="props">
        <q-td
          :props="props"
          :class="{ 'mobile-compact-cell': isMobileView }"
          class="text-right"
        >
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
        <q-td
          :props="props"
          :class="{ 'mobile-compact-cell': isMobileView }"
          class="text-right"
        >
          {{ tidyNumber(props.value, 0) }}
        </q-td>
      </template>
      <template v-slot:body-cell-ledger_type="props">
        <q-td :props="props">
          <span class="ledger-icon">
            {{ props.row.icon }}
            <q-tooltip>{{ props.row.ledger_type_str }}</q-tooltip>
          </span>
          <span v-if="props.row.link" class="hive-link-icon">
            <a :href="props.row.link" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-hive" />
            </a>
          </span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useQuasar } from "quasar";
import { useStoreUser } from "src/stores/storeUser";
import { useKeepSats } from "src/use/useV4vapp";
import { formatPrettyDate, tidyNumber } from "src/use/useUtils";

const storeUser = useStoreUser();
const $q = useQuasar();
const keepSatsResponse = ref([]);

const props = defineProps({
  adminOverride: Boolean,
});

// Check if screen width is less than 700px
const isMobileView = computed(() => $q.screen.width < 700);

/**
 * Formats a date, abbreviating time units on mobile view.
 * "X minutes" -> "X min", "X hours" -> "X hr"
 */
function formatDate(timestamp) {
  const pretty = formatPrettyDate(timestamp);
  if (!isMobileView.value) return pretty;
  return pretty
    .replace(/\b(\d+)\s+minutes?\b/, "$1 min")
    .replace(/\b(\d+)\s+hours?\b/, "$1 hr")
    .replace(/\b(\d+)\s+days?\b/, "$1 d")
    .replace(/\b(\d+)\s+secs?\b/, "$1 s");
}

/**
 * Truncates a description string for mobile display.
 * Shows as much as fits, with ellipsis if truncated.
 */
function truncateMobile(text) {
  if (!text) return "";
  const maxLen = 25;
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "…";
}

const ledgerColumns = computed(() => {
  const columns = [
    {
      name: "timestamp",
      required: true,
      sortable: true,
      label: "Date",
      align: "left",
      field: (row) => {
        // prefer millisecond unix timestamp when available, fall back to numeric or parsed timestamp
        if (typeof row.timestamp_unix === "number") return row.timestamp_unix;
        if (typeof row.timestamp === "number") return row.timestamp;
        // Date.parse returns ms since epoch or NaN; this handles ISO strings
        return Date.parse(row.timestamp);
      },
    },
  ];

  // Add Type column if not mobile
  if (!isMobileView.value) {
    columns.push({
      name: "ledger_type",
      required: true,
      label: "Type",
      align: "left",
      field: "ledger_type",
    });
  }

  columns.push(
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
  );

  // Add Hive and HBD columns if not mobile
  if (!isMobileView.value) {
    columns.push(
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
    );
  }

  // Always add Total column
  columns.push({
    name: "total",
    required: true,
    sortable: true,
    label: "Total",
    align: "right",
    field: (row) => row.conv_running_total?.sats || 0,
  });

  return columns;
});

// Dynamic visible columns based on screen size
const visibleColumns = computed(() => {
  if (isMobileView.value) {
    return ["timestamp", "description", "sats", "total"];
  } else {
    return [
      "timestamp",
      "ledger_type",
      "description",
      "sats",
      "hive",
      "hbd",
      "total",
    ];
  }
});

// Extract transactions array from the API response
const tableData = computed(() => {
  if (!keepSatsResponse.value || typeof keepSatsResponse.value !== "object") {
    return [];
  }

  // Check for all_transactions.combined_balance first (the main data source)
  if (
    keepSatsResponse.value.all_transactions?.combined_balance &&
    Array.isArray(keepSatsResponse.value.all_transactions.combined_balance)
  ) {
    console.log(
      `Found transactions in all_transactions.combined_balance with ${keepSatsResponse.value.all_transactions.combined_balance.length} items`,
    );
    return keepSatsResponse.value.all_transactions.combined_balance;
  }

  // Fallback: try other possible property names for the transactions array
  const possibleKeys = [
    "transactions",
    "data",
    "rows",
    "items",
    "ledger",
    "history",
    "transfers",
  ];
  for (const key of possibleKeys) {
    if (Array.isArray(keepSatsResponse.value[key])) {
      console.log(
        `Found transactions array in property '${key}' with ${keepSatsResponse.value[key].length} items`,
      );
      return keepSatsResponse.value[key];
    }
  }

  // If no array found, check if the response itself is an array
  if (Array.isArray(keepSatsResponse.value)) {
    console.log(
      "Response is already an array with",
      keepSatsResponse.value.length,
      "items",
    );
    return keepSatsResponse.value;
  }

  // If still no array, return empty array
  console.warn(
    "Could not find transactions array in keepSats response. Available keys:",
    Object.keys(keepSatsResponse.value),
  );
  return [];
});

watch(
  () => storeUser.currentUser,
  async (newVal) => {
    if (newVal) {
      await fetchData();
    }
    if (newVal === null || newVal === undefined) {
      keepSatsResponse.value = [];
    }
    return;
  },
);

/**
 * Fetches data from the server.
 * @returns {Promise} - A promise that resolves with the fetched data.
 */
async function fetchData() {
  storeUser.dataLoading = true;
  if (!storeUser.hiveAccname) {
    keepSatsResponse.value = [];
    return;
  }
  const keepSats = await useKeepSats(false, true, props.adminOverride);
  console.log("KeepSats data", keepSats);
  console.log("KeepSats data keys:", Object.keys(keepSats || {}));

  keepSatsResponse.value = keepSats;

  storeUser.dataLoading = false;
}

onMounted(() => {
  fetchData();
});

/**
 * Determines if the specified field is the primary amount in the transaction
 * @param {Object} row - The transaction row data
 * @param {string} field - The field to check ('sats', 'hive', or 'hbd')
 * @returns {boolean} - True if this field matches the unit type
 */
function isPrimaryAmount(row, field) {
  const unit = row.unit;
  if (!unit) return false;

  // Map unit values to field names
  if (unit === "hive" && field === "hive") return true;
  if (unit === "hbd" && field === "hbd") return true;
  if (unit === "msats" && field === "sats") return true;

  return false;
}
</script>

<style lang="scss" scoped>
.keepsats-table .q-table__container .q-table tbody tr td {
  padding: 1px;
}

.mobile-table {
  :deep(table tbody tr td) {
    padding: 1px 1px 1px 1px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  :deep(table thead tr th) {
    padding: 2px 2px 2px 2px;
    padding-right: 4px;
    font-size: 0.75rem;
  }

  :deep(table thead tr th:first-child) {
    padding-left: 2px;
    text-align: left;
  }


  :deep(table tbody tr:hover) {
    background-color: transparent;
  }
}

.mobile-date-cell {
  // width: 20px;
  // min-width: 20px;
  // max-width: 20px;
  font-size: 0.7rem;
  padding: 1px 2px 1px 2px !important;
  white-space: nowrap;
  text-align: left;
}

.mobile-compact-cell {
  font-size: 0.75rem;
  text-align: right;
  padding: 1px 2px 1px 0px !important;
  white-space: nowrap;
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

.mobile-table .short-description {
  font-size: 0.75rem;
  margin-right: 2px;
}

.expansion-icon {
  font-size: 1.2rem;
  color: var(--q-primary);
  transition: transform 0.3s ease;
}

.description-expansion {
  .q-expansion-item__header {
    padding: 4px 8px;
    min-height: auto;
    border: none;
    background: transparent;

    &:hover {
      background-color: var(--q-hover-background);
    }

    &.q-expansion-item--expanded .expansion-icon {
      transform: rotate(180deg);
    }
  }

  .q-expansion-item__content {
    padding: 0;
  }
}

.mobile-desc-cell {
  padding: 1px 0px 1px 0px !important;
}

.mobile-table .description-expansion {
  :deep(.q-expansion-item__header) {
    padding: 2px 0px;
    min-height: auto;
  }

  :deep(.q-item__section--main) {
    padding: 0;
  }

  :deep(.q-item__section--side) {
    padding: 0;
    min-width: 0;
  }

  :deep(.q-item) {
    min-height: 0;
    padding: 0;
  }
}

.description-card {
  margin-top: 8px;
  border-left: 3px solid var(--q-primary);
}

.mobile-table .description-card {
  margin-top: 4px;
  margin-left: 0;
}

.description-full {
  padding: 3px;
  font-size: 0.875rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  background-color: var(--q-card-background);
  border-radius: 4px;
}

.user-memo {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--q-separator-color);
  font-size: 0.8rem;
  color: var(--q-text-secondary);
  font-style: italic;

  strong {
    color: var(--q-primary);
    font-weight: 600;
  }
}

// To show or hide the rate-line edit this.
.rate-line {
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--q-text-secondary);
  display: none;
}

.hive-link-icon {
  margin-left: 4px;

  a {
    color: var(--q-primary);
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.2s ease;

    &:hover {
      color: var(--q-secondary);
    }
  }
}
</style>
