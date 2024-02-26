<template>
  <div class="q-pa-sm col justify-evenly">
    <div class="explanation-box text-justify q-pa-sm">
      <ExplanationBox title="Withdraw Sats to Hive" text="How to do it" />
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
</template>

<script setup>
import { ref, computed } from "vue"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useQuasar } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"


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
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}
</style>
