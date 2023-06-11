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
      <q-item dense>
        <q-btn
          :disable="hiveAccObj === '' || hiveAccObj === null"
          flat
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
    </q-list>
  </q-card>

  <div></div>
</template>

<script setup>
/**
 * HiveLogin
 * Checks for Valid ability to sign a message with Hive Key.
 *
 * PROPS
 * hiveAccObj: Object - Object with Hive Account Name and Avatar URL
 * label: String - Label for the HiveSelectFancyAcc
 *
 */

import { ref, onMounted } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import {
  useHiveKeychainLogin,
  useHiveAvatarURL,
  useIsHiveKeychainInstalled,
} from "src/use/useHive"
import { useBip39 } from "src/use/useBip39"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"

const hiveAccObj = defineModel()

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
})

const t = useI18n().t
const q = useQuasar()

onMounted(async () => {
  isKeychain.value = await useIsHiveKeychainInstalled()
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function login(username) {
  isKeychain.value = await useIsHiveKeychainInstalled()
  if (!isKeychain.value) {
    q.notify({
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
    const note = q.notify({
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
      keyType: "Posting",
    })
    if (result.success && result?.data?.message == signMessage) {
      console.log("result message", result.data.message)
      console.log("result", result)
      hiveAccObj.value["loggedIn"] = true
      console.log("hiveAccObj", hiveAccObj)
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
    console.log("error: ", error)
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
