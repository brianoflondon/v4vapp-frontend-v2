<template>
  <div class="q-pa-sm col justify-evenly">

    <div class="toggle pad-max-width">
      <q-btn-toggle
        spread
        v-model="destination"
        push
        dense
        glossy
        toggle-color="primary"
        :options="[
          { label: 'sats', value: 'sats' },
          { label: 'HBD', value: 'hbd' },
          { label: 'Hive', value: 'hive' },
        ]"
        @update:model-value="(val) => updateDestination(val)"
      />
    </div>
    <div class="address-qr-code q-pa-sm">
      <CreateQRCode
        :qr-text="qrCodeText"
        :loading="loading"
        :hive-accname="storeUser.currentUser"
        :width="300"
        :height="300"
        @qr-code="(val) => (qrCode = val)"
      />
    </div>
    <div class="address-copy-button q-pa-sm">
      <q-btn
        spread
        :label="lightningAddress"
        icon="content_copy"
        @click="copyText"
        name="amount"
        rounded
        color="primary"
        style="text-transform: lowercase"
        ><q-tooltip>{{ $t("copy_qrcode") }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useQuasar, copyToClipboard } from "quasar"
import { useI18n } from "vue-i18n"

const t = useI18n().t
const quasar = useQuasar()

const storeUser = useStoreUser()
const loading = ref(false)
const destination = ref("sats")
const qrCode = ref("") // QrCode object emitted from CreateQRCode
const qrCodeText = ref("")

const lightningAddressPrefix = computed(() => {
  if (!storeUser.currentUser) {
    return ""
  }
  const path =
    destination.value === "hive" ? "v4v.app" : `${destination.value}.v4v.app`
  const address = `lightning:${storeUser.currentUser}@${path}`
  return address
})

const lightningAddress = computed(() => {
  if (!storeUser.currentUser) {
    return ""
  }
  const path =
    destination.value === "hive" ? "v4v.app" : `${destination.value}.v4v.app`
  const address = `${storeUser.currentUser}@${path}`
  return address
})

onMounted(() => {
  updateDestination(destination.value)
})

watch(storeUser, async (val) => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 100))
  loading.value = false
})

function updateDestination(val) {
  console.log(val)
  if (val === "sats") {
    qrCodeText.value = lightningAddressPrefix.value
  } else {
    qrCodeText.value = storeUser.currentUser
  }
}

function copyText() {
  copyToClipboard(lightningAddress.value)
  quasar.notify({
    message: t("copied"),
    color: "positive",
    icon: "check_circle",
  })
}
</script>

<style lang="scss" scoped></style>
