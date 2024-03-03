<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="text-justify q-pa-sm">
      <ExplanationBox title="KeepSats on V4V.app" text="How to do it" />
    </div>
    <div class="destination-toggle pad-max-width">
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
      <!-- End of Toggle -->
      <!-- Amount input -->
      <q-slide-transition appear disappear :duration="500">
        <div v-if="destination != 'sats'">
          <div class="amount-input">
            <q-input
              class="amount-display"
              v-model="amount"
              inputmode="decimal"
              pattern="\d*"
              :label="$t('amount')"
              stack-label
              clearable
              debounce="20"
              @update:model-value="(val) => updateAmount(val)"
              :input-style="{ 'text-align': 'right' }"
              :rules="[(val) => !!val || t('no_amount')]"
            >
            </q-input>
          </div>
          <div class="amount-slider">
            <q-slider
              v-model="amount"
              color="primary"
              :min="sliderMinMax.min"
              :max="sliderMinMax.max"
              label
              label-always
              snap
              markers
              :step="sliderMinMax.step"
              :label-value="`${amount}`"
              @update:model-value="(val) => updateAmount(val)"
            />
          </div>
        </div>
      </q-slide-transition>
      <!-- End of Amount input -->
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
      <div class="payment-buttons row justify-evenly" v-else>
        <div>
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
        <div>
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
      </div>
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
import { computed, watch, ref, onMounted } from "vue"
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

const t = useI18n().t
const q = useQuasar()

const HASDialog = ref({ show: false })
const storeUser = useStoreUser()
const storeApiStatus = useStoreAPIStatus()
const loading = ref(false)
const destination = ref("sats")
const qrCode = ref("") // QrCode object emitted from CreateQRCode

const bech32 = ref("")
const amount = ref(1)

const CurrencyCalc = ref({})

const dotColor = computed(() => {
  let isLightning = destination.value === "sats"
  return QRLightningHiveColor(isLightning, loading.value)
})

const sliderMinMax = computed(() => {
  if (storeApiStatus.minMax) {
    let min = storeApiStatus.minMax[destination.value.toUpperCase()].min
    let max = storeApiStatus.minMax[destination.value.toUpperCase()].max

    min = Math.min(min, storeUser.balancesNum[destination.value.toLowerCase()])
    max = Math.min(max, storeUser.balancesNum[destination.value.toLowerCase()])
    const diff = max - min

    // Divide the difference by 100 to get the initial step size
    let step = diff / 100

    // Calculate the power of 10 for the step size
    const power = Math.floor(Math.log10(step))

    // Round the step size to the nearest power of 10
    step = Math.pow(10, power)
    console.log("min", min, "max", max, "step", step)
    return { min: min, max: max, step: step }
  }
  return { min: 1, max: 400, step: 1 }
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

onMounted(async () => {
  updateDestination()
})

watch(storeUser, (val) => {
  console.log("storeUser changed DepositKeepSats", val)
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
  // console.log(calcFees(val).sats)
  amount.value = val
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

  console.log("fee", fee, exchangeRate)
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
  console.log("makePayment")
  if (destination.value === "sats") {
    return
  }

  const fixedAmount = parseFloat(amount.value).toFixed(3)

  // Adds encryption to the memo 2024-02-23
  const memo = `#${storeUser.currentUser} Deposit to #SATS`
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
    console.log("pay result", result)
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
  console.log("checkForSats", oldNetSats, count)
  let currentSatsBalance = 0
  if (oldNetSats === 0) {
    currentSatsBalance = storeUser.currentKeepSats.net_sats
  } else {
    currentSatsBalance = oldNetSats
  }
  console.log("currentSatsBalance", currentSatsBalance)
  const change = await storeUser.updateSatsBalance(false)
  console.log("change", change)
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
.explanation-box {
  max-width: 300px;
}

.amount-display {
  font-size: 2rem;
}
</style>
