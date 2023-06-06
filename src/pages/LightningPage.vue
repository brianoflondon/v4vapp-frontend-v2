<template>
  <q-page class="column flex-center">
    <div class="invoice flex q-gutter-xs">
      <q-input
        class="q-pa-sm col-auto max-width-input invoice-input"
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
      <div class="q-pa-sm">
        <q-btn
          icon-right="photo_camera"
          class="vertical-middle"
          dense
          flat
          @click="turnCameraOn()"
          title="Take a photo of a lightning invoice QR code using your camera"
        />
        <div class="q-pa-sm">
          <q-input readonly filled v-model="sats" label="Sats"></q-input>
        </div>
      </div>
    </div>
    <div class="row first-row">
      <div class="col-6 q-pa-sm"><q-input filled label="HBD"></q-input></div>
      <div class="col-3 q-pa-sm"><q-input filled label="sats"></q-input></div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from "vue"

const invoiceText = ref("")
const invoiceLoading = ref(false)
const invoiceValid = ref(false)
const dInvoice = ref({})
import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"

const sats = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    return tidyNumber(dInvoice.value?.millisatoshis / 1000)
  }
  return 0
})

function decodeInvoice() {
  console.log("invoiceText.value", invoiceText.value)
  if (!invoiceText.value) {
    dInvoice.value = {}
    return true
  }
  try {
    dInvoice.value = bolt11.lightningPayReq.decode(invoiceText.value)
    console.log("dInvoice", dInvoice)
    invoiceValid.value = true
    return true
  } catch (e) {
    dInvoice.value = {}
    return "Not a valid invoice"
  }
}
</script>

<style lang="scss" scoped>
// .max-width-input {

//   width: 250px;
//   max-width: 600px;
// }

// .body--light .invoice-input {
//   // background-color: lightgreen;
// }

// .body--dark .invoice-input {
//   // background-color: darkgreen;
// }
</style>
