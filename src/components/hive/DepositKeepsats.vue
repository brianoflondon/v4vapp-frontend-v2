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
      />
    </div>
    <div>
        <div class="payment-buttons column q-pt-sm" v-show="true">
          <div class="row justify-center q-pa-sm" v-if="true">
            <div class="pay-with-sats-button">
              <q-btn
                class="payment-button-sats"
                @click="payInvoice('payWithSats', 'HiveKeychain')"
                :loading="storeApiStatus.payInvoice"
                :disable="storeApiStatus.payInvoice"
                icon="fa-brands fa-btc"
                :label="payWithSatsButton"
                :color="buttonColor.buttonColor"
                :text-color="buttonColor.textColor"
                size="md"
                rounded
              />
            </div>
          </div>

          <div class="keychain-buttons row flex-center q-pb-sm q-gutter-lg">
            <q-btn
              class="payment-button-hbd"
              @click="payInvoice('HBD', 'HiveKeychain')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/keychain/hive-keychain-round.svg"
              icon-right="img:/avatars/hbd_logo.svg"
              :label="HBD"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
            <q-btn
              class="payment-button-hive"
              @click="payInvoice('HIVE', 'HiveKeychain')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/keychain/hive-keychain-round.svg"
              icon-right="img:avatars/hive_logo_dark.svg"
              :label="Hive"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
          <div class="has-buttons row flex-center q-gutter-lg">
            <q-btn
              class="payment-button-hbd"
              @click="payInvoice('HBD', 'HAS')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/has/hive-auth-logo.svg"
              icon-right="img:/avatars/hbd_logo.svg"
              :label="HBD"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
            <q-btn
              class="payment-button-hive"
              @click="payInvoice('HIVE', 'HAS')"
              :loading="storeApiStatus.payInvoice"
              :disable="storeApiStatus.payInvoice"
              icon="img:/has/hive-auth-logo.svg"
              icon-right="img:avatars/hive_logo_dark.svg"
              :label="Hive"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
            />
          </div>
        </div>


    </div>

    <div class="address-qr-code q-pa-sm">
      <CreateQRCode
        :qr-text="lightningAddressPrefix"
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
import { computed, watch, ref } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useQuasar, copyToClipboard } from "quasar"
import { useI18n } from "vue-i18n"

const t = useI18n().t
const quasar = useQuasar()

const storeUser = useStoreUser()
const loading = ref(false)
const destination = ref("sats")

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

watch(storeUser, async (val) => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 100))
  loading.value = false
})

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
