<template>
  <q-page>
    <div class="invoice column flex-center">
      <div class="q-pa-sm column invoice-input">
        <q-input
          style="width: 200px"
          v-model="invoiceText"
          type="textarea"
          name="invoice"
          @clear="clearReset"
          :placeholder="$t('enter_invoice')"
          :label="invoiceLabel"
          debounce="500"
          filled
          for="invoice"
          :loading="invoiceChecking"
          clearable
          @update:model-value="decodeInvoice"
          :error-message="errorMessage"
          :error="invoiceValid === false"
          :bg-color="invoiceColor"
          @keyup.esc="clearReset"
        >
        </q-input>
      </div>
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
    <div>
      <pre>{{ dInvoice }}</pre>
    </div>
    <AskDetailsDialog
      v-model="dInvoice"
      @newInvoice="(val) => receiveNewInvoice(val)"
    />
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
}

.invoice-input {
  border: 1px solid blue;
  align-items: center;
}

.amounts {
  border: 1px solid green;
  align-items: center;
}

@media screen and (max-width: 300px) {
  .invoice {
    flex-direction: column;
  }
}
</style>

<script setup>
import { computed, ref, watch } from "vue"
import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"
import { QrcodeStream } from "qrcode-reader-vue3"
import { useDecodeLightningInvoice } from "src/use/useLightningInvoice"
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue"
import { useI18n } from "vue-i18n"
import { useQuasar } from "quasar"

const invoiceText = ref(null)
const invoiceChecking = ref(false)
const invoiceValid = ref(null)
const dInvoice = ref(null)
const callbackResult = ref(null)
const errorMessage = ref("")

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

const invoiceColours = {
  true: {
    empty: "blue-grey-9",
    valid: "green-9",
    invalid: "red-9",
  },
  false: {
    empty: "blue-grey-2",
    valid: "green-2",
    invalid: "red-2",
  },
}

const invoiceColor = computed(() => {
  console.log(invoiceColours[q.dark.isActive])
  const colours = invoiceColours[q.dark.isActive]
  if (invoiceValid.value === null) {
    return colours.empty
  }
  if (invoiceValid.value) {
    return colours.valid
  }
  return colours.invalid
})

const invoiceLabels = {
  bolt11: t("valid_invoice"),
  lightningAddress: t("valid_lightning_address"),
  invalid: t("invalid_invoice"),
}

const invoiceLabel = computed(() => {
  return invoiceLabels[invoiceType()]
})

function receiveNewInvoice(val) {
  console.log("newInvoice")
  console.log("val", val)
  callbackResult.value = val
  invoiceText.value = val.pr
  decodeInvoice()
}

function invoiceType() {
  // Checks the type of the invoice returns bolt11 or lightningAddress
  if (invoiceValid.value === null) {
    return null
  }
  const type = dInvoice.value?.v4vapp?.type
  if (type === "bolt11") {
    return "bolt11"
  } else if (type === "lightningAddress") {
    return "lightningAddress"
  } else {
    return "invalid"
  }
}

function clearReset() {
  errorMessage.value = ""
  invoiceText.value = null
  invoiceValid.value = null
  invoiceChecking.value = false
  dInvoice.value = {}
  cameraOn.value = false
  cameraShow.value = false
}

function onDecode(content) {
  console.log("onDecode", content)
  invoiceText.value = content
  decodeInvoice()
}

async function decodeInvoice() {
  console.log("invoiceText.value", invoiceText.value)

  invoiceText.value = invoiceText.value.toLowerCase()

  if (invoiceText.value.startsWith("lightning:")) {
    invoiceText.value = invoiceText.value.substring(10)
  }

  if (!invoiceText.value) {
    clearReset()
    return true
  }
  try {
    console.log("invoiceText.value", invoiceText.value)
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
      invoiceChecking.value = false
      cameraOn.value = false
      cameraShow.value = false
      if (invoiceType() === "lightningAddress") {
        dInvoice.value.askDetails = true
        return
      } else {
        if (Object.keys(dInvoice.value?.errors).length > 0) {
          errorMessage.value = dInvoice.value?.errors.text
            .map((error) => t(error))
            .join(", ")

          q.notify({
            color: "negative",
            timeout: 2000,
            message: errorMessage.value,
            position: "top",
          })
          invoiceValid.value = false
          invoiceChecking.value = false
          return errorMessage.value
        }
      }
      return true
    }
    invoiceValid.value = false
  } catch (e) {
    console.log("e", e)
    // dInvoice.value = {}
    invoiceValid.value = false
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
    invoiceChecking.value = true
    await promise
  } catch (errorEvent) {
    console.log(errorEvent.name)
    if (cameraErrors.includes(errorEvent.name)) {
      cameraError.value = `${t("error")}: ${t(errorEvent.name)}`
    } else {
      cameraError.value = `${t("error")}: ${t("OtherError")}`
    }
    console.log("cameraError", cameraError.value)
    invoiceChecking.value = false
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
  invoiceChecking.value = true
  setTimeout(() => {
    cameraShow.value = cameraOn.value
  }, 500)
}
</script>
