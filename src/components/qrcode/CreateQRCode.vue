<template>
  <div class="flex col q-pa-none q-ma-none">
    <div class="container">
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div
          class="invoice-container1"
          ref="qrCodeContainer"
          :style="{
            width: width + 'px',
            height: height + 'px',
            backgroundColor: `${
              quasar.dark.isActive ? 'transparent' : 'transparent'
            }`,
          }"
          @click="openLinkInNewWindow(qrText)"
        ></div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup>
import { useHiveAvatarURL } from "src/use/useHive"
import { computed, ref, onMounted, onUpdated, watch } from "vue"
import { useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import QRCodeStyling from "qr-code-styling"

const quasar = useQuasar()
const t = useI18n().t

const qrCodeContainer = ref()
const qrCode = ref()
const qrTextPage = ref("")

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
  loading: {
    type: Boolean,
    default: false,
  },
})

const avatarUrl = computed(() => {
  return useHiveAvatarURL({
    hiveAccname: props.hiveAccname,
    size: "medium",
    reason: "qr-code",
  })
})

// let intervalId = null

// watch(
//   () => props.loading,
//   async (newVal, oldVal) => {
//     if (newVal) {
//       intervalId = setInterval(() => {
//         qrTextPage.value = generateRandomString()
//       }, 100)
//     } else {
//       console.log("clearInterval and reset qrTextPage")
//       clearInterval(intervalId)
//       qrTextPage.value = props.qrText
//       await newQRCode()
//     }
//   }
// )

// function generateRandomString() {
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
//   let result = ""
//   for (let i = 0; i < 50; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length))
//   }
//   return result
// }

onMounted(async () => {
  qrTextPage.value = props.qrText
  await newQRCode()
})

onUpdated(async () => {
  if (!props.loading) {
    qrTextPage.value = props.qrText
  }
  await newQRCode()
})

async function newQRCode() {
  if(props.loading) {
    return
  }
  qrCode.value = new QRCodeStyling({
    width: props.width,
    height: props.height,
    type: "webp",
    data: qrTextPage.value,
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
}

function openLinkInNewWindow() {
  const url = props.qrText
  window.open(url, "_blank")
}
</script>
