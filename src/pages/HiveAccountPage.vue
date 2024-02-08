<template>
  <q-page>
    <div class="flex row items-baseline justify-center">
      <UserList
        @update="(val) => (hiveUsername = val)"
        @click="$emit('close-menu')"
      />
      <div class="q-pa-sm">{{ hiveAccount }}</div>
      <div class="q-pa-sm">
        <q-btn label="Login" @click="loginToApi"></q-btn>
      </div>
      <div class="q-pa-sm">
        <q-btn
          :disable="!apiTokenValid"
          label="Fetch"
          @click="fetchData"
        ></q-btn>
      </div>
    </div>
    <div>
      <q-table
        :rows="data"
        row-key="group_id"
        :visible-columns="['trx_reason', 'max_sats', 'last_timestamp']"
      ></q-table>
    </div>
    <pre>{{ data }}</pre>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { useUsernameFromRouteParam } from "src/use/useUtils.js"
import { useStoreUser } from "src/stores/storeUser"
import { apiLogin } from "boot/axios"
import { api } from "boot/axios"
import {
  useGetApiKeychainChallenge,
  useHiveKeychainLogin,
  useLoginFlow,
  useValidateApi,
} from "src/use/useKeychain"
import UserList from "src/components/hive/UserList.vue"

const storeUser = useStoreUser()

const route = useRoute()
const routePage = ref("")
const hiveAccObj = ref()
const hiveAccount = ref()
const data = ref()

const apiTokenValid = computed(() => {
  // console.log(storeUser.getUser(hiveAccount.value).hasApiToken)
  console.log(
    "storeUser.getUser(hiveAccount.value)",
    storeUser.getUser(hiveAccount.value)
  )
  const user = storeUser.getUser(hiveAccount.value)
  if (user) {
    console.log("user.hasApiToken", user.hasApiToken)
    console.log("user.apiToken", user.apiToken)
    if (user.hasApiToken) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  console.log("GetHive.vue onMounted")
  console.log("route", route)
  routePage.value = safeStringify(route)
  hiveAccount.value = useUsernameFromRouteParam(route.params.hiveAccTo)
  if (hiveAccount.value === "") {
    console.error("No Hive Account Name")
  } else {
    console.log("hiveAccount", hiveAccount.value)
    console.log("storeUser", storeUser)
    const user = storeUser.getUser(hiveAccount.value)
    user.checkApiTokenValid()
    await fetchData()
  }
})

async function fetchData() {
  console.log("fetchData")
  const user = storeUser.getUser(hiveAccount.value)
  if (user) {
    console.log("fetchData for user", user.hiveAccname)
    if (user.setApiToken()) {
      try {
        const rawData = await apiLogin.get("/v1/trx_records/")
        data.value = rawData.data["HIVETOLND"]
      } catch (error) {
        console.error("fetchData error", error)
      }
    } else {
      console.error("No API Token")
      await loginToApi()
    }
  }
}

async function loginToApi() {
  console.log("loginToApi")
  await loginApiKeychain(hiveAccount.value)
}

async function loginApiKeychain(username) {
  console.log("loginApiKeychain")
  let hiveAccObj = { value: username }
  const props = { keyType: "posting" }
  await useLoginFlow(hiveAccObj, props)
  return
  try {
    const clientId = storeUser.clientId
    console.log("clientId: ", clientId)
    const challenge = await useGetApiKeychainChallenge(username, clientId)
    console.log(challenge)
    const signedMessage = await useHiveKeychainLogin({
      hiveAccname: username,
      message: challenge.data.challenge,
      keyType: "posting",
    })
    console.log("signedMessage: ", signedMessage)
    const validate = await useValidateApi(clientId, signedMessage)
    console.log("validate: ", validate)
    // need to store this token in the storeUser store
    if (validate.data.access_token) {
      storeUser.login(
        username,
        "posting",
        null,
        null,
        null,
        validate.data.access_token
      )
      apiLogin.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${validate.data.access_token}`
      console.log("apiLogin.defaults: ", apiLogin.defaults.headers.common)
    }
  } catch (error) {
    console.log("error: ", error)
  }
}

function safeStringify(obj) {
  /**
   * Cache used to store data.
   */
  const cache = new Set()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Duplicate reference found, discard key
        return
      }
      // Store value in our set
      cache.add(value)
    }
    return value
  })
}
</script>

<style lang="scss" scoped></style>
