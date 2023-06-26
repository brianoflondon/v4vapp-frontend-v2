<template>
  <div class="flex col text-center" @click="copyText">
    <div ref="qrCodeContainer" class="invoice-qrcode"></div>
    <q-tooltip>{{ $t("copy_qrcode") }}</q-tooltip>
  </div>
</template>

<script setup>
import { useHiveAvatarURL } from "src/use/useHive"
import { computed, ref, onMounted, onUpdated } from "vue"
import { copyToClipboard, useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import QRCodeStyling from "qr-code-styling"

const quasar = useQuasar()
const t = useI18n().t

const qrCodeContainer = ref()

async function downloadQRCode() {
  console.log("downloadQRCode")
  console.log("lightningAddressQRCode", lightningAddressQRCode.value)
  const imageDataUrl = await lightningAddressQRCode.value.getImageDataUrl()

  console.log("downloadUrl", downloadUrl)
}
const props = defineProps({
  qrTextAgain: {
    type: String,
    default: "",
  },
  qrText: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    default: 300,
  },
  height: {
    type: Number,
    default: 300,
  },
  hiveAccname: {
    type: String,
    default: "",
  },
})

const avatarUrl = computed(() => {
  return useHiveAvatarURL({
    hiveAccname: props.hiveAccname,
    size: "small",
    reason: "qr-code",
  })
})

const downloadOptions = computed(() => {
  return {
    name: props.hiveAccname + "-lightning-address-v4vapp",
    extension: "webp",
  }
})

function copyText() {
  copyToClipboard(props.qrText)
  quasar.notify({
    message: t("copied"),
    color: "positive",
    icon: "check_circle",
  })
}

onUpdated(async () => {
  const qrCode = new QRCodeStyling({
    width: props.width,
    height: props.height,
    type: "webp",
    data: props.qrText,
    image: avatarUrl.value,
    qrOptions: {
      typeNumber: "0",
      mode: "Byte",
      errorCorrectionLevel: "M",
      cellSize: 6,
      margin: 0,
    },
    dotsOptions: {
      color: "#1976D2",
      type: "square",
    },
    backgroundOptions: {
      color: quasar.dark.isActive ? "#03002c" : "#f5f5f5",
    },
    margin: 5,
    imageOptions: {
      crossOrigin: "anonymous",
      hideBackgroundDots: false,
      imageSize: 0.4,
      margin: 0,
    },
  })
  console.log("qrCodeContainer", qrCodeContainer.value)
  qrCodeContainer.value.innerHTML = ""
  qrCode.append(qrCodeContainer.value)
  console.log("qrCodeContainer", qrCodeContainer.value)
  console.log("avatarUrl", avatarUrl.value)
})

onMounted(async () => {
  console.log("onMounted")
})
</script>

<style lang="scss" scoped></style>
