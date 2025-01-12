<template>
  <div>
    <div>
      <qrcode-stream
        :constraints="selectedConstraints"
        :track="trackFunctionSelected.value"
        :formats="selectedBarcodeFormats"
        @error="onError"
        @detect="onDetect"
        @camera-on="onCameraReady"
      >
        <q-btn
          @click="cycleBackCameras"
          round
          color="primary"
          icon="zoom_in"
        />
      </qrcode-stream>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useQuasar } from "quasar"
import { QrcodeStream } from "vue-qrcode-reader"
import { useI18n } from "vue-i18n"

const t = useI18n().t
const q = useQuasar()
const backCameras = ref([])
const currentCameraIndex = ref(0)
const currentZoomLevel = ref(2)
const zoomLevels = [1, 2, 3, 4, 5, 6] // Define your desired zoom levels here

const cameraOn = ref(false)
const cameraShow = ref(false)
const cameraError = ref("")
// define emits for error if needed to tell the calling component that there was an error
// and output the result and invoicechecking Flag
const invoiceChecking = ref(false)
const emit = defineEmits(["error", "result", "invoiceChecking"])

/*** detection handling ***/

const result = ref("")

// Method to cycle through camera options
async function cycleBackCameras() {
  if (backCameras.value.length === 0) {
    await getBackCameras()
  }

  if (backCameras.value.length === 0) {
    console.error("No back cameras found")
    return
  }

  // Cycle through zoom levels
  currentZoomLevel.value = (currentZoomLevel.value + 1) % zoomLevels.length

  // If we've cycled through all zoom levels, move to the next camera
  if (currentZoomLevel.value === 0) {
    currentCameraIndex.value =
      (currentCameraIndex.value + 1) % backCameras.value.length
  }

  const constraints = {
    deviceId: { exact: backCameras.value[currentCameraIndex.value].deviceId },
    advanced: [{ zoom: zoomLevels[currentZoomLevel.value] }],
  }

  selectedConstraints.value = constraints
}

// Method to get back cameras
async function getBackCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  backCameras.value = devices.filter(
    (device) =>
      device.kind === "videoinput" &&
      device.label.toLowerCase().includes("back")
  )
}

function onDetect(detectedCodes) {
  console.log(detectedCodes)
  result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue))
  emit("result", detectedCodes)
}

/*** select camera ***/

const selectedConstraints = ref({ facingMode: "environment" })
const defaultConstraintOptions = [
  { label: "rear camera", constraints: { facingMode: "environment" } },
  { label: "front camera", constraints: { facingMode: "user" } },
]
const constraintOptions = ref(defaultConstraintOptions)

async function onCameraReady() {
  // NOTE: on iOS we can't invoke `enumerateDevices` before the user has given
  // camera access permission. `QrcodeStream` internally takes care of
  // requesting the permissions. The `camera-on` event should guarantee that this
  // has happened.
  const devices = await navigator.mediaDevices.enumerateDevices()
  const videoDevices = devices.filter(({ kind }) => kind === "videoinput")
  await getBackCameras()

  constraintOptions.value = [
    ...defaultConstraintOptions,
    ...videoDevices.map(({ deviceId, label }) => ({
      label: `${label} (ID: ${deviceId})`,
      constraints: { deviceId },
    })),
  ]
  console.log("constraintOptions", constraintOptions.value)

  error.value = ""
}

/*** track functons ***/

function paintOutline(detectedCodes, ctx) {
  for (const detectedCode of detectedCodes) {
    const [firstPoint, ...otherPoints] = detectedCode.cornerPoints

    ctx.strokeStyle = "red"

    ctx.beginPath()
    ctx.moveTo(firstPoint.x, firstPoint.y)
    for (const { x, y } of otherPoints) {
      ctx.lineTo(x, y)
    }
    ctx.lineTo(firstPoint.x, firstPoint.y)
    ctx.closePath()
    ctx.stroke()
  }
}
function paintBoundingBox(detectedCodes, ctx) {
  for (const detectedCode of detectedCodes) {
    const {
      boundingBox: { x, y, width, height },
    } = detectedCode

    ctx.lineWidth = 2
    ctx.strokeStyle = "#007bff"
    ctx.strokeRect(x, y, width, height)
  }
}
function paintCenterText(detectedCodes, ctx) {
  for (const detectedCode of detectedCodes) {
    const { boundingBox, rawValue } = detectedCode

    const centerX = boundingBox.x + boundingBox.width / 2
    const centerY = boundingBox.y + boundingBox.height / 2

    const fontSize = Math.max(12, (50 * boundingBox.width) / ctx.canvas.width)

    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = "center"

    ctx.lineWidth = 3
    ctx.strokeStyle = "#35495e"
    ctx.strokeText(detectedCode.rawValue, centerX, centerY)

    ctx.fillStyle = "#5cb984"
    ctx.fillText(rawValue, centerX, centerY)
  }
}
const trackFunctionOptions = [
  { text: "nothing (default)", value: undefined },
  { text: "outline", value: paintOutline },
  { text: "centered text", value: paintCenterText },
  { text: "bounding box", value: paintBoundingBox },
]
const trackFunctionSelected = ref(trackFunctionOptions[1])

/*** barcode formats ***/

const barcodeFormats = ref({
  aztec: false,
  code_128: false,
  code_39: false,
  code_93: false,
  codabar: false,
  databar: false,
  databar_expanded: false,
  data_matrix: false,
  dx_film_edge: false,
  ean_13: false,
  ean_8: false,
  itf: false,
  maxi_code: false,
  micro_qr_code: false,
  pdf417: false,
  qr_code: true,
  rm_qr_code: false,
  upc_a: false,
  upc_e: false,
  linear_codes: false,
  matrix_codes: false,
})
const selectedBarcodeFormats = computed(() => {
  return Object.keys(barcodeFormats.value).filter(
    (format) => barcodeFormats.value[format]
  )
})

/*** error handling ***/

const error = ref("")

const cameraErrors = [
  "NotAllowedError",
  "NotFoundError",
  "NotSupportedError",
  "NotReadableError",
  "OverconstrainedError",
  "StreamApiNotSupportedError",
  "InsecureContextError",
]

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
  emit("error", cameraError.value)
  emit("invoiceChecking", invoiceChecking.value)
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

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
.barcode-format-checkbox {
  margin-right: 10px;
  white-space: nowrap;
  display: inline-block;
}

.decode-result {
  max-width: 500px;
  word-wrap: break-word;
}

button {
  position: absolute;
  left: 10px;
  top: 10px;
}
button img {
  width: 50px;
  height: 50px;
}
</style>
