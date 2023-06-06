<template>
  <div>
    <QrcodeStream @decode="onDecode" @init="onInit"></QrcodeStream>
    <p class="error" v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { QrcodeStream } from "vue-qrcode-reader"
import { ref } from "vue"
console.log("CaptureQRCode.vue")
const result = ref("")
const error = ref("")

const onDecode = (resultData) => {
  console.log("CaptureQRCode.vue")
  result.value = resultData
}

const onInit = async (promise) => {
  console.log("CaptureQRCode.vue")
  try {
    await promise
  } catch (errorEvent) {
    if (errorEvent.name === "NotAllowedError") {
      error.value = "ERROR: you need to grant camera access permission"
    } else if (errorEvent.name === "NotFoundError") {
      error.value = "ERROR: no camera on this device"
    } else if (errorEvent.name === "NotSupportedError") {
      error.value = "ERROR: secure context required (HTTPS, localhost)"
    } else if (errorEvent.name === "NotReadableError") {
      error.value = "ERROR: is the camera already in use?"
    } else if (errorEvent.name === "OverconstrainedError") {
      error.value = "ERROR: installed cameras are not suitable"
    } else if (errorEvent.name === "StreamApiNotSupportedError") {
      error.value = "ERROR: Stream API is not supported in this browser"
    } else if (errorEvent.name === "InsecureContextError") {
      error.value =
        "ERROR: Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP."
    } else {
      error.value = `ERROR: Camera error (${errorEvent.name})`
    }
  }
}
</script>

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
</style>
