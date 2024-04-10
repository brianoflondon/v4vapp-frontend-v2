<template>
  <q-card>
    <q-list>
      <q-expansion-item expand-separator icon="key" label="Passkey">
        <!-- Hive Account name input -->
        <q-item>
          <HiveInputAcc v-model="hiveAccObj" :prefix="t('pay_to')">
          </HiveInputAcc>
        </q-item>
        <q-item>
          <q-btn
            :disable="numCredentials === 0"
            rounded
            label="Passkey Login"
            @click="doPasskeyLogin"
          />
          <q-btn
            :disable="!storeUser.currentUser"
            rounded
            label="Passkey Manage"
            @click="doPasskeyManage"
          />
        </q-item>
        <!-- End Hive Account name input -->
      </q-expansion-item>
    </q-list>
  </q-card>
  <!-- Passkey manage and register dialog -->
  <q-dialog v-model="showDialog">
    <q-card>
      <q-toolbar>
        <q-toolbar-title>Passkey Management</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="showDialog = false" />
      </q-toolbar>
      <q-card-section>
        <p>Register a new passkey</p>
        <q-input
          v-model="passkeyName"
          label="Device Name"
          :error="showError"
          error-message="Device Name is required"
        />
        <q-btn
          :disable="!passkeyName"
          rounded
          label="Register"
          @click="doPasskeyRegister"
        />
      </q-card-section>
      <q-card-section>
        <p>Passkeys for user: {{ storeUser.currentUser }}</p>
        <!-- List of passkeys -->
        <q-item v-if="numCredentials > 0">
          <q-list>
            <q-item-section>
              <q-item
                clickable
                caption
                v-for="cred in listCredentials"
                :key="cred._id"
                @click="doManageKey(cred)"
              >
                {{ cred.device_name }}
              </q-item>
            </q-item-section>
          </q-list>
        </q-item>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue"
import {
  useListCredentials,
  useNumCredentials,
  usePasskeyLogin,
  usePasskeyRegister,
} from "src/use/usePasskeys"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import HiveInputAcc from "components/HiveInputAcc.vue"
import ConfettiExplosion from "vue-confetti-explosion"

const storeUser = useStoreUser()
const t = useI18n().t

const showDialog = ref(false)
const hiveAccObj = defineModel()

const passkeyName = ref("")
const showError = ref(false)
const listCredentials = ref()
const numCredentials = ref(0)

/**
 * ConfettiExplosion component
 */
const visible = ref(false)
async function explode() {
  visible.value = false
  await nextTick()
  visible.value = true
}

onMounted(async () => {
  numCredentials.value = await useNumCredentials(hiveAccObj.value.value)
  // listCredentials.value = await useListCredentials()
})

watch(hiveAccObj, async (val) => {
  console.log("val", val)
  if (val.value) {
    await updatePasskeyList()
  } else {
    listCredentials.value = []
  }
})

async function updatePasskeyList() {
  numCredentials.value = await useNumCredentials(hiveAccObj.value.value)
  console.log("numCredentials", numCredentials.value)
  console.log("storeUser.currentUser", storeUser.currentUser)
  console.log("hiveAccObj.value.value", hiveAccObj.value.value)
  if (
    storeUser.currentUser === hiveAccObj.value.value &&
    storeUser.currentUser &&
    numCredentials.value > 0
  ) {
    listCredentials.value = await useListCredentials()
  } else {
    listCredentials.value = []
  }
}

async function doPasskeyLogin() {
  console.log("doPasskeyLogin")
  const result = await usePasskeyLogin(hiveAccObj.value.value)
  if (result.success) {
    let expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + 7)
    await storeUser.login(
      hiveAccObj.value.value,
      "posting",
      "webauthn",
      expireDate,
      null,
      result.token
    )
  } else {
    console.log("doPasskeyLogin failed")
    console.log("result", result.message)
  }
}

async function doPasskeyManage() {
  console.log("doPasskeyManage")
  showDialog.value = true
  await updatePasskeyList()
}

async function doPasskeyRegister() {
  console.log("doPasskeyRegister")
  if (!passkeyName.value) {
    showError.value = true
    return
  }
  const result = await usePasskeyRegister(
    storeUser.currentUser,
    passkeyName.value
  )
  if (result.success) {
    await updatePasskeyList()
    passkeyName.value = ""
    explode()
  } else {
    console.log("doPasskeyRegister failed")
    console.log("result", result.message)
  }
}

async function doManageKey(cred) {
  console.log("doManageKey", cred)
  console.log("cred._id", cred._id)
  console.log("cred.device_name", cred.device_name)
}
</script>

<style lang="scss" scoped></style>
