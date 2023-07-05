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
        <q-card-section v-if="storeUser.currentUser">
          <p>
            Logged in as: <strong>@{{ storeUser.currentUser }}</strong>
          </p>
          <p>Please open your HAS app and authorize the transaction.</p>
        </q-card-section>
        <q-card-section v-if="expiry > 0">
          <CountdownBar :expiry="expiry" />
        </q-card-section>
        <q-card-section align="right">
          <q-btn
            rounded
            :label="$t('resend_transaction')"
            @click="startHASProcess()"
          />
        </q-card-section>
        <q-card-section v-if="!storeUser.currentUser">
          <HiveSelectFancyAcc
            dense
            :label="$t('login_as')"
            v-model="hiveAccObj"
            :maxOptions="5"
            fancyOptions
          />
        </q-card-section>
        <q-card-section v-if="qrCodeTextHAS">
          <CreateHASQRCode
            :qrText="qrCodeTextHAS"
            :width="200"
            @message="(val) => (expiryMessage = val)"
          />
          {{ expiryMessage }}
        </q-card-section>
        <pre>
          {{ resolvedHAS }}
        </pre>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { useHAS, useHASTransfer } from "src/use/useHAS"
import { useStoreUser } from "src/stores/storeUser"
import CountdownBar from "../utils/CountdownBar.vue"
import CreateHASQRCode from "components/qrcode/CreateHASQRCode.vue"

const storeUser = useStoreUser()
const hiveAccObj = ref(null)
const HASDialog = defineModel(null)
const expiryMessage = ref("")

const { qrCodeTextHAS, expiry, resolvedHAS } = useHAS()

async function startHASProcess() {
  console.log("startHASProcess")
  if (!HASDialog.value?.payment.username) {
    console.log("startHASProcess: HASDialog no username")
    console.log("hiveAccObj", hiveAccObj.value)
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
      return
    }
  }

  const result = await useHASTransfer(
    HASDialog.value.payment.username,
    HASDialog.value.payment.amount,
    HASDialog.value.payment.currency,
    HASDialog.value.payment.memo
  )
  console.log("startHASProcess: result", result)
  if (result) {
    HASDialog.value.result = result
  }
}
</script>

<style lang="scss" scoped></style>
