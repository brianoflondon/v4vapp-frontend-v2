<template>
  <q-page>
    <q-card
      rounded
      class="outer-wrapper row justify-center q-gutter-sm q-pt-lg"
    >
      <q-card-section>
        <HiveSelectFancyAcc dense v-model="selectionObject" fancy-options />
      </q-card-section>
      <q-card-section>
        <q-btn-toggle
          v-model="hiveHbd"
          push
          glossy
          toggle-color="primary"
          :options="[
            { label: 'HBD', value: 'hbd' },
            { label: 'Hive', value: 'hive' },
          ]"
        />
      </q-card-section>
      <q-card-section>
        <CreateQRCode :qr-text="qrText" :hive-accname="selectionObject.value" />
      </q-card-section>
      <q-card-section>
        <q-btn
          :label="$t('amount')"
          name="Share QR Code"
          rounded
          color="primary"
          text-color="black"
          @click="shareQRCode"
        >
          <q-tooltip>{{ $t("share_qr_code") }}</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { computed, ref } from "vue"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import { useStoreUser } from "src/stores/storeUser"
const storeUser = useStoreUser()
const hiveHbd = ref("hbd")
const selectionObject = ref({ label: "", value: "", caption: "" })

if (storeUser.currentUser) {
  selectionObject.value = {
    label: storeUser.hiveAccname,
    value: storeUser.hiveAccname,
    caption: storeUser.profileName,
  }
}

const qrText = computed(() => {
  return "lightning:" + getHiveHbdAddress(selectionObject.value.value)
})

function getHiveHbdAddress(username) {
  if (hiveHbd.value === "hbd") {
    return username + `@hbd.v4v.app`
  } else {
    return username + `@v4v.app`
  }
}

const hiveAccname = computed(() => {
  return storeUser.hiveAccname
})
</script>

<style lang="scss" scoped></style>
