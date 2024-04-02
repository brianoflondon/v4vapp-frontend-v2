<template>
  <q-page>
    <div class="webauthn-testing flex">
      <div class="webauthn-list q-pa-md">
        <div>
          <q-btn
            label="List Credentials"
            @click="listCredentials"
            class="q-mb-md"
            color="primary"
            size="lg"
          />
        </div>
        <div>
          <q-table
            :rows="keyList"
            row-key="_id"
            wrap-cells
            flat
            dense
            class="q-mb-md"
            @row-click="handleRowClick"
            selection="multiple"
            v-model:selected="selectedRows"
          >
            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th auto-width></q-th>
                <!-- Empty header for the checkbox column -->
                <q-th auto-width></q-th>
                <!-- Empty header for the edit button column -->
                <q-th auto-width></q-th>
                <!-- Empty header for the delete button column -->
                <q-th v-for="col in props.cols" :key="col.name" :props="props">
                  {{ col.label }}
                </q-th>
              </q-tr>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td auto-width>
                  <q-checkbox v-model="props.selected" />
                </q-td>
                <q-td auto-width>
                  <q-btn icon="edit" @click="updateRow(props.row)" />
                </q-td>
                <q-td auto-width="">
                  <q-btn icon="delete" @click="deleteRow(props.row)" />
                </q-td>
                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                  {{ col.value }}
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
        <pre>
          {{ selectedRows }}
        </pre>
      </div>
      <div class="webauthn-register q-pa-md">
        <div>
          <q-btn
            label="WebAuthn register"
            @click="webauthnRegister"
            class="q-mb-md"
            color="primary"
            size="lg"
          />
          <q-input
            v-model="deviceName"
            label="Device Name"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="storeUser.hiveAccname"
            label="Hive Account Name"
            disable
            dense
          />
        </div>
      </div>
      <div class="webauth-auth q-pa-md">
        <div>
          <q-btn
            label="WebAuthn auth"
            @click="webauthnAuth"
            class="q-mb-md"
            color="primary"
            size="lg"
          />
          <q-input v-model="loginHiveAccname" label="Hive Account Name" dense />
        </div>
      </div>
    </div>
    <div class="q-pa-md row items-start q-gutter-md"></div>
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
import { ref, onMounted } from "vue"
import * as webauthn from "@github/webauthn-json"
import { apiLogin } from "src/boot/axios"

const deviceName = ref("")
const keyList = ref()
const selectedRows = ref()
const loginHiveAccname = ref()

const storeUser = useStoreUser()
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

onMounted(async () => {
  console.log("HiveSelectDemoPage mounted")
  console.log("webauthn.supported", webauthn.supported())
  await storeUser.switchUser(storeUser.hiveAccname)
  listCredentials()
})

async function listCredentials() {
  console.log("listCredentials - start")

  apiLogin.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${storeUser.apiToken}`
  console.log("storeUser.apiToken", storeUser.apiToken)
  const listCredentials = await apiLogin.get(`/credentials/list/`, {})
  keyList.value = listCredentials.data
  console.log("credentials", listCredentials.data)
}

async function webauthnRegister() {
  console.log("webauthnRegister - start")
  // First get the challenge from the server
  // Then call webauthn.create with the challenge
  let params = {
    hive_accname: storeUser.hiveAccname,
    clientId: storeUser.clientId,
    appId: "work-in-progress",
  }

  if (deviceName.value) {
    params.deviceName = deviceName.value
  }
  let getChallenge = null
  try {
    getChallenge = await apiLogin.post(`/register/begin/`, params, {
      params,
    })
    console.log("getChallenge.data", getChallenge.data)
  } catch (error) {
    console.error("getChallenge error fetching the challenge", error)
    return
  }
  // let options = webauthn.parseCreationOptionsFromJSON(getChallenge.data)
  // console.log("options", options)
  let response = null
  try {
    response = await webauthn.create(getChallenge.data)
  } catch (error) {
    console.error("webauthn.create error", error)
    return
  }
  console.log("response", response)
  let sendChallengeBack = null
  // alert("ask for the device name", response)
  try {
    sendChallengeBack = await apiLogin.post(`/register/complete/`, response, {
      params,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("sendChallengeBack error", error)
    return
  }

  console.log("sendChallengeBack.data", sendChallengeBack.data)
}

async function webauthnAuth() {
  console.log("webauthnAuth - start")
  if (!loginHiveAccname.value) {
    console.error("No Hive Account Name provided")
    return
  }
  let params = {
    hive_accname: loginHiveAccname.value,
    clientId: storeUser.clientId,
    appId: "work-in-progress",
  }
  let getChallenge = null
  try {
    getChallenge = await apiLogin.post(`/authenticate/begin/`, params, {
      params,
    })
    console.log("getChallenge.data", getChallenge.data)
  } catch (error) {
    if (error.response.status === 401) {
      console.log("No Credentials found for this account")
      return
    }
    console.error("getChallenge error", error)
    return
  }
  try {
    let response = await webauthn.get(getChallenge.data)
    console.log("response", response)
    let sendChallengeBack = await apiLogin.post(
      `/authenticate/complete/`,
      response,
      {
        params,
        headers: { "Content-Type": "application/json" },
      }
    )
    console.log("sendChallengeBack.data", sendChallengeBack.data)
    if (sendChallengeBack.data.access_token) {
      console.log(
        "sendChallengeBack.data.access_token",
        sendChallengeBack.data.access_token
      )
      // give me a date 1 week in the future
      let expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + 7)
      await storeUser.login(
        loginHiveAccname.value,
        "posting",
        "webauthn",
        expireDate,
        null,
        sendChallengeBack.data.access_token
      )
    }
  } catch (error) {
    console.error("webauthn.get error", error)
    return
  }
}

function handleRowClick(event, row) {
  console.log("row", row)
}

async function deleteRow(row) {
  console.log("deleteRow", row)
  let params = {
    credentialId: row._id,
  }
  let deleteResult = await apiLogin.delete(`/credentials/delete/`, {
    params,
  })
  console.log("deleteResult", deleteResult)
  listCredentials()
}

async function updateRow(row) {
  console.log("updateRow", row)

  let params = {
    credentialId: row._id,
    deviceName: row.device_name + " updated",
  }
  let updateResult = await apiLogin.put(`/credentials/update/`, {}, { params })
  console.log("updateResult", updateResult)
  listCredentials()
}
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
