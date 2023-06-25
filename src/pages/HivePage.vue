<template>
  <q-page>
    <q-card
      rounded
      class="outer-wrapper row justify-center q-gutter-sm q-pt-lg"
    >
      <div>
        <CreateQRCode :qr-text="qrText" :hive-accname="hiveAccname" />
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { computed, ref } from "vue"
import { useStoreUser } from "src/stores/storeUser"
const storeUser = useStoreUser()
// const qrText = ref("lighting:")
// const hiveAccname = ref("")

const qrText = computed(() => {
  return "lightning:" + storeUser.hiveAccname + "@v4v.app"
})

const hiveAccname = computed(() => {
  return storeUser.hiveAccname
})
</script>

<style lang="scss" scoped></style>
