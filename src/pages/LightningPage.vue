<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div class="camera-toggle-invoice">
        <div class="column flex-center">
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
          <div class="q-pa-sm invoice-input">
            <q-input
              style="width: 300px"
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
        </div>
      </div>
      <div class="amounts-display flex justify-evenly">
        <div class="q-pa-xs input-amount-readonly">
          <q-input
            readonly
            input-class="text-right"
            dense
            filled
            v-model="sats"
            label="Sats"
          ></q-input>
        </div>
        <div class="q-pa-xs input-amount-readonly">
          <q-input
            readonly
            input-class="text-right"
            dense
            filled
            v-model="HBD"
            label="HBD"
          ></q-input>
        </div>
        <div class="q-pa-xs input-amount-readonly">
          <q-input
            readonly
            input-class="text-right"
            dense
            filled
            v-model="Hive"
            label="Hive"
          ></q-input>
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
  // border: 1px solid green;
}

.input-amount-readonly {
  width: 7rem;
}

@media screen and (min-width: 500px) {
  .amounts-display {
    flex-direction: column;
  }
}
</style>

<script setup>
import { computed, ref } from "vue"
import * as bolt11 from "src/assets/bolt11.min.js"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
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
const storeApiStatus = useStoreAPIStatus()

const sats = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    return tidyNumber(dInvoice.value?.millisatoshis / 1000)
  }
  return "---"
})

const HBD = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = dInvoice.value?.millisatoshis / 1000
    const HBD = (sats / storeApiStatus.HBDSatsNumber).toFixed(2)
    return tidyNumber(HBD)
  }
  return "---"
})

const Hive = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = dInvoice.value?.millisatoshis / 1000
    const hive = (sats / storeApiStatus.hiveSatsNumber).toFixed(3)
    return tidyNumber(hive)
  }
  return "---"
})

const invoiceColours = {
  // dark mode is true, light mode is false
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
  enter: t("enter_invoice"),
  bolt11: t("valid_invoice"),
  lightningAddress: t("valid_lightning_address"),
  invalid: t("invalid_invoice"),
}

const invoiceLabel = computed(() => {
  return invoiceLabels[invoiceType()]
})

function receiveNewInvoice(val) {
  callbackResult.value = val
  invoiceText.value = val.pr
  decodeInvoice()
}

function invoiceType() {
  // Checks the type of the invoice returns bolt11 or lightningAddress
  if (invoiceValid.value === null) {
    return "enter"
  }
  const type = dInvoice.value?.v4vapp?.type
  if (!type) {
    return "invalid"
  }
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
  invoiceText.value = content
  decodeInvoice()
}

async function decodeInvoice() {
  if (!invoiceText.value) {
    clearReset()
    return true
  }
  invoiceText.value = invoiceText.value.toLowerCase()
  if (invoiceText.value.startsWith("lightning:")) {
    invoiceText.value = invoiceText.value.substring(10)
  }
  try {
    dInvoice.value = await useDecodeLightningInvoice(invoiceText.value)
    if (dInvoice.value) {
      invoiceValid.value = true
      invoiceChecking.value = false
      cameraOn.value = false
      cameraShow.value = false
      if (invoiceType() === "lightningAddress") {
        dInvoice.value.askDetails = true
        return
      } else {
        if (dInvoice.value?.errors.text.length > 0) {
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
    invoiceValid.value = false
    invoiceChecking.value = false
    errorMessage.value = t("invalid_invoice")
    return false
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
    if (cameraErrors.includes(errorEvent.name)) {
      cameraError.value = `${t("error")}: ${t(errorEvent.name)}`
    } else {
      cameraError.value = `${t("error")}: ${t("OtherError")}`
    }
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
    invoiceChecking.value = false
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
