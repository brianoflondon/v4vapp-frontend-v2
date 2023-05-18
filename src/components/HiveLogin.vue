<template>
  <q-card>
    <q-list>
      <q-item-label class="text-left q-pa-sm">{{
        $t("login_as")
      }}</q-item-label>
      <q-item class="fill-item">
        <HiveSelectAcc
          dense
          :label="props.label"
          @updateValue="
            (value) => {
              hiveAccname = value
            }
          "
        />
      </q-item>
      <q-item dense>
        <q-btn
          :disable="hiveAccname === '' || hiveAccname === null || !isKeychain"
          flat
          :label="t('hive_keychain')"
          icon="img:keychain/hive-keychain-round.svg"
          @click="login(hiveAccname)"
        />
        <q-tooltip v-if="!hiveAccname && isKeychain">{{
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
 * @prop
 * @emits {string} hiveAccname - Emitted value of selected Hive Account
 * @emits {boolean} loggedIn - Emitted True if a login is successful, False if
 *                           login is unsuccessful or hiveAccname is empty
 */

import { ref, watch, onMounted, computed } from "vue"
import HiveSelectAcc from "components/HiveSelectAcc.vue"
import {
  useHiveKeychainLogin,
  useHiveAvatarURL,
  useIsHiveKeychainInstalled,
} from "src/use/useHive"
import { useBip39 } from "src/use/useBip39"
import { useI18n } from "vue-i18n"
import { useQuasar, Platform } from "quasar"

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
const emit = defineEmits(["hiveAccname", "loggedIn"])

const t = useI18n().t
const q = useQuasar()

const hiveAccname = ref("")

watch(hiveAccname, async (newValue, oldValue) => {
  // Watches the model which holds the selected value
  isKeychain.value = await useIsHiveKeychainInstalled()
  if (!hiveAccname.value) {
    emit("loggedIn", false)
  }
  if (oldValue !== newValue) {
    emit("loggedIn", false)
  }
  emit("hiveAccname", newValue)
})

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
  console.log("avatarUrl: ", avatarUrl)
  try {
    const notif = q.notify({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      avatar: avatarUrl,
      message: t("login_in_progress"),
      caption: `${t("sign_this")}: ${signMessage}`,
      position: position,
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
      notif({
        icon: "done", // we add an icon
        html: true,
        spinner: false, // we reset the spinner setting so the icon can be displayed
        multiLine: true,
        message: `${t("login_success")}`,
        caption: `${result?.data?.message} <br> ${t(
          "matches"
        )} <br> ${signMessage}`,
        timeout: 1500,
      })
      emit("hiveAccname", hiveAccname.value)
      emit("loggedIn", true)
    } else if (!result.success) {
      console.log(result.message)
      notif({
        icon: "cancel", // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: t("login_failed"),
        caption: `${result?.message}`,
        timeout: 1500,
      })
    }
  } catch (error) {
    console.log("error: ", error)
    notif({
      icon: "cancel", // we add an icon
      spinner: false, // we reset the spinner setting so the icon can be displayed
      message: `${error}`,
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
