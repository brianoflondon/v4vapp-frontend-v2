<template>
  <q-card class="q-pb-sm">
    <q-list>
      <q-expansion-item
        expand-separator
        icon="perm_identity"
        :label="$t('login_as')"
      >
        <!-- Hive Account name input -->
        <q-item>
          <HiveInputAcc v-model="hiveAccObj" :prefix="t('login')">
          </HiveInputAcc>
        </q-item>
        <!-- End Hive Account name input -->
        <!-- Login with buttons -->
        <!-- Hive Keychain Button -->
        <q-item dense class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="keychainButtonEnabled"
            align="left"
            rounded
            :color="keychainButtonEnabled ? 'grey-9' : 'primary'"
            :label="t('hive_keychain')"
            icon="img:/keychain/hive-keychain-round.svg"
            @click="useKeychainLoginFlow(hiveAccObj, props)"
          />
          <q-tooltip v-if="!hiveAccObj && isKeychain">{{
            t("enter_hive_account")
          }}</q-tooltip>
          <q-tooltip v-if="!isKeychain">{{
            t("keychain_not_installed")
          }}</q-tooltip>
        </q-item>
        <!-- HAS Button  -->
        <q-item class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="hasButtonEnabled"
            label="HAS"
            align="left"
            :color="hasButtonEnabled ? 'grey-9' : 'primary'"
            rounded
            icon="img:/has/hive-auth-logo.svg"
            @click="loginHAS(hiveAccObj?.value)"
          ></q-btn>
        </q-item>
        <!-- EVM Button -->
        <q-item class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="false"
            :label="evmAddressLabel"
            align="left"
            :color="hasButtonEnabled ? 'grey-9' : 'primary'"
            rounded
            icon="fa-brands fa-ethereum"
            @click="connectEVM"
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
      </q-expansion-item>
    </q-list>
  </q-card>
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

import { ref, watch, onMounted, computed } from "vue"
import HiveInputAcc from "components/HiveInputAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import { useGetChallenge, useShortEVMAddress } from "src/use/useUtils"
import {
  useIsHiveKeychainInstalled,
  useKeychainLoginFlow,
  useValidateApi,
} from "src/use/useKeychain"
import { useHAS, useHASLogin, useIsHASAvailable } from "src/use/useHAS"
import {} from "src/use/useEVM"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import CreateHASQRCode from "src/components/qrcode/CreateHASQRCode.vue"
import CountdownBar from "src/components/utils/CountdownBar.vue"

const storeUser = useStoreUser()
const hiveAccObj = defineModel()

const displayQRCode = ref(false)
const timeMessage = ref()

const t = useI18n().t
const quasar = useQuasar()

if (Platform.is.mobile) {
  console.debug("Running on a mobile device")
} else {
  console.debug("Not running on a mobile device")
}

const isHAS = ref(true)
const isKeychain = ref(true)

// :disable="
//   typeof hiveAccObj === 'undefined' ||
//   hiveAccObj?.value === '' ||
//   hiveAccObj?.value === null ||
//   isKeychain === false
// "

const keychainButtonEnabled = computed(() => {
  return (
    typeof hiveAccObj.value === "undefined" ||
    hiveAccObj.value.value === "" ||
    hiveAccObj.value.value === null ||
    isKeychain.value === false
  )
})

const hasButtonEnabled = computed(() => {
  return (
    typeof hiveAccObj.value === "undefined" ||
    hiveAccObj.value.value === "" ||
    hiveAccObj.value.value === null
  )
})

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  keyType: {
    type: String,
    default: "Active",
  },
})

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
    const answer = await useHASLogin(username)
    console.debug("HAS Login answer: ", answer)
  } catch (error) {
    console.debug("error: ", error)
  }
}

const evmConnected = ref("")
const evmAddressLabel = ref("EVM Login")

async function connectEVM() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      // request account Address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      if (accounts.length > 0) {
        evmConnected.value = accounts[0]
        evmAddressLabel.value = useShortEVMAddress(evmConnected.value)
        console.log("Wallet connected", accounts)
        console.log("evmConnected.value: ", evmConnected.value)
        const clientId = storeUser.clientId
        const challenge = await useGetChallenge(evmConnected.value, clientId)
        console.log("challenge: ", challenge)
        // now we have the challenge, we can sign it
        const signature = await signMessage(
          evmConnected.value,
          challenge.data.challenge
        )
        console.log("signature: ", signature)
        // now we can send the signature back to the server
        const signatureData = {
          success: true,
          result: signature,
          data: {
            username: evmConnected.value,
            message: challenge.data.challenge,
          },
          signature: signature,
          account: evmConnected.value,
        }
        console.log("signatureData: ", signatureData)
        try {
          const validate = await useValidateApi(clientId, signatureData)
          console.log("validate: ", validate)
          console.log("logging in with EVM")
          await storeUser.login(
            evmConnected.value,
            "EVM",
            null,
            validate.data?.expire * 1000,
            null,
            validate.data.access_token,
            "evm"
          )
          console.log("storeUser.currentUser: ", storeUser.currentUser)
        } catch (error) {
          console.error("Error validating signature: ", error)
        }
      }
    } catch (error) {
      console.error("User denied wallet connection", error)
    }
  } else {
    console.log("No Ethereum wallet found")
  }
}

async function signMessage(address, message) {
  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    })
    return signature
  } catch (error) {
    console.error("Error signing message:", error)
  }
}

watch(qrCodeTextHAS, (newValue) => {
  console.debug("qrCodeTextHAS newValue: ", newValue)
  if (!newValue) {
    displayQRCode.value = false
    return
  }
  displayQRCode.value = true
})

onMounted(async () => {
  console.debug("onMounted HiveLogin")
  isKeychain.value = await useIsHiveKeychainInstalled()
  isHAS.value = await useIsHASAvailable()
})

// Review this later
// TODO: #46 Review this later
function adminCheck() {
  console.debug("storeUser.currentUser: ", storeUser.currentUser)
  if (storeUser.currentUser === "brianoflondon") {
    return false
  }
  return false
}
</script>
