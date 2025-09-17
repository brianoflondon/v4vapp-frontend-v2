<template>
  <!-- Amount Input -->
  <div
    class="flex row items-baseline amount-input-area pad-max-width full-width q-pa-sm"
  >
    <div class="col-9 q-pa-sm">
      <q-input
        class="amount-display"
        v-model="amount.txt"
        @update:model-value="(val) => updateAmounts(val, 'amount')"
        inputmode="decimal"
        pattern="\d*"
        :label="$t('amount')"
        stack-label
        debounce="20"
        @keyup.enter="enterPressed()"
        @keyup.esc="clearAmount(false)"
        :input-style="{ 'text-align': 'right' }"
        :rules="[(val) => !!val || t('no_amount')]"
        :error-message="errorMessage"
        :error="errorState"
        tabindex="1"
      >
        <!-- Use my Own code for the clearable button -->
        <template v-if="amount.txt" v-slot:append>
          <q-icon
            name="cancel"
            @click="clearAmount(true)"
            class="cursor-pointer"
          />
        </template>
      </q-input>
    </div>
    <!-- Currency Selector -->
    <div class="col-3 q-pa-sm amount-input-area">
      <q-select
        v-model="currencySelected"
        :options="currencyOptions"
        :label="$t('currency')"
        map-options
        @update:model-value="(val) => updateCurrencySelected(val)"
        dense
        tabindex="2"
      />
    </div>
  </div>
  <!-- Alternate currencies  -->
  <div class="pad-max-width full-width q-px-md" v-if="isPaymentValid">
    <AlternateCurrency
      v-model="CurrencyCalc"
      @currencyClicked="handleCurrencyClicked"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue"
import { useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import { tidyNumber } from "src/use/useUtils"
import { useStoreUser } from "src/stores/storeUser"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"

const t = useI18n().t
const q = useQuasar()

const emit = defineEmits(["amount", "currency", "amountCurrency"])
const props = defineProps({
  defaultCurrency: {
    type: String,
    default: "",
  },
  errorState: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
})
const storeUser = useStoreUser()

const currencyOptions = ref()
const currencySelected = ref("hbd")
const amount = ref({
  txt: "",
  num: 0,
})

const CurrencyCalc = ref({
  amount: 0,
  currency: "hbd",
  sats: 0,
  hive: 0,
  hbd: 0,
  local: 0,
  outOfRange: true,
})

onMounted(() => {
  if (!storeUser.pos?.receiveCurrency) {
    storeUser.pos.receiveCurrency = "hbd"
  }
  // Is there a local currency set? Add it to
  if (storeUser.localCurrency) {
    resetCurrencyOptions(storeUser.localCurrency)
  }
  if (storeUser.pos.currencySelected) {
    currencySelected.value = storeUser.pos.currencySelected
    CurrencyCalc.value.currency = currencySelected.value
  } else {
    currencySelected.value = "hbd"
    CurrencyCalc.value.currency = "hbd"
  }
  if (props.defaultCurrency) {
    currencySelected.value = props.defaultCurrency
    CurrencyCalc.value.currency = props.defaultCurrency
  }
})

/**
 * Updates the selected currency value.
 *
 * @param {any} val - The new value for the selected currency.
 */
function updateCurrencySelected(val) {
  currencySelected.value = val.value
  CurrencyCalc.value.currency = val.value
  storeUser.pos.currencySelected = val.value
  nextTick(() => {
    emitEverything()
  })
}

/**
 * Computed property that checks if the payment is valid.
 *
 * @returns {boolean} True if the payment is valid, false otherwise.
 */
const isPaymentValid = computed(() => {
  // Returns True if this payment screen can produce a QR code
  // Check if there is a running total, if that is 0 use the amount
  // on the screen
  if (amount.value.num === 0 || isNaN(amount.value.num)) {
    return false
  }
  return true
})

function enterPressed() {}

function parseLocalizedFloat(val) {
  const commaLocales = [
    "de-DE",
    "fr-FR",
    "it-IT",
    "es-ES",
    "nl-NL",
    "pt-PT",
    "ru-RU",
    "tr-TR",
    "pl-PL",
    "sv-SE",
    "da-DK",
    "fi-FI",
    "el-GR",
    // Add or remove locales as required
  ]

  const currentLocale = q.lang.getLocale()

  // Check if the current locale is in the list of comma locales
  if (commaLocales.includes(currentLocale)) {
    val = val.replace(".", "").replace(",", ".")
  }

  // Handle other locale-specific formats as necessary
  return parseFloat(val)
}

function clearAmount() {
  amount.value.txt = ""
  amount.value.num = 0
  CurrencyCalc.value.amount = 0
}

watch(
  () => storeUser.pos.fixedRate,
  () => {
    updateAmounts(amount.value.txt)
  }
)

function resetCurrencyOptions(localCurrency) {
  /**
   * FILEPATH: /Users/bol/Documents/dev/v4vapp/v4vapp-frontend-v2/src/pages/POSPage.vue
   *
   * Sets the value of the currencyOptions variable.
   *
   * @param {Array} value - The new value for the currencyOptions variable.
   */
  currencyOptions.value = [
    { label: "HBD", value: "hbd" },
    { label: "HIVE", value: "hive" },
    { label: "SATS", value: "sats" },
  ]
  if (localCurrency) {
    const localCurrencyOpt = {
      label: localCurrency.unit.toUpperCase(),
      value: localCurrency.value,
    }
    currencyOptions.value.unshift(localCurrencyOpt) // Add to the beginning
  }
}

function handleCurrencyClicked(currency) {
  // change amount to match the amount of the selected currency
  // modify this to use updateAmounts

  switch (currency) {
    case "hbd":
      amount.value.num = CurrencyCalc.value.hbd
      amount.value.txt = tidyNumber(CurrencyCalc.value.hbd, 2)
      break
    case "hive":
      amount.value.num = CurrencyCalc.value.hive
      amount.value.txt = tidyNumber(CurrencyCalc.value.hive, 2)
      break
    case "sats":
      amount.value.num = CurrencyCalc.value.sats
      amount.value.txt = tidyNumber(CurrencyCalc.value.sats, 0)
      break
    default:
      amount.value.num = CurrencyCalc.value.local
      amount.value.txt = tidyNumber(CurrencyCalc.value.local, 2)
  }
  CurrencyCalc.value.amount = amount.value.num
  currencySelected.value = currency
  CurrencyCalc.value.currency = currency
  storeUser.pos.currencySelected = currency
}

/**
 * Updates the amounts based on the given value.
 *
 * @param {any} val - The value used to update the amounts.
 */
function updateAmounts(val) {
  if (val === "" || val === null) {
    amount.value.num = 0
    return
  }
  amount.value.num = parseLocalizedFloat(val)
  CurrencyCalc.value.amount = amount.value.num
  nextTick(() => {
    emitEverything()
  })
}

function emitEverything() {
  emit("amount", amount.value.num)
  emit("currency", currencySelected.value)
  if (["hbd", "hive", "sats"].includes(currencySelected.value)) {
    emit("amountCurrency", {
      amount: amount.value.num,
      currency: currencySelected.value,
    })
  } else {
    emit("amountCurrency", {
      amount: CurrencyCalc.value.sats,
      currency: "sats",
    })
  }
}
</script>

<style lang="scss" scoped>
.amount-input-area {
  display: flex;
  justify-content: space-between;
}
.amount-display {
  font-size: 2rem;
}
</style>
