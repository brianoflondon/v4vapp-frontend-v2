<template>
  <q-page class="column flex-center">
    <div class="invoice flex">
      <q-input
        class="q-pa-sm invoice-input"
        v-model="invoiceText"
        type="textarea"
        name="invoice"
        style="max-width: 600px"
        :placeholder="$t('enter_invoice')"
        :label="$t('invoice')"
        debounce="500"
        filled
        grow
        for="invoice"
        :loading="invoiceLoading"
        clearable
        :rules="[decodeInvoice]"
      >
      </q-input>
      <div class="q-pa-sm text-center amounts">
        <div class="camera-toggle">
          <q-toggle
            v-model="cameraOn"
            @update:model-value="toggleCamera()"
            icon="photo_camera"
            size="xl"
            color="primary"
            dense
            flat
          />
        </div>
        <div class="q-pa-sm">
          <q-input readonly dense filled v-model="sats" label="Sats"></q-input>
        </div>
        <div class="q-pa-sm">
          <q-input readonly dense filled v-model="sats" label="HBD"></q-input>
        </div>
        <div class="q-pa-sm">
          <q-input readonly dense filled v-model="sats" label="Hive"></q-input>
        </div>
      </div>
    </div>
    <div v-if="cameraShow">
      <QrcodeStream @decode="onDecode" @init="onInitCamera"></QrcodeStream>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
div {
  border: 1px solid red;
}

.invoice {
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
}

.invoice-input {
  border: 1px solid blue;
  align-items: center;
}

.amounts {
  border: 1px solid green;
  align-items: center;
  width: 40%;
}

@media screen and (max-width: 300px) {
  .invoice {
    flex-direction: column;
  }
}
</style>

<script setup>
import { computed, ref } from "vue"
import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"
import { QrcodeStream } from "qrcode-reader-vue3"
import { useDecodeLightningInvoice } from "src/use/useLightningInvoice"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"

const invoiceText = ref("")
const invoiceLoading = ref(false)
const invoiceValid = ref(false)
const dInvoice = ref({})

const cameraOn = ref(false)
const cameraShow = ref(false)
const cameraError = ref("")

const t = useI18n().t
const q = useQuasar()

const sats = computed(() => {
  console.log("dInvoice.value", dInvoice.value)
  if (dInvoice.value?.millisatoshis) {
    return tidyNumber(dInvoice.value?.millisatoshis / 1000)
  }
  return 0
})

function onDecode(content) {
  console.log("onDecode", content)
  invoiceText.value = content
  decodeInvoice()
}

async function decodeInvoice() {
  console.log("invoiceText.value", invoiceText.value)
  if (!invoiceText.value) {
    dInvoice.value = {}
    return true
  }
  try {
    dInvoice.value = await useDecodeLightningInvoice(invoiceText.value)
    console.log("dInvoice", dInvoice.value)
    if (dInvoice.value) {
      q.notify({
        color: "primary",
        timeout: 2000,
        message: t("valid_invoice"),
        position: "top",
      })
      invoiceValid.value = true
      cameraOn.value = false
      cameraShow.value = false
      return true
    }
    // raise an error

  } catch (e) {
    console.log("e", e)
    dInvoice.value = {}
    return "Not a valid invoice"
  }
}

const cameraErrors = [
  "NotAllowedError",
  "NotFoundError",
  "NotSupportedError",
  "NotReadableError",
  "OverconstrainedError",
  "StreamApiNotSupportedError",
  "InsecureContextError",
]

const onInitCamera = async (promise) => {
  try {
    await promise
  } catch (errorEvent) {
    console.log(errorEvent.name)
    if (cameraErrors.includes(errorEvent.name)) {
      cameraError.value = `${t("error")}: ${t(errorEvent.name)}`
    } else {
      cameraError.value = `${t("error")}: ${t("OtherError")}`
    }
    console.log("cameraError", cameraError.value)
    q.notify({
      color: "negative",
      timeout: 2000,
      message: cameraError.value,
      position: "top",
    })
    setTimeout(() => {
      cameraError.value = ""
      cameraOn.value = false
      cameraShow.value = false
    }, 500)
    cameraOn.value = false
    cameraShow.value = false
  }
}

function toggleCamera() {
  console.log("cameraOn", cameraOn.value)
  setTimeout(() => {
    cameraShow.value = cameraOn.value
  }, 500)
}
</script>
