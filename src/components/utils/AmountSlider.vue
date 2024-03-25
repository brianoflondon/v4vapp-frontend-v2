<template>
  <div class="amount-input">
    <q-input
      class="amount-display"
      v-model="localAmount"
      :disable="isDisabled"
      inputmode="decimal"
      pattern="\d*"
      :label="$t('amount')"
      stack-label
      clearable
      debounce="1000"
      @update:model-value="(val) => updateAmount(val)"
      :input-style="{ 'text-align': 'right' }"
      :rules="[(val) => !!val || t('no_amount')]"
    >
    </q-input>
  </div>
  <div class="amount-slider">
    <q-slider
      v-model="localAmount"
      color="primary"
      :min="sliderMinMax.min"
      :max="sliderMinMax.max"
      :disable="isDisabled"
      label
      label-always
      snap
      markers
      :step="sliderMinMax.step"
      :label-value="localAmount"
      @update:model-value="(val) => updateAmount(val)"
    ></q-slider>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, defineEmits } from "vue"
import { useI18n } from "vue-i18n"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"

const t = useI18n().t
const storeUser = useStoreUser()
const storeApiStatus = useStoreAPIStatus()

const localAmount = ref(0)
const AmountCurrency = defineModel()

const emit = defineEmits(["amountUpdated"])

onMounted(() => {
  if (storeApiStatus.minMax) {
    if (AmountCurrency.value.currency === "sats") {
      updateAmount(parseInt(sliderMinMax.value.mid))
    } else {
      updateAmount(parseFloat(sliderMinMax.value.mid).toFixed(2))
    }
  }
})

const isDisabled = computed(() => {
  if (sliderMinMax.value.diff) {
    return true
  }
  return false
})

const sliderMinMax = computed(() => {
  let dest = AmountCurrency.value.currency.toUpperCase()
  if (storeApiStatus.minMax) {
    let min = 1
    let max = 400
    if (dest === "SATS") {
      dest = "sats"
      min = storeApiStatus.minMax.sats.min
      max = Math.min(
        storeUser.keepSatsBalanceNum,
        storeApiStatus.minMax.sats.max
      )
    } else {
      min = storeApiStatus.minMax[dest].min
      max = storeApiStatus.minMax[dest].max

      min = Math.min(min, storeUser.balancesNum[dest.toLowerCase()])
      max = Math.min(max, storeUser.balancesNum[dest.toLowerCase()])
    }
    const diff = max - min

    // Divide the difference by 100 to get the initial step size
    let step = diff / 100

    // Calculate the power of 10 for the step size
    const power = Math.floor(Math.log10(step))

    // Round the step size to the nearest power of 10
    step = Math.pow(10, power)
    const mid = diff / 2 + min
    return { min: min, max: max, step: step, mid: mid }
  }
  return { min: 1, max: 400, step: 1, diff: 200 }
})

function updateAmount(val) {
  if (val === null || val === undefined || val === "" || val === 0) {
    val = parseInt(sliderMinMax.value.mid)
    localAmount.value = val
    AmountCurrency.value.amount = val
  }
  AmountCurrency.value.amount = parseFloat(val)
  localAmount.value = parseFloat(val)
  emit("amountUpdated", localAmount.value)
}
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}
</style>
