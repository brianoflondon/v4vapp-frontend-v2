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
        <q-btn
          icon-right="photo_camera"
          dense
          flat
          @click="turnCameraOn()"
          title="Take a photo of a lightning invoice QR code using your camera"
        />
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
    <div>
      <pre>{{  }}</pre>
      <QrcodeStream @decode="onDecode"></QrcodeStream>
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
// https://gruhn.github.io/vue-qrcode-reader/demos/CustomTracking.html
// import CaptureQRCode from "components/qrcode/CaptureQRCode.vue"
import { QrcodeStream } from "qrcode-reader-vue3"

const invoiceText = ref("")
const invoiceLoading = ref(false)
const invoiceValid = ref(false)
const dInvoice = ref({})

const sats = computed(() => {
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

function decodeInvoice() {
  console.log("invoiceText.value", invoiceText.value)
  if (!invoiceText.value) {
    dInvoice.value = {}
    return true
  }
  try {
    dInvoice.value = lightningPayReq.decode(invoiceText.value)
    console.log("dInvoice", dInvoice)
    invoiceValid.value = true
    return true
  } catch (e) {
    console.log("e", e)
    dInvoice.value = {}
    return "Not a valid invoice"
  }
}

function turnCameraOn() {
  console.log("turnCameraOn")
}
</script>
