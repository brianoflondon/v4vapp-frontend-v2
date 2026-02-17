<template>
  <div class="">
    <div class="flex column items-center">
      <UserList @update="(val) => doClick(val)" />
      <HiveLogin v-model="hiveAccObj" key-type="Active" label="label" />
      <PasskeyManagement />
      <HiveLogout />
    </div>
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
    <q-btn color="primary" label="test_get_user_me" @click="runTests" />
    <pre>
      {{ userBalance }}
      {{ userV4V }}
    </pre>
    <q-btn
      color="primary"
      label="test_send_payment"
      @click="test_send_payment"
    />
    <pre>

      {{ albyPayment }}

    </pre>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useStoreUser } from "src/stores/storeUser";
import { useHiveAvatarURL } from "src/use/useHive";
import { api, apiLogin } from "src/boot/axios";
import HiveAvatar from "src/components/utils/HiveAvatar.vue";
import UserList from "src/components/hive/UserList.vue";
import HiveLogin from "src/components/HiveLogin.vue";
import HiveLogout from "src/components/HiveLogout.vue";
import PasskeyManagement from "src/components/utils/PasskeyManagement.vue";

const storeUser = useStoreUser();

const scopes = [
  "account:read",
  "invoices:create",
  "invoices:read",
  "transactions:read",
  "balance:read",
  "payments:send",
];
const selectedScopes = ref([]);

const hiveAccObj = ref();
const route = useRoute();
const clientId = ref("");
const redirectUri = ref("");
const scope = ref("");
const responseType = ref("");
const responseMode = ref("");
const codeChallengeMethod = ref("");
const codeChallenge = ref("");
const state = ref("");
const nonce = ref("");
const pkce = ref(true);

const userV4V = ref({});
const userBalance = ref({});
const albyPayment = ref({});

const loggedIn = computed(() => {
  return checkClientIdLoggedIn();
});

const scopesString = computed(() => {
  return selectedScopes.value.join(" ");
});

onMounted(() => {
  readQueryParams();
  console.log("apiLogin.defaults.headers", apiLogin.defaults.headers);
});

function readQueryParams() {
  console.log("readQueryParams");
  if (route.query) {
    clientId.value = route.query.client_id;
    redirectUri.value = route.query.redirect_uri;
    scope.value = route.query.scope;
    responseType.value = route.query.response_type;
    responseMode.value = route.query.response_mode;
    codeChallengeMethod.value = route.query.code_challenge_method;
    codeChallenge.value = route.query.code_challenge;
    state.value = route.query.state;
    nonce.value = route.query.nonce;
    nonPKCEChallenge(storeUser.currentUser);
    if (scope.value) {
      selectedScopes.value = scope.value.split(" ");
    }
  }
  loggedIn.value = checkClientIdLoggedIn();
}

watch(storeUser, (newVal) => {
  nonPKCEChallenge(newVal.hiveAccname);
  if (newVal.hiveAccname != storeUser.currentUser) {
    console.log("watch storeUser.currentUser", newVal.hiveAccname);
  }
});

function doClick(val) {
  console.log("doClick", val);
}

function checkClientIdLoggedIn() {
  if (Object.keys(storeUser.users).length > 0) {
    return true;
  }
  return false;
}

async function nonPKCEChallenge(hiveAccname) {
  if (
    codeChallengeMethod.value === "" ||
    codeChallengeMethod.value === "none" ||
    codeChallengeMethod.value === undefined ||
    codeChallengeMethod.value === null
  ) {
    console.log("Don't use PKCE");
    pkce.value = false;
    codeChallenge.value = state.value + "-" + hiveAccname;
  }
}

async function authorize() {
  console.log("authorize");
  try {
    storeUser.switchUser(storeUser.currentUser);
    let params = {
      state: state.value,
      clientId: clientId.value,
      code_challenge: codeChallenge.value,
      scope: scopesString.value,
    };
    // first call the api (must be logged in) to get the auth code
    const resp = await apiLogin.get("alby/get_auth_code", { params });
    console.log(resp);
    const code = resp.data.code;
    params = {
      state: state.value,
      code: code,
    };

    try {
      // now do a window redirect to the redirect_uri with the code as a query param
      const url = new URL(redirectUri.value);
      url.search = new URLSearchParams(params).toString();
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

function runTests() {
  test_get_user_me();
  test_get_balance();
}

async function test_get_user_me() {
  try {
    storeUser.switchUser(storeUser.currentUser);
    const resp = await apiLogin.get("alby/user/me");
    userV4V.value = resp.data;
    console.log(resp);
  } catch (error) {
    console.log(error);
  }
}

async function test_get_balance() {
  try {
    storeUser.switchUser(storeUser.currentUser);
    const resp = await apiLogin.get("alby/balance");
    userBalance.value = resp.data;
    console.log(resp);
  } catch (error) {
    console.log(error);
  }
}

async function test_send_payment() {
  try {
    storeUser.switchUser(storeUser.currentUser);
    const resp = await apiLogin.post("alby/payments/keysend", {
      amount: 1,
      destination:
        "0396693dee59afd67f178af392990d907d3a9679fa7ce00e806b8e373ff6b70bd8",
      memo: "Testing payments",
      custom_records: {
        818818: "v4vapp.dev",
        7629169:
          '{"guid":"1b7783c7-5089-5bd0-9a17-69db0bcb084e","podcast":"BrianofLondon 3Speak Video Podcast","feedID":1370490,"episode":"Offer and counter offer: dueling settlement offers in the Crypto Class Action law suit in Australia","itemID":24015005951,"episode_guid":"/@brianoflondon/srjsthqr","ts":59,"speed":"1","action":"stream","app_name":"CurioCaster","value_msat_total":22000,"url":"https://3speak.tv/rss/brianoflondon.xml","sender_name":"Sir Brian of London","sender_id":"brianoflondon@getalby.com","reply_address":"030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3","reply_custom_key":696969,"reply_custom_value":"rxZduA9gl4wN22QRIodB","value_msat":22000,"name":"Dr Brian of London ✅"}',
      },
    });
    console.log(resp);
    albyPayment.value = resp.data;
  } catch (error) {
    console.log(error);
  }
}
</script>

<style lang="scss" scoped></style>
