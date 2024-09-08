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
            :disable="keychainButtonDisabled"
            align="left"
            rounded
            :color="keychainButtonDisabled ? 'grey-9' : 'primary'"
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
            :disable="hasButtonDisabled"
            label="HAS"
            align="left"
            :color="hasButtonDisabled ? 'grey-9' : 'primary'"
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
            :color="nostrButtonDisabled ? 'grey-9' : 'primary'"
            rounded
            icon="fa-brands fa-ethereum"
            @click="useEVMLoginFlow"
          ></q-btn>
        </q-item>
        <!-- Nostr Button -->
        <q-item class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="false"
            :label="nostrAddressLabel"
            align="left"
            :color="nostrButtonDisabled ? 'grey-9' : 'primary'"
            rounded
            icon="img:/avatars/login-icons/nostr_logo_prpl_wht_rnd.svg"
            @click="connectNostr"
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

import { ref, watch, onMounted, onBeforeMount, computed } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import HiveInputAcc from "components/HiveInputAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import { useGetChallenge, useValidateApi } from "src/use/useUtils"
import { useShortEVMAddress } from "src/use/useEVM"
import {
  useIsHiveKeychainInstalled,
  useKeychainLoginFlow,
} from "src/use/useKeychain"
import { useHAS, useHASLogin, useIsHASAvailable } from "src/use/useHAS"
import { useEVMLoginFlow } from "src/use/useEVM"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"
import CreateHASQRCode from "src/components/qrcode/CreateHASQRCode.vue"
import CountdownBar from "src/components/utils/CountdownBar.vue"

const storeUser = useStoreUser()
const hiveAccObj = defineModel()

const displayQRCode = ref(false)
const timeMessage = ref()

const t = useI18n().t
const quasar = useQuasar()

const isHAS = ref(true)
const isKeychain = ref(true)
const evmButtonDisabled = ref(true)
const nostrButtonDisabled = ref(true)

onBeforeMount(async () => {
  console.debug("onBeforeMount HiveLogin")
  nostrButtonDisabled.value = await nostrButtonCheckDisabled()
  evmButtonDisabled.value = await evmButtonCheckDisabled()
})

onMounted(async () => {
  console.debug("onMounted HiveLogin")
  isKeychain.value = await useIsHiveKeychainInstalled()
  isHAS.value = await useIsHASAvailable()
  console.log("nostrButtonDisabled: ", nostrButtonDisabled.value)
  console.log("evmButtonDisabled: ", evmButtonDisabled.value)
})

const keychainButtonDisabled = computed(() => {
  return (
    typeof hiveAccObj.value === "undefined" ||
    hiveAccObj.value.value === "" ||
    hiveAccObj.value.value === null ||
    isKeychain.value === false
  )
})

const hasButtonDisabled = computed(() => {
  return (
    typeof hiveAccObj.value === "undefined" ||
    hiveAccObj.value.value === "" ||
    hiveAccObj.value.value === null
  )
})

async function nostrButtonCheckDisabled() {
  if (typeof window.nostr !== "undefined") {
    console.log("Nostr wallet found")
    return false
  }
  return true
}

const nostrAddressLabel = ref("Nostr Login")

async function connectNostr() {
  if (typeof window.nostr !== "undefined") {
    try {
      const nostrPubkey = await window.nostr.getPublicKey() // returns a public key as hex
      console.log("nostrPubkey: ", nostrPubkey)
      // Create an event object
      const event = {
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // Kind 1 is a text note in Nostr
        tags: [],
        content: "This is the text to be signed",
      }

      // Sign the event
      const signedEvent = await window.nostr.signEvent(event)
      console.log("Signed event: ", signedEvent)
    } catch (error) {
      console.error("Error connecting to Nostr", error)
    }
  } else {
    console.log("No Nostr wallet found")
  }
}

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

async function evmButtonCheckDisabled() {
  if (typeof window.ethereum !== "undefined") {
    console.log("EVM wallet found")
    return false
  }
  return true
}

/**
 * Connects to the EVM.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 */
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
