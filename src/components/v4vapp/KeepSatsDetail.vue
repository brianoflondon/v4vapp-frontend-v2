<template>
  <q-table
    class=""
    dense
    hide-pagination
    key="unique_id"
    :rows="tableData"
    :columns="columns"

    row-key="trx_id"
    :visible-columns="['reason', 'hive', 'msats', 'link']"
  >
    <!-- <template v-slot:body-cell-link="props">
      <q-td :props="props">
        <div v-if="props.row.trx_id">
          <a
            :href="useGenerateTxUrl(props.row.trx_id)"
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
        </div>
        <div v-else>
          <i class="fa-sharp fa-solid fa-bolt" />
        </div>
      </q-td>
    </template> -->
    <template v-slot:body="props">
      <q-tr :props="props.row" class="no-divider">
        <q-td class="text-left">
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
                text-color="inherit"
                flat
                dense
                icon="open_in_new"
                name="open_in_new"
              />
            </a>
          </div>
          <div v-else>
            <i class="fa-sharp fa-solid fa-bolt" />
          </div>
        </q-td>
      </q-tr>
      <!-- Expansion item showing the text memo -->
      <q-tr v-if="props.row.memo" :props="props.row" class="no-divider">
        <q-td colspan="4" class="text-left text-wrap max-width-cell">
          {{ props.row.memo }}
          <q-tooltip class="fixed-width-tooltip">
            <template v-slot:activator="{ on, attrs }">
              <q-btn
                dense
                flat
                round
                icon="info"
                class="q-mr-sm"
                v-bind="attrs"
                v-on="on"
              />
            </template>
            <div class="text-wrap fixed-width-tooltip">{{ props.row.memo }}</div>
          </q-tooltip>
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
</template>

<script setup>
import { defineProps, computed } from "vue"
import { useI18n } from "vue-i18n"
import { tidyNumber } from "src/use/useUtils"
import { useGenerateTxUrl } from "src/use/useHive"

const t = useI18n().t
const props = defineProps({
  tableData: Array,
})

const totals = computed(() => {
  const totalHive = props.tableData.reduce((acc, row) => acc + row.hive, 0)
  const totalSats =
    props.tableData.reduce((acc, row) => acc + row.msats, 0) / 1000
  return { totalHive, totalSats }
})

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
])
</script>

<style lang="scss" scoped>
.no-divider {
  border: none;
}

.max-width-cell {
  max-width: 200px;  /* Adjust as needed */
  overflow: hidden;
  text-overflow: ellipsis;
}

.fixed-width-tooltip {
  max-width: 200px;
}
</style>
