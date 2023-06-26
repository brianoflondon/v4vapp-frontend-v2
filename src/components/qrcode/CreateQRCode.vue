<template>
  <div class="flex col text-center" @click="copyText">
    <a :href="qrText" class="invoice-qrcode">
      <div ref="qrCodeContainer">
      </div>
    </a>
  </div>
</template>

<script setup>
import { useHiveAvatarURL } from "src/use/useHive"
import { computed, ref, onMounted, onUpdated } from "vue"
import { useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import QRCodeStyling from "qr-code-styling"

const quasar = useQuasar()
const t = useI18n().t

const qrCodeContainer = ref()
const qrCode = ref()

const emit = defineEmits(["qrCode"])
const props = defineProps({
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
    size: "medium",
    reason: "qr-code",
  })
})

const downloadOptions = computed(() => {
  return {
    name: props.hiveAccname + "-lightning-address-v4vapp",
    extension: "webp",
  }
})

onUpdated(async () => {
  qrCode.value = new QRCodeStyling({
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
  qrCodeContainer.value.innerHTML = ""
  qrCode.value.append(qrCodeContainer.value)
  emit("qrCode", qrCode.value)
})

onMounted(async () => {
  console.log("onMounted")
})
</script>

<style lang="scss" scoped></style>
