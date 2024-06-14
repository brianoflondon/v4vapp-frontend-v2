<template>
  <div>
    <UserList @update="doClick" />

    <HiveLogin v-model="hiveAccObj" key-type="Posting" label="label" />
    <PasskeyManagement />
    <HiveLogout />

    <div class="q-mt-md">
      <q-btn v-if="!loggedIn" color="primary" label="Login" @click="login" />
      <q-btn v-else color="primary" label="Authorize" @click="authorize" />
    </div>
    <div>
      <q-select
        filled
        v-model="selectedScopes"
        :options="scopes"
        multiple
        use-input
        use-chips
        label="Select Scopes"
      />
    </div>
    <pre>
            clientId: {{ clientId }}
            redirectUri: {{ redirectUri }}
            scope: {{ scopesString }}
            responseType: {{ responseType }}
            responseMode: {{ responseMode }}
            codeChallengeMethod: {{ codeChallengeMethod }}
            codeChallenge: {{ codeChallenge }}
            state: {{ state }}
            nonce: {{ nonce }}
            pkce: {{ pkce }}
        </pre
    >
    <q-btn
      color="primary"
      label="test_get_user_value4value"
      @click="test_get_user_value4value"
    />
    <pre>
      {{ userV4V }}
    </pre>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRoute } from "vue-router"
import { useStoreUser } from "src/stores/storeUser"
import { useHiveAvatarURL } from "src/use/useHive"
import { api, apiLogin } from "src/boot/axios"
import HiveAvatar from "src/components/utils/HiveAvatar.vue"
import UserList from "src/components/hive/UserList.vue"
import HiveLogin from "src/components/HiveLogin.vue"
import HiveLogout from "src/components/HiveLogout.vue"
import PasskeyManagement from "src/components/utils/PasskeyManagement.vue"

const storeUser = useStoreUser()

const scopes = [
  "account:read",
  "invoices:create",
  "invoices:read",
  "transactions:read",
  "balance:read",
  "payments:send",
]
const selectedScopes = ref([])

const hiveAccObj = ref()
const route = useRoute()
const clientId = ref("")
const redirectUri = ref("")
const scope = ref("")
const responseType = ref("")
const responseMode = ref("")
const codeChallengeMethod = ref("")
const codeChallenge = ref("")
const state = ref("")
const nonce = ref("")
const pkce = ref(true)

const userV4V = ref({})

const loggedIn = computed(() => {
  return checkClientIdLoggedIn()
})

const scopesString = computed(() => {
  return selectedScopes.value.join(" ")
})

onMounted(() => {
  if (route.query) {
    clientId.value = route.query.client_id
    redirectUri.value = route.query.redirect_uri
    scope.value = route.query.scope
    responseType.value = route.query.response_type
    responseMode.value = route.query.response_mode
    codeChallengeMethod.value = route.query.code_challenge_method
    codeChallenge.value = route.query.code_challenge
    state.value = route.query.state
    nonce.value = route.query.nonce
    testingMatOnly()
    if (scope.value) {
      selectedScopes.value = scope.value.split(" ")
    }
  }
  loggedIn.value = checkClientIdLoggedIn()

  console.log("apiLogin.defaults.headers", apiLogin.defaults.headers)
})

function doClick() {
  console.log("doClick")
  console.log("apiLogin.defaults.headers", apiLogin.defaults.headers)
}

function checkClientIdLoggedIn() {
  if (Object.keys(storeUser.users).length > 0) {
    return true
  }
  return false
}

async function testingMatOnly() {
  console.log("codeChallengeMethod", codeChallengeMethod.value)
  if (
    codeChallengeMethod.value === "" ||
    codeChallengeMethod.value === "none" ||
    codeChallengeMethod.value === undefined ||
    codeChallengeMethod.value === null
  ) {
    console.log("Don't use PKCE")
    pkce.value = false
    codeChallenge.value = clientId.value + "-" + storeUser.currentUser
    try {
      console.log("storeUser.currentUser", storeUser.currentUser)
    } catch (error) {
      console.log(error)
    }
  }
}

async function authorize() {
  console.log("authorize")
  try {
    storeUser.switchUser(storeUser.currentUser)
    let params = {
      state: state.value,
      clientId: clientId.value,
      code_challenge: codeChallenge.value,
      scope: scopesString.value,
    }
    // first call the api (must be logged in) to get the auth code
    const resp = await apiLogin.get("alby/get_auth_code", { params })
    console.log(resp)
    const code = resp.data.code
    params = {
      state: state.value,
      code: code,
    }

    try {
      // now do a window redirect to the redirect_uri with the code as a query param
      const url = new URL(redirectUri.value)
      url.search = new URLSearchParams(params).toString()
      window.location.href = url
    } catch (error) {
      console.log(error)
    }
  } catch (error) {
    console.log(error)
  }
}

async function test_get_user_value4value() {
  try {
    storeUser.switchUser(storeUser.currentUser)
    const resp = await apiLogin.get("alby/user/value4value")
    userV4V.value = resp.data
    console.log(resp)
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="scss" scoped></style>
