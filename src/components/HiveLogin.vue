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
          <HiveInputAcc v-model="hiveAccObj" :prefix="t('pay_to')">
          </HiveInputAcc>
        </q-item>
        <!-- End Hive Account name input -->
        <!-- Login with buttons -->
        <!-- Hive Keychain Button -->
        <q-item dense class="justify-center">
          <q-btn
            style="width: 200px"
            :disable="
              typeof hiveAccObj === 'undefined' ||
              hiveAccObj?.value === '' ||
              hiveAccObj?.value === null ||
              isKeychain === false
            "
            align="left"
            rounded
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
            :disable="
              typeof hiveAccObj === 'undefined' ||
              hiveAccObj?.value === '' ||
              hiveAccObj?.value === null // ||
              // isHAS === false
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
import HiveInputAcc from "components/HiveInputAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import {
  useIsHiveKeychainInstalled,
  useKeychainLoginFlow,
} from "src/use/useKeychain"
import { useHAS, useHASLogin, useIsHASAvailable } from "src/use/useHAS"
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
  console.log("Running on a mobile device")
} else {
  console.log("Not running on a mobile device")
}

const isHAS = ref(true)
const isKeychain = ref(true)

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
    console.log("HAS Login answer: ", answer)
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
  console.log("onMounted HiveLogin")
  isKeychain.value = await useIsHiveKeychainInstalled()
  isHAS.value = await useIsHASAvailable()
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Review this later
// TODO: #46 Review this later
function adminCheck() {
  console.log("storeUser.currentUser: ", storeUser.currentUser)
  if (storeUser.currentUser === "brianoflondon") {
    return false
  }
  return false
}
</script>
