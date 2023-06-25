<template>
  <div class="flex col text-center" @click="console.log('copy')">
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
      :download="true"
      myclass="my-qur"
      imgclass="img-qr"
      :downloadOptions="downloadOptions"
    />
    <q-tooltip
      anchor="top middle"
      self="bottom middle"
      :offset="[0, 10]"
      :delay="100"
    >
      {{ $t("click_to_copy") }}
    </q-tooltip>
  </div>
</template>

<script setup>
import { useHiveAvatarURL } from "src/use/useHive"
import QRCodeVue3 from "qrcode-vue3"
import { computed, ref } from "vue"

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
  console.log("props.hiveAccname", props.hiveAccname)
  return {
    name: props.hiveAccname + "-lightning-address-v4vapp",
    extension: "webp",
  }
})

console.log("avatarUrl", avatarUrl)
</script>

<style lang="scss" scoped></style>
