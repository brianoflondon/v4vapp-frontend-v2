<template #body="props">
  <q-tr :props="props">
    <q-td :props="props" style="text-align: left">
      {{ props.row }}
      <!-- {{ formatPrettyDate(props.row.timestamp) }} -->
    </q-td>
    <!-- <q-td :props="props" style="text-align: right">
                {{ tidyNumber(props.row.net_hive, 0) }}
              </q-td> -->
    <!-- <q-td :props="props" style="text-align: left">
                {{ props.row.reason }}
              </q-td> -->
    <!-- <q-td :props="props" style="text-align: right">
                <q-btn
                  round
                  flat
                  dense
                  :icon="
                    rowsExpanded.includes(props.row.group_id)
                      ? 'expand_less'
                      : 'expand_more'
                  "
                  @click="
                    rowsExpanded.includes(props.row.group_id)
                      ? (rowsExpanded = rowsExpanded.filter(
                          (row) => row !== props.row.group_id
                        ))
                      : rowsExpanded.push(props.row.group_id)
                  "
                ></q-btn>
              </q-td> -->
  </q-tr>
  <q-tr v-if="props.expand"> expanded </q-tr>
</template>
