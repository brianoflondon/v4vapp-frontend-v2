<template>
  <q-card>
    <q-list>
      <q-item-label class="text-left q-pa-sm">{{
        $t("login_as")
      }}</q-item-label>
      <q-item class="fill-item">
        <HiveSelectAcc
          dense
          :label="label"
          @updateValue="
            (value) => {
              hiveAccname = value
            }
          "
        />
      </q-item>
      <q-item
        dense
        v-if="
          hiveAccname !== '' && hiveAccname !== null && !$q.platform.is.electron
        "
      >
        <q-btn
          flat
          label="Hive-Keychain"
          icon="img:keychain/hive-keychain-round.svg"
          @click="login(hiveAccname)"
        />
      </q-item>
    </q-list>
  </q-card>

  <div></div>
</template>

<script setup>
import { ref } from "vue"
import HiveSelectAcc from "components/HiveSelectAcc.vue"
import { useHiveKeychainLogin } from "src/use/useHive"
import { useBip39 } from "src/use/useBip39"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"

const t = useI18n().t
const q = useQuasar()

const hiveAccname = ref("")
const label = ref("Hive Account")

async function login(username) {
  const words = await useBip39(3)
  const signMessage = words.join("-")
  try {
    const notif = q.notify({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      spinner: true,
      message: t("login_in_progress"),
      caption: `${t("sign_this")}: ${signMessage}`,
      position: "left",
    })
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
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: t("login_success"),
        caption: `${result?.data?.message} ${t("matches")} ${signMessage}`,
        timeout: 1500,
      })
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
      icon: "fail", // we add an icon
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
