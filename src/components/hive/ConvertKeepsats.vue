<template>
  <div
    class="q-pa-sm col justify-evenly"
    v-if="storeUser.keepSatsBalanceNum > storeAPIStatus.minMax.sats.min"
  >
    <div class="explanation-box text-justify q-pa-sm">
      <ExplanationBox title="Convert Sats to Hive" text="How to do it" />
    </div>
    <div v-if="true" class="toggle pad-max-width">
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
      <div class="amount-input">
        <q-input
          class="amount-display"
          v-model="amount"
          inputmode="decimal"
          pattern="\d*"
          :label="$t('amount')"
          stack-label
          debounce="20"
          :input-style="{ 'text-align': 'right' }"
        >
        </q-input>
      </div>
      <div class="amount-slider">
        <q-slider
          v-model="amount"
          color="primary"
          :min="storeAPIStatus.minMax.sats.min"
          :max="storeUser.keepSatsBalanceNum"
          label
          label-always
          snap
          markers
          :step="100"
          :label-value="`${amount}`"
        />
      </div>
      <div>
        <div class="pay-buttons">
          <div class="payment-buttons row justify-evenly">
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
      </div>
    </div>
  </div>
  <AlternateCurrency v-model="CurrencyCalc" />
  <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { useHiveKeychainTransfer } from "src/use/useKeychain"
import { useQuasar } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import AskHASDialog from "src/components/hive/AskHASDialog.vue"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"

const HASDialog = ref({ show: false })
const CurrencyCalc = ref({ amount: 1000, currency: "sats" })

const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()
const q = useQuasar()

const destination = ref("hive")
const amount = ref(1000)

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

watch(amount, (val) => {
  CurrencyCalc.value.amount = val
})

async function makePayment(method) {
  console.log("makePayment")

  const fixedAmount = parseFloat(amount.value).toFixed(0)
  // Adds encryption to the memo 2024-02-23
  const memo = `#${fixedAmount} #convertkeepsats #v4vapp`
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
      amount: 0.001,
      currency: destination.value.toUpperCase(),
      memo: memo,
    }
  }
}

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
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}
</style>
