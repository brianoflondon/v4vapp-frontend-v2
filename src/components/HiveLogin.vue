<template>
  <q-card>
    <q-list>
      <q-item-label class="text-left q-pa-sm">{{
        $t("login_as")
      }}</q-item-label>
      <q-item>
        <HiveSelectFancyAcc
          dense
          :label="props.label"
          v-model="hiveAccObj"
          fancyOptions
        />
      </q-item>
      <q-item>{{ $t("login_with") }}:</q-item>
      <q-item dense>
        <q-btn
          :disable="
            typeof hiveAccObj === 'undefined' ||
            hiveAccObj === '' ||
            hiveAccObj === null
          "
          rounded
          :label="t('hive_keychain')"
          icon="img:keychain/hive-keychain-round.svg"
          @click="login(hiveAccObj?.value)"
        />
        <q-tooltip v-if="!hiveAccObj && isKeychain">{{
          t("enter_hive_account")
        }}</q-tooltip>
        <q-tooltip v-if="!isKeychain">{{
          t("keychain_not_installed")
        }}</q-tooltip>
      </q-item>
      <q-item>
        <q-btn label="HAS" rounded @click="loginHAS(hiveAccObj?.value)"></q-btn>
      </q-item>
      <div v-if="displayQRCode" class="flex justify-center">
        <div>
          <CreateQRCode :qrText="qrCodeText" :width="200" :height="200" />
          {{ expiry - Date.now() }}
        </div>
      </div>
    </q-list>
    <div class="flex justify-center">
      <div class="text-center q-pa-md">
        <q-btn rounded @click="storeUser.logout()" label="Logout" />
      </div>
      <div class="text-center q-pa-md">
        <q-btn rounded @click="storeUser.logoutAll()" label="Logout All" />
      </div>
    </div>
  </q-card>

  <div></div>
</template>

<script setup>
/**
 * HiveLogin
 * Checks for Valid ability to sign a message with Hive Key.
 *
 * PROPS
 * hiveAccObj: string - Object with Hive Account Name
 * keyType
 * label: String - Label for the HiveSelectFancyAcc
 *
 */

import { ref, watch, onMounted } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import {
  useHiveKeychainLogin,
  useHiveAvatarURL,
  useIsHiveKeychainInstalled,
} from "src/use/useHive"
import { useHAS, HASLogin } from "src/use/useHAS"
import { useBip39 } from "src/use/useBip39"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"

const storeUser = useStoreUser()
const hiveAccObj = defineModel({})

const displayQRCode = ref(false)

if (Platform.is.mobile) {
  console.log("Running on a mobile device")
} else {
  console.log("Not running on a mobile device")
}
const isKeychain = ref(false)

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  keyType: {
    type: String,
    default: "Posting",
  },
})

const t = useI18n().t
const quasar = useQuasar()

const { qrCodeText, expiry } = useHAS()

async function loginHAS(username = "brianoflondon") {
  try {
    await HASLogin(username)
  } catch (error) {
    console.log("error: ", error)
  }
}

watch(qrCodeText, (newValue) => {
  if (newValue === null) {
    displayQRCode.value = false
    return
  }
  console.log("newValue: ", newValue)
  displayQRCode.value = true
})

onMounted(async () => {
  isKeychain.value = await useIsHiveKeychainInstalled()
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Review this later
// TODO: #46 Review this later
function adminCheck() {
  console.log("storeUser.currentUser: ", storeUser.currentUser)
  if (storeUser.currentUser === "brianoflondon") {
    return true
  }
  return false
}

async function login(username) {
  if (adminCheck()) {
    storeUser.login(username, props.keyType)
    return
  }
  isKeychain.value = await useIsHiveKeychainInstalled()
  if (!isKeychain.value) {
    quasar.notify({
      timeout: 2000,
      message: t("keychain_not_installed"),
      position: position,
    })
    return
  }
  let position = "left"
  if (Platform.is.mobile) {
    position = "top"
  }
  const words = await useBip39(3)
  const signMessage = words.join("-")
  const avatarUrl = useHiveAvatarURL({ hiveAccname: username })
  try {
    const note = quasar.notify({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      avatar: avatarUrl,
      message: `${t("login_in_progress")}: @${username}`,
      caption: `${t("sign_this")}: ${signMessage}`,
      position: position,
      color: "info",
    })
    await delay(300)
    const result = await useHiveKeychainLogin({
      hiveAccname: username,
      message: signMessage,
      keyType: props.keyType,
    })
    if (result.success && result?.data?.message == signMessage) {
      hiveAccObj.value["loggedIn"] = true
      storeUser.login(username, props.keyType)
      note({
        icon: "done", // we add an icon
        avatar: avatarUrl,
        html: true,
        spinner: false, // we reset the spinner setting so the icon can be displayed
        multiLine: true,
        message: `${t("login_success")}`,
        caption: `${result?.data?.message} <br> ${t(
          "matches"
        )} <br> ${signMessage}`,
        color: "positive",
        timeout: 1500,
      })
    } else if (!result.success) {
      hiveAccObj.value["loggedIn"] = false
      note({
        icon: "cancel", // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: t("login_failed"),
        caption: `${result?.message}`,
        color: "negative",
        timeout: 1500,
      })
    }
  } catch (error) {
    hiveAccObj.value["loggedIn"] = false
    console.error("error: ", error)
    note({
      icon: "cancel", // we add an icon
      spinner: false, // we reset the spinner setting so the icon can be displayed
      message: `${error}`,
      color: "negative",
      timeout: 1500,
    })
  }
}
</script>

<style lang="scss" scoped>
.fill-item {
  flex: 1;
}
</style>
