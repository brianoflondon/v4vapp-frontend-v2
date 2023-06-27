<template>
  <q-page>
    <q-card
      rounded
      class="outer-wrapper row justify-center q-gutter-sm q-pt-lg"
    >
      <div class="flex column text-center">
        <div class="flex row justify-center">
          <q-card-section>
            <HiveSelectFancyAcc dense v-model="hiveAccObj" fancy-options />
          </q-card-section>
          <q-card-section>
            <q-btn-toggle
              v-model="hiveHbd"
              push
              dense
              glossy
              toggle-color="primary"
              :options="[
                { label: 'HBD', value: 'hbd' },
                { label: 'Hive', value: 'hive' },
              ]"
            />
          </q-card-section>
        </div>
        <div class="flex row justify-center">
          <q-card-section>
            <CreateQRCode
              :qr-text="qrText"
              :loading="loading"
              :hive-accname="hiveAccObj.value"
              @qr-code="(val) => (qrCode = val)"
            />
            <div v-if="false" class="q-pt-none">
              <q-linear-progress
                class="invoice-timer"
                size="10px"
                :value="0.5"
                color="positive"
              >
              </q-linear-progress>
            </div>
          </q-card-section>
        </div>
      </div>
      <q-card-section class="q-pt-sm">
        <div
          class="action-buttons flex row text-center justify-center q-pt-sm q-gutter-sm"
        >
          <q-btn
            :label="amountButton"
            icon="attach_money"
            name="amount"
            rounded
            color="primary"
            @click="setAmount"
          >
            <q-tooltip>{{ $t("amount_to_send") }}</q-tooltip>
          </q-btn>
          <q-btn
            :label="$t('copy')"
            icon="content_copy"
            name="copy"
            rounded
            color="primary"
            @click="copyText"
          >
            <q-tooltip>{{ $t("copy_qrcode") }}</q-tooltip>
          </q-btn>
          <q-btn
            :label="$t('pay')"
            icon="payment"
            name="pay"
            rounded
            color="primary"
            :href="qrText"
          >
            <q-tooltip>{{ $t("pay_tooltip") }}</q-tooltip>
          </q-btn>
          <q-btn
            :label="$t('download')"
            icon="download"
            name="download"
            rounded
            color="primary"
            @click="downloadQRCode"
          >
            <q-tooltip>{{ $t("download_tooltip") }}</q-tooltip>
          </q-btn>
        </div>
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
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { onMounted, ref, watch } from "vue"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { useQuasar, copyToClipboard } from "quasar"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import {
  useDecodeLightningInvoice,
  useCreateInvoice,
} from "src/use/useLightningInvoice"

const dInvoice = ref({})
const amounts = ref({})
const storeUser = useStoreUser()
const amountButton = ref("")
const hiveHbd = ref("hbd")
const loading = ref(false)
const hiveAccObj = ref({ label: "", value: "", caption: "" })
const t = useI18n().t
const quasar = useQuasar()

const qrText = ref("")
const qrCode = ref(null)

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

// If the amount has been set, rerun with the amount.
watch(hiveHbd, async (newVal, oldVal) => {
  if (amounts.value?.sats) {
    loading.value = true
    qrText.value = "lightning:" + getHiveHbdAddress(hiveAccObj.value.value)
    if (dInvoice.value.v4vapp.comment) {
      dInvoice.value.v4vapp.comment = dInvoice.value.v4vapp.comment
        .replace(/#HBD/g, "")
        .trim()
    }
    const oldMetadata = dInvoice.value.v4vapp.metadata
    dInvoice.value.hiveHbd = newVal
    dInvoice.value = await useDecodeLightningInvoice(qrText.value)
    dInvoice.value.v4vapp.metadata = oldMetadata
    dInvoice.value.v4vapp.amountToSend = amounts.value.satsNum
    const invoice = await useCreateInvoice(dInvoice.value)
    receiveNewInvoice(invoice)
    loading.value = false
  } else {
    resetValues()
  }
})

function resetValues() {
  amounts.value = {}
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

function copyText() {
  console.log(qrText.value)
  copyToClipboard(qrText.value)
  quasar.notify({
    message: t("copied"),
    color: "positive",
    icon: "check_circle",
  })
}

function downloadQRCode() {
  qrCode.value.download({ name: hiveAccObj.value.value, extension: "webp" })
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

function receiveNewInvoice(val) {
  console.log("receiveNewInvoice", val)
  qrText.value = "lightning:" + val.pr
}

async function receiveAmounts(val) {
  console.log("receiveAmounts", val)
  amounts.value = val
  setAmountButton()
}
</script>

<style lang="scss" scoped>
@media screen and (max-width: 600px) {
  .action-buttons {
    // background-color: purple;
    flex-direction: row;
  }
}

@media screen and (min-width: 601px) {
  .action-buttons {
    // background-color: green;
    flex-direction: column;
  }
}

div {
  // border: 1px solid red;
}
// .action-buttons {
//   background-color: green;
//   flex-direction: column;
// }
</style>
