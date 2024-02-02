<template>
  <q-card>
    <q-list>
      <div class="text-center">
        <q-btn
          dense
          flat
          icon="perm_identity"
          label="testing"
          @click="loginApiKeychain(hiveAccObj?.value)"
        />
      </div>
      <q-expansion-item
        expand-separator
        icon="perm_identity"
        :label="$t('login_as')"
      >
        <q-item>
          <HiveSelectFancyAcc
            dense
            :label="props.label"
            v-model="hiveAccObj"
            fancyOptions
          />
        </q-item>
        <q-item-label class="text-left q-pa-sm">
          {{ $t("login_with") }}:
        </q-item-label>
        <q-item dense class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="
              typeof hiveAccObj === 'undefined' ||
              hiveAccObj === '' ||
              hiveAccObj === null
            "
            align="left"
            rounded
            :label="t('hive_keychain')"
            icon="img:/keychain/hive-keychain-round.svg"
            @click="loginKeychain(hiveAccObj?.value)"
          />
          <q-tooltip v-if="!hiveAccObj && isKeychain">{{
            t("enter_hive_account")
          }}</q-tooltip>
          <q-tooltip v-if="!isKeychain">{{
            t("keychain_not_installed")
          }}</q-tooltip>
        </q-item>
        <q-item class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="
              typeof hiveAccObj === 'undefined' ||
              hiveAccObj === '' ||
              hiveAccObj === null
            "
            label="HAS"
            align="left"
            rounded
            icon="img:/has/hive-auth-logo.svg"
            @click="loginHAS(hiveAccObj?.value)"
          ></q-btn>
        </q-item>
        <q-item class="justify-center" clickable v-if="displayQRCode">
          <div class="flex column text-center justify-center">
            <div class="row text-center justify-center">
              <CreateHASQRCode
                :qrText="qrCodeTextHAS"
                :width="200"
                :height="200"
              />
            </div>
            <div class="row">
              <CountdownBar
                :expiry="expiry"
                :width="200"
                @message="(val) => (timeMessage = val)"
              />
            </div>
            <div class="row">
              <q-item-label caption
                >@{{ hiveAccObj?.value }} {{ t("expires") }}
                {{ timeMessage }}</q-item-label
              >
            </div>
          </div>
        </q-item>
        <q-item class="flex justify-center">
          <div class="text-center q-pa-md">
            <q-btn rounded @click="storeUser.logout()" label="Logout" />
          </div>
          <div class="text-center q-pa-md">
            <q-btn rounded @click="storeUser.logoutAll()" label="Logout All" />
          </div>
        </q-item>
      </q-expansion-item>
    </q-list>
  </q-card>

  <div></div>
</template>

<style lang="scss" scoped></style>

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
import { apiLogin, api } from "src/boot/axios"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import {
  useGetApiKeychainChallenge,
  useHiveKeychainLogin,
  useIsHiveKeychainInstalled,
  useValidateApi,
} from "src/use/useKeychain"
import { useHAS, HASLogin } from "src/use/useHAS"
import { useBip39 } from "src/use/useBip39"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import CreateHASQRCode from "src/components/qrcode/CreateHASQRCode.vue"
import CountdownBar from "src/components/utils/CountdownBar.vue"

const storeUser = useStoreUser()
const hiveAccObj = defineModel()

const displayQRCode = ref(false)
const timeMessage = ref()

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

const { qrCodeTextHAS, expiry, resolvedHAS } = useHAS()

async function loginHAS(username) {
  let position = "left"
  if (Platform.is.mobile) {
    position = "top"
  }
  try {
    if (!username) {
      quasar.notify({
        timeout: 2000,
        avatar: useHiveAvatarURL({ hiveAccname: username }),
        color: "info",
        message: t("enter_hive_account"),
        position: position,
      })
      return
    }
    await HASLogin(username)
  } catch (error) {
    console.log("error: ", error)
  }
}

watch(qrCodeTextHAS, (newValue) => {
  console.log("qrCodeTextHAS newValue: ", newValue)
  if (!newValue) {
    displayQRCode.value = false
    return
  }
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

async function loginKeychain(username) {
  if (adminCheck()) {
    storeUser.login(username, props.keyType)
    return
  }
  const avatarUrl = useHiveAvatarURL({ hiveAccname: username })
  isKeychain.value = await useIsHiveKeychainInstalled()
  let position = "left"
  if (Platform.is.mobile) {
    position = "top"
  }
  if (!isKeychain.value) {
    quasar.notify({
      timeout: 2000,
      avatar: avatarUrl,
      color: "warning",
      message: t("keychain_not_installed"),
      position: position,
    })
    return
  }
  if (!username) {
    quasar.notify({
      timeout: 2000,
      avatar: avatarUrl,
      color: "info",
      message: t("enter_hive_account"),
      position: position,
    })
    return
  }
  const words = await useBip39(3)
  const signMessage = words.join("-")
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

async function loginApiKeychain(username) {
  console.log("loginApiKeychain")
  try {
    const clientId = useStoreUser().clientId
    console.log("clientId: ", clientId)
    const challenge = await useGetApiKeychainChallenge(username, clientId)
    console.log(challenge)
    const signedMessage = await useHiveKeychainLogin({
      hiveAccname: username,
      message: challenge.data.challenge,
      keyType: props.keyType,
    })
    console.log("signedMessage: ", signedMessage)
    const validate = await useValidateApi(clientId, signedMessage)
    console.log("validate: ", validate)
    // need to store this token in the storeUser store
    hiveAccObj.value["loggedIn"] = true
    storeUser.login(
      username,
      props.keyType,
      null,
      null,
      null,
      validate.data.access_token
    )
    apiLogin.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${validate.data.access_token}`
    console.log("apiLogin.defaults: ", apiLogin.defaults.headers.common)
    const check = await apiLogin.get("/users/all/")
    console.log("check: ", check)
  } catch (error) {
    console.log("error: ", error)
  }
}
</script>
