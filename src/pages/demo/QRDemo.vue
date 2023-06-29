<template>
  <div class="">
    <div>
      <q-input v-model="qrText" style="max-width: 300px"></q-input>
    </div>
    <div>
      <q-btn-toggle
        v-model="loading"
        rounded
        flat
        dense
        glossy
        :options="[
          { label: 'True', value: true },
          { label: 'False', value: false },
        ]"
      />
    </div>
  </div>
  <div>
    <CreateQRCode
      :qr-text="qrText"
      hiveAccname="v4vapp"
      :loading="loading"
      @qr-code="val = qrCode = val"
    />
  </div>
  <div>
    <p>Some text after the QR code</p>
    <p>{{ qrText }} - loading: {{ loading }}</p>
  </div>
</template>

<script setup>
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import { ref } from "vue"
const qrText = ref("lightning:v4vapp@v4v.app")
const loading = ref(false)
const qrCode = ref()
</script>

<style lang="scss" scoped></style>
