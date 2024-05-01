<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="explanation-box text-justify q-pa-s">
      <ExplanationBox :title="t('keepsats_convert_title')" :text="t('keepsats_convert_text')" />
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
        :options="[
          { label: '', value: 'hbd', slot: 'hbd' },
          { label: '', value: 'hive', slot: 'hive' },
        ]"
        @update:model-value="(val) => updateDestination(val)"
      >
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
      <AmountSlider v-model="CurrencyCalc" />

      <!-- Payment buttons -->
      <div>
        <div class="row justify-center q-pa-sm">
          <div class="paywithsats-button flex column">
            <q-btn
              class="payment-button-sats q-ma-sm"
              @click="payWithApi"
              :loading="false"
              :disable="false"
              icon="fa-brands fa-btc"
              label="KeepSats"
              :color="buttonColor.buttonColor"
              :text-color="buttonColor.textColor"
              size="md"
              rounded
              icon-right="img:/site-logo/v4vapp-logo-shadows.svg"
            />
          </div>
        </div>
      </div>
      <!-- End Payment buttons -->
    </div>
    <AlternateCurrency v-model="CurrencyCalc" />
    <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { useHiveKeychainTransfer } from "src/use/useKeychain"
import { useKeepSatsConvert } from "src/use/useV4vapp"
import { useQuasar } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import AskHASDialog from "src/components/hive/AskHASDialog.vue"
import AmountSlider from "src/components/utils/AmountSlider.vue"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import { useI18n } from "vue-i18n"
const t = useI18n().t

const HASDialog = ref({ show: false })
const CurrencyCalc = ref({ amount: 1000, currency: "sats" })

const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()
const q = useQuasar()

const destination = ref("hive")

const privateMemo = ref(false)

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

function updateDestination(val) {
  destination.value = val
}

async function payWithApi() {
  console.log("payWithApi")
  try {
    let response
    response = await useKeepSatsConvert(
      CurrencyCalc.value.sats,
      destination.value.toUpperCase()
    )

    console.log("->>>>>> payment response: ", response)
    // extract the message from this response
    // paymentInProgressDialog.value.hide()
    if (response.success) {
      q.notify({
        color: "positive",
        timeout: 5000,
        message: response?.message,
        position: "top",
      })
    } else {
      const message = `${t("payment_failed")} - ${response?.message}`
      q.notify({
        color: "negative",
        timeout: 5000,
        message: message,
        position: "top",
      })
    }
    await new Promise((resolve) => setTimeout(resolve, 4000))
    await storeUser.update(false) // update the user bypass the cache
  } catch (e) {
    console.error("Error in payWithApi", e)
    q.notify({
      color: "negative",
      timeout: 5000,
      message: t("payment_failed"),
      position: "top",
    })
  }
}

async function makePayment(method) {
  const fixedAmount = parseFloat(CurrencyCalc.value.amount).toFixed(0)
  // Adds encryption to the memo 2024-02-23
  let memo = `${fixedAmount} #convertkeepsats #v4vapp`
  if (privateMemo.value) {
    memo = "#" + memo
  }

  if (method === "HiveKeychain") {
    if (!storeAPIStatus.isKeychainIn) {
      q.notify({
        message: t("keychain_not_installed"),
        color: "negative",
        icon: "error",
      })
      return
    }
    const result = await useHiveKeychainTransfer(
      storeUser.currentUser,
      0.001,
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
      amount: 0.001,
      currency: destination.value.toUpperCase(),
      memo: memo,
    }
  }
}

async function checkForSats(oldNetSats = 0, count = 0) {
  let currentSatsBalance = 0
  if (oldNetSats === 0) {
    currentSatsBalance = storeUser.currentKeepSats.net_sats
  } else {
    currentSatsBalance = oldNetSats
  }
  const change = await storeUser.updateSatsBalance(false)
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
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}

.explanation-box {
  max-width: 400px;
}


</style>
