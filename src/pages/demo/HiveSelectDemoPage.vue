<template>
  <q-page>
    <div>
      <q-btn @click="fetchData">{{ storeUser.currentUser }}</q-btn>
    </div>
    <div class="q-pa-md row items-start q-gutter-md">
      <q-table
        :rows="data"
        row-key="group_id"
        :visible-columns="['trx_reason', 'max_sats', 'last_timestamp']"
      ></q-table>

      <div v-if="data">
        <pre>{{ data[0] }}</pre>
      </div>
    </div>
    <div>
      <div v-if="hiveAccname">{{ hiveAccname }}</div>
      <div v-else>Default Value</div>
      <div v-if="hiveAccname?.value">{{ hiveAccname.value }}</div>
      <div v-else>Default Value</div>
    </div>
    <div class="q-pa-md row items-start q-gutter-md">
      <q-card class="sidebyside-card hive-fancy-selector">
        <q-card-section class="q-pa-sm">
          <p>HiveSelectFancyAcc</p>
        </q-card-section>
        <q-card-section class="text-center q-pa-sm">
          <HiveSelectFancyAcc filled dense v-model="hiveAccname" fancyOptions />
        </q-card-section>
        <q-card-section>
          <div class="image-container">
            <a href="https://peakd.com/created/v4vapp-v2">
              <div v-if="hiveAccname">
                <HiveAvatar :hiveAccname="hiveAccname.label" size="large" />
              </div>
              <div v-else>
                <q-img
                  alt="V4V.app v2 Quasar Stars"
                  src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
                />
              </div>
            </a>
          </div>
        </q-card-section>
      </q-card>
      <q-card class="sidebyside-card hive-selector">
        <q-card-section class="q-pa-sm"><p>HiveSelectAcc</p></q-card-section>
        <q-card-section class="text-center q-pa-sm">
          <HiveSelectAcc dense v-model="hiveAccname.value" />
        </q-card-section>
        <q-card-section>
          <div class="image-container">
            <a href="https://peakd.com/created/v4vapp-v2">
              <div v-if="hiveAccname">
                <HiveAvatar :hiveAccname="hiveAccname.label" size="large" />
              </div>
              <div v-else>
                <q-img
                  alt="V4V.app v2 Quasar Stars"
                  src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
                />
              </div>
            </a>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import HiveSelectAcc from "components/HiveSelectAcc.vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { useStoreUser } from "src/stores/storeUser"
import { ref, watch, onMounted } from "vue"
import { apiLogin } from "src/boot/axios"

const storeUser = useStoreUser()
const data = ref()
const columns = ref()
const hiveAccname = ref({ label: "", value: "", caption: "" })

columns.value = [
  {
    name: "id",
    field: "group_id",
  },
  {
    name: "trx_reason",
    field: "trx_reason",
  },
]

async function fetchData() {
  console.log("fetchData")
  let rawData = []
  if (storeUser.apiTokenSet()) {
    try {
      rawData = await apiLogin.get("/trx_records/")
      data.value = rawData.data
    } catch (error) {
      console.error("fetchData error", error)
    }
  }
}

onMounted(async () => {
  console.log("HiveSelectDemoPage mounted")
})
</script>

<style lang="sass" scoped>
.sidebyside-card
  width: 45%
  height: auto
  max-width: 500px

.image-container img
  width: 95%
  height: auto
</style>
