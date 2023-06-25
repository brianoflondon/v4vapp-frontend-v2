<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div>
        <CreateQRCode
          qr-text="lightning:brianoflondon@v4v.app"
          hive-accname="brianoflondon"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
</script>

<style lang="scss" scoped></style>
