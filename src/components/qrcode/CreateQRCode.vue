<template>
  <div class="flex col text-center" @click="copyText">
    <QRCodeVue3
      ref="lightningAddressQRCode"
      :key="props.qrText"
      :width="props.width"
      :height="props.height"
      :value="props.qrText"
      :image="avatarUrl"
      margin="5"
      :qrOptions="{ typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'M' }"
      :imageOptions="{
        hideBackgroundDots: false,
        imageSize: 0.4,
        margin: 0,
        crossOrigin: 'anonymous',
      }"
      :dotsOptions="{
        type: 'square',
        color: '#26249a',
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#000000' },
          ],
        },
      }"
      :backgroundOptions="{ color: '#ffffff' }"
      :cornersSquareOptions="{ type: 'square', color: '#000000' }"
      :cornersDotOptions="{ type: undefined, color: '#000000' }"
      :download="false"
      myclass="my-qur"
      imgclass="img-qr"
      :downloadOptions="downloadOptions"
    />
    <q-tooltip>{{ $t("copy_qrcode") }}</q-tooltip>
  </div>
</template>

<script setup>
import { useHiveAvatarURL } from "src/use/useHive"
import QRCodeVue3 from "qrcode-vue3"
import { computed, ref } from "vue"
import { copyToClipboard, useQuasar } from "quasar"
import { useI18n } from "vue-i18n"

const quasar = useQuasar()
const t = useI18n().t

const lightningAddressQRCode = ref(null)

async function downloadQRCode() {
  console.log("downloadQRCode")
  console.log("lightningAddressQRCode", lightningAddressQRCode.value)
  const imageDataUrl = await lightningAddressQRCode.value.getImageDataUrl()

  console.log("downloadUrl", downloadUrl)
}

const props = defineProps({
  qrText: {
    type: String,
    default: "",
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
  console.log("props.hiveAccname", props.hiveAccname)
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

console.log("avatarUrl", avatarUrl)
</script>

<style lang="scss" scoped></style>