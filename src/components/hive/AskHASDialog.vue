<template>
  <div>
    <q-dialog v-model="HASDialog.show" @show="startHASProcess">
      <q-card>
        <q-toolbar>
          <q-avatar>
            <img src="/has/hive-auth-logo.svg" />
          </q-avatar>

          <q-toolbar-title align="center">
            <span class="text-weight-bold">HAS</span>
            Hive Authentication Service
          </q-toolbar-title>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-card-section>
          <q-btn :label="$t('resend_transaction')" @click="startHASProcess()" />
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
        <q-card-section>
          <CountdownBar :expiry="expiry" />
        </q-card-section>
        <q-card-section>
          <pre>
            {{ HASDialog }}
          </pre>
          <pre>
            {{ storeUser.currentUser }}
          </pre>
        </q-card-section>
        <q-card-section>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum
          repellendus sit voluptate voluptas eveniet porro. Rerum blanditiis
          perferendis totam, ea at omnis vel numquam exercitationem aut, natus
          minima, porro labore.
        </q-card-section>
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

const storeUser = useStoreUser()
const hiveAccObj = ref(null)
const HASDialog = defineModel(null)

const { qrCodeTextHAS, expiry } = useHAS()

async function startHASProcess() {
  console.log("startHASProcess")
  if (!HASDialog.value.payment.username) {
    console.log("startHASProcess: no user")
    return
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
