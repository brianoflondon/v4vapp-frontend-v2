<template>
  <div @click="openLinkInNewWindow">
    <a :href="qrText" target="_blank">
      <img :src="qrcodeUrl" :alt="qrText" />
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import QRCode from "qrcode";

const quasar = useQuasar();
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
  loading: {
    type: Boolean,
    default: false,
  },
  expires: {
    type: Number,
    default: 0,
  },
});
const qrcodeUrl = ref("");

onMounted(() => {
  if (props.qrText) {
    generateQRCode();
  }
});

watch(
  () => props.qrText,
  () => {
    if (props.qrText) {
      generateQRCode();
    }
  },
);

function generateQRCode() {
  const options = {
    width: props.width,
    height: props.height,
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      light: "#1976D2",
      dark: quasar.dark.isActive ? "#03002c" : "#f5f5f5",
    },
  };
  QRCode.toDataURL(props.qrText, options)
    .then((url) => {
      qrcodeUrl.value = url;
    })
    .catch((error) => {
      console.error("QR code generation failed:", error);
    });
}

function openLinkInNewWindow() {
  const url = props.qrText;
  window.open(url, "_blank");
}
</script>
