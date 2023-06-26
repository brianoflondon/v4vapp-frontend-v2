<template>
  <q-page>
    <q-card
      rounded
      class="outer-wrapper row justify-center q-gutter-sm q-pt-lg"
    >
      <q-card-section>
        <HiveSelectFancyAcc dense v-model="hiveAccObj" fancy-options />
      </q-card-section>
      <q-card-section>
        <q-btn-toggle
          v-model="hiveHbd"
          push
          glossy
          toggle-color="primary"
          :options="[
            { label: 'HBD', value: 'hbd' },
            { label: 'Hive', value: 'hive' },
          ]"
        />
      </q-card-section>
      <q-card-section>
        <QRStylingCreateQRCode
          :qr-text="qrText"
          :hive-accname="hiveAccObj.value"
        />
      </q-card-section>
      <q-card-section>
        <q-btn
          :label="amountButton"
          name="amount"
          rounded
          color="primary"
          text-color="black"
          @click="setAmount"
        >
          <q-tooltip>{{ $t("amount") }}</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
    <AskDetailsDialog
      v-model="dInvoice"
      @amounts="(val) => receiveAmounts(val)"
      @newInvoice="(val) => receiveNewInvoice(val)"
    />
  </q-page>
</template>

<script setup>
import QRStylingCreateQRCode from "components/qrcode/QRStylingCreateQRCode.vue"
import { computed, onMounted, ref, watch } from "vue"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import {
  useDecodeLightningInvoice,
  useGetTimeProgress,
} from "src/use/useLightningInvoice"

const dInvoice = ref({})
const amounts = ref({})
const storeUser = useStoreUser()
const amountButton = ref("")
const hiveHbd = ref("hbd")
const hiveAccObj = ref({ label: "", value: "", caption: "" })
const t = useI18n().t
const quasar = useQuasar()

const qrText = ref("")

onMounted(() => {
  if (storeUser.currentUser) {
    hiveAccObj.value = {
      label: storeUser.hiveAccname,
      value: storeUser.hiveAccname,
      caption: storeUser.profileName,
    }
  }
  resetValues()
})

watch(storeUser, async (val) => {
  console.log("storeUser", val.currentUser)
  hiveAccObj.value = {
    label: val.hiveAccname,
    value: val.hiveAccname,
    caption: val.profileName,
  }
  resetValues()
})

watch(hiveAccObj, async (val) => {
  resetValues()
})

watch(hiveHbd, async (val) => {
  resetValues()
})

function resetValues() {
  setLightningAddress()
  setAmountButton()
}

function setLightningAddress() {
  if (!hiveAccObj.value.value) {
    qrText.value = "lightning:v4vapp@v4v.app"
  }
  qrText.value = "lightning:" + getHiveHbdAddress(hiveAccObj.value.value)
}

function setAmountButton() {
  if (amounts.value?.sats) {
    amountButton.value = amounts.value.sats + " sats"
  } else {
    amountButton.value = t("amount")
  }
}

function getHiveHbdAddress(username) {
  if (hiveHbd.value === "hbd") {
    return username + `@hbd.v4v.app`
  } else {
    return username + `@v4v.app`
  }
}

async function setAmount() {
  if (!hiveAccObj.value.value) {
    quasar.notify("Please select an account", {
      color: "negative",
      position: "top",
      timeout: 2000,
    })
    return
  }
  if (dInvoice.value) {
    dInvoice.value = {}
    setLightningAddress()
  }
  try {
    dInvoice.value = await useDecodeLightningInvoice(qrText.value)
    console.log("dInvoice.value", dInvoice.value)
    dInvoice.value.makingInvoice = true
    dInvoice.value.hiveHbd = hiveHbd.value
    dInvoice.value.askDetails = true
  } catch (e) {
    console.log("e", e)
  }
}

async function receiveNewInvoice(val) {
  console.log("receiveNewInvoice", val)
  qrText.value = "lightning:" + val.pr
}

async function receiveAmounts(val) {
  console.log("receiveAmounts", val)
  amounts.value = val
  setAmountButton()
}
</script>

<style lang="scss" scoped></style>
