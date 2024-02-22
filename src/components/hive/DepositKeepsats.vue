<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="explanation-box text-justify q-pa-sm">
      <ExplanationBox title="KeepSats on V4V.app" text="How to do it" />
    </div>
    <div class="toggle pad-max-width">
      <q-btn-toggle
        spread
        v-model="destination"
        push
        dense
        glossy
        toggle-color="primary"
        :options="[
          { label: '', value: 'sats', slot: 'lightning' },
          { label: '', value: 'hbd', slot: 'hbd' },
          { label: '', value: 'hive', slot: 'hive' },
        ]"
        @update:model-value="(val) => updateDestination(val)"
      >
        <template #lightning>
          <div class="row items-center q-pa-none" style="font-size: 1.2rem">
            <div><i class="fa-sharp fa-solid fa-bolt" /></div>
            <div><i class="fa-brands fa-btc" /></div>
          </div>
        </template>
        <!-- HBD Button -->
        <template #hbd>
          <div class="column items-center q-pa-none" style="font-size: 1.2rem">
            <div><HbdLogoIcon /></div>
            <div class="text-center" style="font-size: 0.5rem; margin: -8px">
              HBD
            </div>
          </div>
        </template>
        <!-- Hive Button -->
        <template #hive>
          <div class="column items-center q-pa-none" style="font-size: 2.05rem">
            <div><i class="fa-brands fa-hive" /></div>
            <div class="text-center" style="font-size: 0.5rem; margin: -8px">
              Hive
            </div>
          </div>
        </template>
      </q-btn-toggle>
    </div>
    <div class="address-qr-code q-pa-sm">
      <CreateQRCode
        :qr-text="qrCodeTexts[destination]"
        :loading="loading"
        :hive-accname="storeUser.currentUser"
        :width="300"
        :height="300"
        :color="dotColor"
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
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import { QRLightningHiveColor } from "src/use/useUtils"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
const t = useI18n().t
const quasar = useQuasar()

const storeUser = useStoreUser()
const loading = ref(false)
const destination = ref("sats")
const qrCode = ref("") // QrCode object emitted from CreateQRCode
const qrCodeText = ref("")
const qrCodeTexts = ref({
  sats: "",
  hbd: "",
  hive: "",
})
const bech32 = ref("")

const dotColor = computed(() => {
  let isLightning = destination.value === "sats"
  return QRLightningHiveColor(isLightning, loading.value)
})

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

onMounted(async () => {
  updateDestination(destination.value)
  loading.value = true
  //   qrCodeText.value['sats'] = lightningAddress.value
  const bech32Data = await storeUser.bech32Address('sats')
  bech32.value = bech32Data.prefix
  qrCodeTexts.value = {
    sats: bech32.value,
    hbd: "HBD",
    hive: "HIVE",
  }
  loading.value = false
})

watch(storeUser, async (val) => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 100))
  loading.value = false
})

function updateDestination(val) {
  console.log(val)
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

<style lang="scss" scoped>
.explanation-box {
  max-width: 300px;
}
</style>
