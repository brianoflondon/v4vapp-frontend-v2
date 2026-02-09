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
        <q-btn label="Fetch" @click="fetchData"></q-btn>
      </div>
    </div>
    <div>
      <q-table
        :rows="data"
        row-key="trx_id"
        :visible-columns="['success', 'net_hive', 'sats', 'timestamp']"
      ></q-table>
    </div>
    <div v-if="data">
      <pre>{{ data }}</pre>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useUsernameFromRouteParam } from "src/use/useUtils.js";
import { useStoreUser } from "src/stores/storeUser";
import { apiLogin } from "boot/axios";
import { api } from "boot/axios";
import { useKeychainLoginFlow } from "src/use/useKeychain";
import UserList from "src/components/hive/UserList.vue";

const storeUser = useStoreUser();

const route = useRoute();
const routePage = ref("");
const hiveAccount = ref();
const data = ref();

const apiTokenValid = computed(() => {
  const user = storeUser.getUser(hiveAccount.value);
  if (user) {
    if (user.hasApiToken) {
      return true;
    }
  }
  return false;
});

onMounted(async () => {
  console.log("GetHive.vue onMounted");
  console.log("route", route);
  routePage.value = safeStringify(route);
  hiveAccount.value = useUsernameFromRouteParam(route.params.hiveAccTo);
  if (hiveAccount.value === "") {
    console.error("No Hive Account Name");
  } else {
    console.log("hiveAccount", hiveAccount.value);
    console.log("storeUser", storeUser);
    const user = storeUser.getUser(hiveAccount.value);
    if (user) {
      console.log("user", user);
      console.log("user.hasApiToken", user.hasApiToken);
      console.log("user.apiToken", user.apiToken);
      if (user.hasApiToken) {
        console.log("user.hasApiToken", user.hasApiToken);
        console.log("user.apiToken", user.apiToken);
        apiLogin.defaults.headers.common["Authorization"] =
          `Bearer ${user.apiToken}`;
        console.log("apiLogin.defaults: ", apiLogin.defaults.headers.common);
        await fetchData();
      }
    }
  }
});

async function fetchData() {
  console.log("fetchData");
  const user = storeUser.getUser(hiveAccount.value);
  let lookup = user.hiveAccname;
  if (user) {
    console.log("fetchData for user", user.hiveAccname);
    if (user.setApiToken()) {
      try {
        if (user.hiveAccname === "v4vapp.dev") {
          lookup = hiveAccount.value;
        }
        const params = {
          hiveAccname: lookup,
          age: 0,
        };
        const rawData = await apiLogin.get("/v1/hivetosats/", {
          params,
        });
        if (
          Array.isArray(rawData.data) &&
          rawData.data.length > 0 &&
          rawData.data[0].transactions
        ) {
          data.value = rawData.data[0].transactions;
        }
      } catch (error) {
        console.error("fetchData error", error);
      }
    } else {
      console.error("No API Token");
      await loginToApi();
    }
  }
}

async function loginToApi() {
  console.log("loginToApi");
  await loginApiKeychain(hiveAccount.value);
}

async function loginApiKeychain(username) {
  console.log("loginApiKeychain");
  let hiveAccObj = { value: username };
  const props = { keyType: "active" };
  await useKeychainLoginFlow(hiveAccObj, props);
  return;
}

function safeStringify(obj) {
  /**
   * Cache used to store data.
   */
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Duplicate reference found, discard key
        return;
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
}
</script>

<style lang="scss" scoped></style>
