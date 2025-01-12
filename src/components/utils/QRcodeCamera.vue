<template>
  <q-page>
    <!-- Other components and elements -->

    <qrcode-stream @detect="onDecode" @camera-on="onReady" @error="onError">
      <button @click="switchCamera">
        <q-img icon="camera" alt="switch camera" />
      </button>
    </qrcode-stream>
    <div v-if="noRearCamera" class="error">No rear camera available</div>
    <div v-if="noFrontCamera" class="error">No front camera available</div>
    <pre>{{ mediaStream }}</pre>
    <pre>{{ decodedQR }}</pre>
    <input type="range" ref="zoomSlider" />

    <!-- Other components and elements -->
  </q-page>
</template>
<script setup>
// filepath: /Users/bol/Documents/dev/v4vapp/v4vapp-frontend-v2/src/pages/LightningPage.vue
import { ref } from "vue"
import { QrcodeStream } from "vue-qrcode-reader"
import { useQuasar } from "quasar"

// Reactive state
const facingMode = ref("environment")
const noRearCamera = ref(false)
const noFrontCamera = ref(false)
const zoomSlider = ref(null)
const decodedQR = ref("")
const mediaStream = ref(null)

// Method to switch the camera
function switchCamera() {
  if (facingMode.value === "environment") {
    facingMode.value = "user"
  } else {
    facingMode.value = "environment"
  }
}

// Method to handle camera errors
function onError(error) {
  const triedFrontCamera = facingMode.value === "user"
  const triedRearCamera = facingMode.value === "environment"

  const cameraMissingError = error.name === "OverconstrainedError"

  if (triedRearCamera && cameraMissingError) {
    noRearCamera.value = true
  }

  if (triedFrontCamera && cameraMissingError) {
    noFrontCamera.value = true
  }

  console.error(error)
}

// Method to handle QR code decoding
function onDecode(content) {
  console.log("QR code decoded:", content)
  let i = 0
  while (i < content.length) {
    const rawValue = content[i].rawValue
    decodedQR.value = rawValue
    i++
  }
  // Add your logic to handle the decoded result here
}

// Method to handle camera ready event
function onReady(mediaStream) {
  mediaStream.value = mediaStream
  console.log("Camera is ready:", mediaStream)
  if (!mediaStream || typeof mediaStream.getVideoTracks !== "function") {
    console.error("Invalid mediaStream object:", mediaStream)
    return
  }

  const [track] = mediaStream.getVideoTracks()
  if (!track) {
    console.error("No video tracks available in mediaStream:", mediaStream)
    return
  }

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
}
</script>

<style scoped>
button {
  position: absolute;
  left: 10px;
  top: 10px;
}
button img {
  width: 50px;
  height: 50px;
}
input[type="range"] {
  width: 100%;
  margin-top: 10px;
}
.error {
  color: red;
  font-weight: bold;
}
</style>
