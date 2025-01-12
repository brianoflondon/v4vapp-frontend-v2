<template>
  <div>
    <!-- Camera  -->
    <div v-if="!cameraShow" class="q-pb-lg"></div>
    <div>
      <video ref="video" autoplay playsinline></video>
      <input type="range" ref="zoomSlider"  />
    </div>
    <div v-if="cameraShow">
      <qrcode-stream
        @detect="onDecode"
        @camera-on="onReady"
        @error="onError"
      ></qrcode-stream>
    </div>
    <!-- End Camera -->
    <div>
      <q-btn
        v-if="!cameraShow"
        @click="cameraShow = true"
        color="primary"
        label="Scan QR Code"
        icon="mdi-camera"
        class="q-mb-md"
      />
      <q-btn
        v-if="cameraShow"
        @click="cameraShow = false"
        color="primary"
        label="Close Camera"
        icon="mdi-camera-off"
        class="q-mb-md"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { QrcodeStream } from "vue-qrcode-reader"
import { useI18n } from "vue-i18n"

const t = useI18n().t
const cameraOn = ref(false)
const cameraShow = ref(false)
const cameraError = ref("")

const video = ref(null)
const zoomSlider = ref(null)

onMounted(() => {
  navigator.mediaDevices
    .getUserMedia({ video: { zoom: true } })
    .then((mediaStream) => {
      video.value.srcObject = mediaStream

      const [track] = mediaStream.getVideoTracks()
      const capabilities = track.getCapabilities()
      const settings = track.getSettings()

      // Check whether zoom is supported or not.
      if (!("zoom" in settings)) {
        console.error("Zoom is not supported by " + track.label)
        return
      }

      // Map zoom to a slider element.
      zoomSlider.value.min = capabilities.zoom.min
      zoomSlider.value.max = capabilities.zoom.max
      zoomSlider.value.step = capabilities.zoom.step
      zoomSlider.value.value = settings.zoom
      zoomSlider.value.oninput = function (event) {
        track.applyConstraints({ advanced: [{ zoom: event.target.value }] })
      }
      zoomSlider.value.hidden = false
    })
    .catch((error) => console.error("Error accessing media devices.", error))
})

async function onReady() {
  cameraOn.value = true
}

async function onDecode(content) {
  // Switch to better QR Code library, handle multiple QR codes
  // scan through them until a valid Lightning invoice is found.
  let i = 0
  while (i < content.length && !invoiceValid.value) {
    const rawValue = content[i].rawValue

    // invoiceText.value = rawValue
    console.log("QR Code detected: ", rawValue)

    i++
  }
}

function onError(error) {
  console.error("onError", error.name)
  if (cameraErrors.includes(error.name)) {
    cameraError.value = `${t("error")}: ${t(error.name)}`
  } else {
    cameraError.value = `${t("error")}: ${t("OtherError")} ${
      error.name
    } ${error}`
  }
  invoiceChecking.value = false
  q.notify({
    color: "negative",
    timeout: 4000,
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
</script>

<style lang="scss" scoped></style>
