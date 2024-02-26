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
    <template v-slot:body-cell-link="props">
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

<style lang="scss" scoped></style>
