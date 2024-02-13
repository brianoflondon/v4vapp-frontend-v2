<template>
  <div>
    <q-dialog v-model="HASDialog.show" @show="startHASProcess">
      <q-card>
        <q-toolbar class="has-dialog-toolbar">
          <q-avatar>
            <img src="/has/hive-auth-logo.svg" />
          </q-avatar>
          <q-toolbar-title align="center">
            <span class="text-weight-bold">HAS</span>
            Hive Authentication Service
          </q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section v-if="HASDialog?.payment?.username">
          <p>
            {{ $t("logged_in_as") }}:
            <strong>@{{ storeUser.currentUser }}</strong>
          </p>
          <p>{{ $t("open_HAS_auth") }}</p>
        </q-card-section>
        <q-card-section v-if="expiry > 0" align="center">
          <CountdownBar :expiry="expiry" />
        </q-card-section>
        <q-card-section v-if="!HASDialog?.payment?.username" align="center">
          <p>{{ $t("which_account") }}</p>
          <HiveSelectFancyAcc
            dense
            :label="$t('login_as')"
            v-model="hiveAccObj"
            :maxOptions="5"
            fancyOptions
          />
        </q-card-section>
        <q-card-section v-if="qrCodeTextHAS" align="center">
          <CreateHASQRCode
            :qrText="qrCodeTextHAS"
            :width="200"
            @message="(val) => (expiryMessage = val)"
          />
          {{ expiryMessage }}
        </q-card-section>
        <q-card-section align="center">
          <q-btn
            rounded
            :label="$t('resend_transaction')"
            @click="startHASProcess()"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { useHAS, useHASTransfer } from "src/use/useHAS"
import { useStoreUser } from "src/stores/storeUser"
import CountdownBar from "../utils/CountdownBar.vue"
import CreateHASQRCode from "components/qrcode/CreateHASQRCode.vue"

const storeUser = useStoreUser()
const hiveAccObj = ref(null)
const HASDialog = defineModel()
const expiryMessage = ref("")

const { qrCodeTextHAS, expiry, resolvedHAS } = useHAS()

onMounted(async () => {
  await checkUser()
  console.log("mounted HASDialog")
})

watch(
  () => resolvedHAS.value,
  (val) => {
    console.log("watch HASDialog", val)
    HASDialog.value["resolvedHAS"] = val
    if (val.cmd === "sign_ack") {
      HASDialog.value.show = false
    }
  }
)

async function checkUser() {
  if (!HASDialog.value?.payment?.username) {
    if (hiveAccObj.value?.value) {
      console.log("startHASProcess: has user", hiveAccObj.value.value)
      HASDialog.value.payment.username = hiveAccObj.value.value
      // Now check if we have an active HAS session.
      const activeUser = storeUser.getUser(HASDialog.value.payment.username)
      if (!activeUser) {
        console.log("startHASProcess: no active HAS session")
        console.log("logging in process needed")
      }
    } else {
      console.log("startHASProcess: no user")
      if (storeUser?.user?.authKey) {
        HASDialog.value.payment.username = storeUser.hiveAccname
        hiveAccObj.value.value = storeUser.hiveAccname
      }
      return
    }
  }
}

async function startHASProcess() {
  await checkUser()
  if (!HASDialog.value?.payment?.username) {
    return
  }
  await useHASTransfer(
    HASDialog.value.payment.username,
    HASDialog.value.payment.amount,
    HASDialog.value.payment.currency,
    HASDialog.value.payment.memo
  )
}
</script>

<style lang="scss" scoped></style>
