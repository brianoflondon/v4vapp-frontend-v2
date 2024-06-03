<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="explanation-box text-justify q-pa-sm">
      <div class="pad-max-width">
        <ExplanationBox
          :title="t('keepsats_deposit_title')"
          :text="t('keepsats_deposit_text')"
        />
      </div>
    </div>
    <div class="destination-toggle pad-max-width">
      <!-- HBD Hive and Sats toggle -->
      <q-btn-toggle
        spread
        v-model="destination"
        push
        dense
        glossy
        toggle-color="primary"
        :options="options"
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
      <!-- End HBD Hive and Sats toggle -->
      <q-slide-transition appear disappear :duration="500">
        <div v-if="destination != 'sats'">
          <AmountSlider
            v-model="CurrencyCalc"
            @amountUpdated="(val) => updateAmount(val)"
            @panning="(val) => (loading = val)"
          />
        </div>
      </q-slide-transition>
    </div>
    <div
      class="row justify-center address-qr-code q-pa-sm"
      @click="makePayment"
    >
      <div>
        <CreateQRCode
          :qr-text="destination === 'sats' ? qrCodeSats : qrCodeHive"
          :loading="loading"
          :hive-accname="storeUser.currentUser"
          :width="300"
          :height="300"
          :color="dotColor"
          @qr-code="(val) => (qrCode = val)"
        />
      </div>
    </div>
    <div class="pay-buttons-lightning-address-copy">
      <div
        class="lightning-address-copy_button q-pa-sm"
        v-if="destination === 'sats'"
      >
        <q-btn
          spread
          :label="lightningAddress"
          icon="content_copy"
          @click="copyText"
          name="amount"
          rounded
          color="primary"
          style="text-transform: lowercase"
        >
        </q-btn>
        <!-- Important that tooltip is not in the button -->
        <q-tooltip>{{ $t("copy_qrcode") }}</q-tooltip>
      </div>
      <!-- Payment buttons -->
      <div class="payment-buttons row justify-evenly items-center" v-else>
        <div class="q-pa-sm">
          <q-btn
            class="payment-button-hive"
            @click="makePayment('HiveKeychain')"
            :loading="false"
            :disable="false"
            icon="img:/keychain/hive-keychain-round.svg"
            icon-right="img:avatars/hive_logo_dark.svg"
            label="Keychain"
            :color="buttonColor.buttonColor"
            :text-color="buttonColor.textColor"
            size="md"
            rounded
          />
        </div>
        <div class="q-pa-sm">
          <q-btn
            class="payment-button-hive"
            @click="makePayment('HAS')"
            :loading="false"
            :disable="false"
            icon="img:/has/hive-auth-logo.svg"
            icon-right="img:avatars/hive_logo_dark.svg"
            label="HAS"
            :color="buttonColor.buttonColor"
            :text-color="buttonColor.textColor"
            size="md"
            rounded
          />
        </div>
        <!-- Private Memo toggle  -->
        <div class="private-memo-toggle q-pa-sm">
          <q-toggle
            v-model="privateMemo"
            icon="lock"
            size="xl"
            color="primary"
            dense
            flat
            toggle-aria-label="Use a Private Hive Memo (needs Memo Key)"
          />
          <q-tooltip>{{ $t("private_memo") }} </q-tooltip>
        </div>
        <!-- End Private Memo toggle  -->
      </div>
      <!-- End Payment buttons -->
    </div>
    <div
      v-if="destination !== 'sats'"
      class="alternate-currency-display q-pt-sm q-pb-none"
    >
      <AlternateCurrency v-model="CurrencyCalc" />
    </div>
  </div>
  <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
</template>

<script setup>
import { computed, watch, ref, onMounted, defineProps } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import CreateQRCode from "components/qrcode/CreateQRCode.vue"
import { useQuasar, copyToClipboard } from "quasar"
import { useI18n } from "vue-i18n"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import { QRLightningHiveColor } from "src/use/useUtils"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import AskHASDialog from "src/components/hive/AskHASDialog.vue"
import { useGenerateHiveTransferOp } from "src/use/useHive"
import { useHiveKeychainTransfer } from "src/use/useKeychain"
import { serverHiveAccount } from "src/boot/axios"
import { encodeOp } from "hive-uri"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import AmountSlider from "src/components/utils/AmountSlider.vue"

const t = useI18n().t
const q = useQuasar()

const options = ref([{ label: "", value: "sats", slot: "lightning" }])

const HASDialog = ref({ show: false })
const storeUser = useStoreUser()
const storeApiStatus = useStoreAPIStatus()
const loading = ref(false)
const destination = ref("sats")
const qrCode = ref("") // QrCode object emitted from CreateQRCode
const privateMemo = ref(false)

const bech32 = ref("")
const amount = ref(0)

const CurrencyCalc = ref({ amount: 0, currency: "hbd" })

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

const qrCodeHive = computed(() => {
  const op = useGenerateHiveTransferOp(
    storeUser.currentUser,
    serverHiveAccount,
    parseFloat(amount.value),
    destination.value,
    `${storeUser.currentUser} Deposit to #SATS`
  )
  return encodeOp(op)
})

const qrCodeSats = computed(() => {
  return bech32.value
})

const props = defineProps({
  justHive: {
    type: Boolean,
    default: false,
  },
})

onMounted(async () => {
  console.log("ReceiveKeepsats.vue mounted", props.justHive)
  if (props.justHive) {
    options.value = [
      { label: "", value: "hbd", slot: "hbd" },
      { label: "", value: "hive", slot: "hive" },
    ]
    destination.value = "hbd"
  }
  updateDestination()
})

watch(storeUser, (val) => {
  if (val) {
    updateDestination()
  }
})

async function updateDestination() {
  CurrencyCalc.value = {
    amount: parseFloat(amount.value),
    currency: destination.value,
  }
  updateAmount(amount.value)
  loading.value = true
  const bech32Data = await storeUser.bech32Address("sats")
  bech32.value = bech32Data.prefix
  loading.value = false
}

function updateAmount(val) {
  amount.value = parseFloat(val)
  CurrencyCalc.value = {
    amount: parseFloat(val),
    currency: destination.value,
  }
}

// Calculates the fees charged in the same currency Hive/HBD as
// the amount being sent.
function calcFees(amount) {
  const { currencyToSend, amountToSend } = {
    currencyToSend: destination.value,
    amountToSend: amount,
  }
  const { HBDSatsNumber, hiveSatsNumber, apiStatus } = storeApiStatus

  const exchangeRate = currencyToSend === "HBD" ? HBDSatsNumber : hiveSatsNumber
  const rawSats = parseFloat(amountToSend) * exchangeRate

  const fee =
    rawSats * apiStatus.config.conv_fee_percent + apiStatus.config.conv_fee_sats

  return { currency: fee / exchangeRate, sats: fee }
}

function copyText() {
  copyToClipboard(lightningAddress.value)
  quasar.notify({
    message: t("copied"),
    color: "positive",
    icon: "check_circle",
  })
}

async function makePayment(method) {
  if (destination.value === "sats") {
    return
  }

  const fixedAmount = parseFloat(amount.value).toFixed(3)

  // Adds encryption to the memo 2024-02-23
  let memo = `${storeUser.currentUser} Deposit to #SATS`
  if (privateMemo.value) {
    memo = "#" + memo
  }

  if (method === "HiveKeychain") {
    if (!storeApiStatus.isKeychainIn) {
      q.notify({
        message: t("keychain_not_installed"),
        color: "negative",
        icon: "error",
      })
      return
    }
    const result = await useHiveKeychainTransfer(
      storeUser.currentUser,
      fixedAmount,
      destination.value.toUpperCase(),
      memo
    )
    if (result.success) {
      q.notify({
        avatar: "/site-logo/v4vapp-logo.svg",
        message: result.message,
        color: "positive",
        icon: "check_circle",
      })
      checkForSats()
    } else {
      q.notify({
        message: result.message,
        color: "negative",
        icon: "error",
      })
    }
  }
  if (method === "HAS") {
    HASDialog.value.show = true
    HASDialog.value.payment = {
      username: storeUser.currentUser,
      amount: fixedAmount,
      currency: destination.value.toUpperCase(),
      memo: memo,
    }
  }
}

watch(
  HASDialog,
  async (value) => {
    if (value) {
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_nack") {
        const message = `${t("rejected_payment")}`
        q.notify({
          color: "negative",
          avatar: "/site-logo/v4vapp-logo.svg",
          timeout: 5000,
          message: message,
          position: "top",
        })
      }
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_ack") {
        const message = `${t("payment_sent")}`
        q.notify({
          avatar: "/site-logo/v4vapp-logo.svg",
          color: "positive",
          group: false,
          timeout: 3000,
          message: message,
          position: "top",
        })
        checkForSats()
      }
    }
  },
  { deep: true }
)
async function checkForSats(oldNetSats = 0, count = 0) {
  let currentSatsBalance = 0
  if (oldNetSats === 0) {
    currentSatsBalance = storeUser.currentKeepSats.net_sats
  } else {
    currentSatsBalance = oldNetSats
  }
  await storeUser.updateSatsBalance(false)
  if (currentSatsBalance != storeUser.currentKeepSats.net_sats) {
    q.notify({
      message: `You now have ${storeUser.currentKeepSats.net_sats} KeepSats`,
      color: "positive",
      icon: "check_circle",
    })
    // quit checking
    return
  }

  if (count > 10) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 1000 * 5))
  return checkForSats(currentSatsBalance, count + 1)
}

const buttonColors = {
  // dark mode is true, light mode is false
  true: {
    buttonColor: "grey-10",
    textColor: "white-4",
  },
  false: {
    buttonColor: "grey-6",
    textColor: "grey-9",
  },
}

const buttonColor = computed(() => {
  const colours = buttonColors[q.dark.isActive]
  return colours
})
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}

.explanation-box {
  max-width: 400px;
}
</style>
