<template>
  <div class="keepsats-detail-table">
    <q-table
      dense
      hide-pagination
      key="unique_id"
      :rows="tableData"
      :columns="columns"
      row-key="trx_id"
      :visible-columns="['reason', 'hive', 'msats', 'link']"
    >
      <template v-slot:body="props">
        <q-tr :props="props.row" class="no-divider">
          <q-td dense class="text-left">
            {{ useShortEVMAddress(props.row.reason_str) }}
            {{ props.row.reason }}
          </q-td>
          <q-td class="text-right">
            {{ tidyNumber(props.row.hive, 3) }}
          </q-td>
          <q-td class="text-right">
            {{ tidyNumber(props.row.msats / 1000, 1) }}
          </q-td>
          <q-td>
            <div v-if="props.row.trx_id">
              <a
                :href="useGenerateTxUrl(props.row.trx_id)"
                target="_blank"
                class="custom-link"
              >
                <q-btn
                  size="xs"
                  color="accent"
                  flat
                  dense
                  icon="fa-brands fa-hive"
                  name="open_in_new"
                />
              </a>
            </div>
            <div v-else>
              <div v-if="props.row.nobroadcast">
                <!-- Hive transfer not broadcasted -->
                -
              </div>
              <div v-else>
                <!-- Lightning payment -->
                <i class="fa-sharp fa-solid fa-bolt" />
              </div>
            </div>
          </q-td>
        </q-tr>
        <!-- Expansion item showing the text memo -->
        <q-tr v-if="props.row.memo" :props="props.row" class="no-divider">
          <q-td
            colspan="4"
            class="text-left text-wrap max-width-cell-ellipsis"
            :style="wrapNoWrap(expandedMemo[props.row.id])"
          >
            <div class="memo-content">
              {{ props.row.memo }}
              <q-btn
                dense
                flat
                round
                size="xs"
                icon="expand"
                class="q-mx-none expand-icon"
                @click="toggleExpandedMemo(props.row.id)"
              />
            </div>
          </q-td>
        </q-tr>
        <!-- End of Expansion item showing the text memo -->
      </template>

      <template v-slot:bottom-row>
        <q-tr class="text-bold">
          <q-td>Total</q-td>
          <q-td class="text-right">
            {{ tidyNumber(totals.totalHive, 3) }}
          </q-td>
          <q-td class="text-right">
            {{ tidyNumber(totals.totalSats, 1) }}
          </q-td>
          <q-td colspan="1"> </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { tidyNumber } from "src/use/useUtils";
import { useGenerateTxUrl } from "src/use/useHive";
import { useShortEVMAddress } from "src/use/useEVM";

const t = useI18n().t;
const props = defineProps({
  tableData: Array,
});

// If you have data properties, define them using ref or reactive
const expandedMemo = ref({});

// If you have methods, define them as regular functions
function toggleExpandedMemo(id) {
  expandedMemo.value[id] = !expandedMemo.value[id];
}

const wrapNoWrap = (val) => {
  return val ? "white-space:wrap;" : "white-space:nowrap;";
};

const totals = computed(() => {
  const totalHive = props.tableData.reduce((acc, row) => acc + row.hive, 0);
  const totalSats =
    props.tableData.reduce((acc, row) => acc + row.msats, 0) / 1000;
  return { totalHive, totalSats };
});

const columns = computed(() => [
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
    label: "Hive",
    align: "right",
    field: "hive",
    format: (val) => tidyNumber(val, 3),
  },
  {
    name: "msats",
    required: true,
    label: "Sats",
    align: "right",
    field: "msats",
    format: (val) => tidyNumber(val / 1000, 1),
  },
  {
    name: "link",
    required: true,
    align: "center",
    field: "trx_id",
  },
]);
</script>

<style lang="scss" scoped>
.keepsats-detail-table .q-table__container .q-table tbody tr td {
  padding: 4px;
}

.no-divider {
  border: none;
}

.text-wrap {
  white-space: wrap;
}

.max-width-cell-ellipsis {
  max-width: 180px; /* Adjust as needed */
  overflow: hidden;
  text-overflow: ellipsis;
}

.fixed-width-tooltip {
  max-width: 200px;
}

.icon-cell {
  display: flex;
  align-items: start;
}

.memo-content {
  position: relative;
}

.expand-icon {
  position: absolute;
  top: 0;
  right: -5px;
  background: #ecbaba; /* Change this to the color you want */
  padding: 1px; /* Add some padding so the background is larger than the icon */
  margin: 2px;
}
</style>
