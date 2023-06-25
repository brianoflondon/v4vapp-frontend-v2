<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <pre
        >{{ qrText }}
      </pre>
      <pre>
        {{ hiveAccname }}
      </pre>
      <div>
        <CreateQRCode :qr-text="qrText" :hive-accname="hiveAccname" />
      </div>
      <div>
        <q-input></q-input>
      </div>
    </div>
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

console.log(storeUser)

</script>

<style lang="scss" scoped></style>
