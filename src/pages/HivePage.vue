<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div class="flex column text-center">
        <!-- Old page links -->
        <div class="q-pt-lg">
          <q-btn
            color="primary"
            :label="t('new_page')"
            style="font-size: 0.6rem; white-space: pre-line"
            @click="$router.push('/pos')"
          ></q-btn>
        </div>
        <div class="flex row justify-center items-center">
          <div class="q-pa-sm">
            <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options />
          </div>
          <div class="q-pa-sm">
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
          </div>
        </div>
        <div class="q-pa-md flex row justify-center">
          <div>
            <CreateQRCode
              :qr-text="qrText"
              :loading="loading"
              :hive-accname="hiveAccTo.value"
              :width="300"
              :height="300"
              @qr-code="(val) => (qrCode = val)"
            />
            <!-- TODO: Should implement count down timer on HivePage for lightning invoices -->
            <div v-if="false" class="q-pt-none">
              <q-linear-progress
                class="invoice-timer"
                size="10px"
                :value="0.5"
                color="positive"
              >
              </q-linear-progress>
            </div>
          </div>
        </div>
      </div>
      <div class="q-pt-none">
        <div class="action-buttons flex row q-pt-sm q-gutter-sm">
          <q-btn
            :label="amountButton"
            icon="attach_money"
            name="amount"
            rounded
            color="primary"
            @click="setAmount"
            class="btn-fixed-width"
            align="between"
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
            class="btn-fixed-width"
            align="between"
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
            class="btn-fixed-width"
            align="between"
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
            class="btn-fixed-width"
            align="between"
          >
            <q-tooltip>{{ $t("download_tooltip") }}</q-tooltip>
          </q-btn>
          <div class="vote-button text-center">
            <VoteProposal v-model="voteOptions" />
          </div>
          <div style="max-width: 200px">
            <ExplanationBox class="q-pt-md"></ExplanationBox>
          </div>
        </div>
      </div>
    </div>
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
import ExplanationBox from "src/components/utils/ExplanationBox.vue"

import VoteProposal from "components/utils/VoteProposal.vue"

const voteOptions = ref({
  hiveUser: "",
  showButton: true,
  showDialog: false,
})

const dInvoice = ref({})
const amounts = ref({})
const storeUser = useStoreUser()
const amountButton = ref("")
const hiveHbd = ref("hbd")
const loading = ref(false)
const hiveAccTo = ref({ label: "", value: "", caption: "" })
const t = useI18n().t
const quasar = useQuasar()

const qrText = ref("")
const qrCode = ref(null)

onMounted(() => {
  if (storeUser.pos?.hiveAccTo) {
    hiveAccTo.value = {
      label: storeUser.pos.hiveAccTo.label,
      value: storeUser.pos.hiveAccTo.value,
      caption: storeUser.pos.hiveAccTo.caption,
    }
  } else {
    useLoggedInUser()
  }
  resetValues()
})

watch(storeUser, async (val) => {
  hiveAccTo.value = {
    label: val.hiveAccname,
    value: val.hiveAccname,
    caption: val.profileName,
  }
  resetValues()
})

watch(hiveAccTo, async (val) => {
  resetValues()
})

// If the amount has been set, rerun with the amount.
watch(hiveHbd, async (newVal, oldVal) => {
  if (amounts.value?.sats) {
    loading.value = true
    qrText.value = "lightning:" + getHiveHbdAddress(hiveAccTo.value.value)
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
  if (!hiveAccTo.value.value) {
    qrText.value = "lightning:v4vapp@v4v.app"
  }
  qrText.value = "lightning:" + getHiveHbdAddress(hiveAccTo.value.value)
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
  copyToClipboard(qrText.value)
  quasar.notify({
    message: t("copied"),
    color: "positive",
    icon: "check_circle",
  })
}

function downloadQRCode() {
  qrCode.value.download({ name: hiveAccTo.value.value, extension: "webp" })
}

async function setAmount() {
  if (!hiveAccTo.value.value) {
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
    dInvoice.value.makingInvoice = true
    dInvoice.value.hiveHbd = hiveHbd.value
    dInvoice.value.sending = false // Flag to show this is for receiving Lightning to Hive
    dInvoice.value.askDetails = true
  } catch (e) {
    console.error("error:", e)
  }
}

function receiveNewInvoice(val) {
  qrText.value = "lightning:" + val.pr
}

async function receiveAmounts(val) {
  amounts.value = val
  setAmountButton()
}
</script>

<style lang="scss" scoped>
@media screen and (max-width: 600px) {
  .action-buttons {
    flex-direction: row;
    justify-content: space-evenly;
  }
}
@media screen and (min-width: 601px) {
  .action-buttons {
    flex-direction: column;
  }
}

// div {
//   // border: 1px solid red;
// }
// .action-buttons {
//   background-color: green;
//   flex-direction: column;
// }
</style>
