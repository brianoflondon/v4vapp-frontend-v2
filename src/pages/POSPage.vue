<template>
  <q-page>
    <div class="debug-only">POSPage.vue</div>
    <div>
      <ConfettiExplosion v-if="visible" />
    </div>
    <div class="flex column text-center items-center q-pa-none">
      <q-tabs v-model="currentTab" align="center" dense animated swipeable>
        <q-route-tab
          :to="`/pos/sales${
            route.params.hiveAccTo ? '/@' + route.params.hiveAccTo : ''
          }`"
          name="sales"
          icon="storefront"
          :label="$t('sales')"
        />
        <q-route-tab
          :to="`/pos/history${
            route.params.hiveAccTo ? '/@' + route.params.hiveAccTo : ''
          }`"
          name="history"
          icon="receipt_long"
          :label="$t('history')"
        />
        <q-route-tab
          :to="`/pos/currency${
            route.params.hiveAccTo ? '/@' + route.params.hiveAccTo : ''
          }`"
          name="currency"
          icon="currency_exchange"
          :label="$t('currency')"
        />
      </q-tabs>
      <q-tab-panels v-model="currentTab">
        <q-tab-panel v-show="false" name="sales">
          <div></div>
        </q-tab-panel>
        <q-tab-panel name="history">
          <div class="div flex row pad-max-width full-width q-px-xs q-py-xs">
            <ListTransactions
              v-model="KeychainDialog"
              @update-fields="handleRetryTransaction"
            ></ListTransactions>
          </div>
        </q-tab-panel>
        <q-tab-panel name="currency">
          <div class="flex row pad-max-width full-width q-px-xs q-py-xs">
            <LocalCurrency />
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <!-- Pay To bar -->
      <!-- Pre-selected user name from path -->
      <div
        v-if="route.params.hiveAccTo"
        class="div flex row pad-max-width full-width items-center q-pa-sm q-pt-md"
      >
        <div class="col-10">
          <PosHeader />
        </div>
      </div>
      <!-- Select a user and Local Currency Settings -->
      <div
        class="div flex row pad-max-width full-width items-start q-pa-sm q-pt-lg q-pb-md"
        v-else
      >
        <div class="col-11 q-px-sm">
          <div class="pad-max-width full-width">
            <!-- <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options /> -->
            <HiveInputAcc v-model="hiveAccTo" :prefix="t('pay_to')">
            </HiveInputAcc>
          </div>
        </div>
        <!-- Button to Show bookmark settings -->
        <div class="div col-1 q-px-none">
          <div class="q-px-xs">
            <q-btn dense round icon="bookmark" @click="bookmarkSite">
              <q-tooltip>
                <a :href="`/pos/@${hiveAccTo.value}/`">
                  <q-icon name="bookmark" class="cursor-pointer" />
                  v4v.app/pos/@{{ hiveAccTo.value }}
                </a>
              </q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
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
          />
        </div>
        <!-- Show fixed set rate Bar -->
        <div
          dense
          class="q-pa-none full-width items-baseline bg-primary text-white"
        >
          <div
            class="fixed-rate-banner"
            v-if="
              storeUser.pos.fixedRate &&
              currencySelected === storeUser.localCurrency.value
            "
          >
            <SetRateBar
              @click="KeychainDialog.settings = !KeychainDialog.settings"
            />
          </div>
        </div>
      </div>
      <!-- Memo -->
      <div class="memo-input flex pad-max-width full-width q-px-md q-py-xs">
        <q-input
          clearable
          v-model="memoInput"
          class="full-width"
          :label="t('memo')"
          :rules="[(val) => !memoHasPipe || $t('memo_pipe')]"
        >
        </q-input>
      </div>
      <!-- Pay buttons -->
      <div class="pad-max-width full-width q-px-md q-py-md q-gutter-sm">
        <!-- HBD Button -->
        <div v-if="storeUser.pos.receiveCurrency === 'hbd'">
          <q-btn
            color="secondary"
            @click="showPaymentQR('hbd')"
            :disable="!isPaymentValid"
          >
            <div class="column items-center q-px-md" style="font-size: 1.2rem">
              <div><HbdLogoIcon /></div>
              <div class="text-center" style="font-size: 0.5rem; margin: -8px">
                HUSD
              </div>
            </div>
            <div class="q-px-md" style="font-size: 1.2rem">
              {{ tidyNumber(CurrencyCalc.hbd, 2) }}
            </div>
            <div class="q-px-none">
              <q-icon name="qr_code_2"></q-icon>
            </div>
          </q-btn>
        </div>
        <!-- Hive Button -->
        <div v-else-if="storeUser.pos.receiveCurrency === 'hive'">
          <q-btn
            color="primary"
            @click="showPaymentQR('hive')"
            :disable="!isPaymentValid"
          >
            <div
              class="column items-center q-pa-none"
              style="font-size: 2.05rem"
            >
              <div><i class="fa-brands fa-hive" /></div>
              <div class="text-center" style="font-size: 0.5rem; margin: -8px">
                Hive
              </div>
            </div>
            <div class="q-px-md" style="font-size: 1.2rem">
              {{ tidyNumber(CurrencyCalc.hive, 2) }}
            </div>
            <div class="q-px-none">
              <q-icon name="qr_code_2"></q-icon>
            </div>
          </q-btn>
        </div>
        <!-- Sats Button -->
        <div v-else-if="storeUser.pos.receiveCurrency === 'sats'">
          <q-btn
            color="deep-orange-14"
            @click="showPaymentQR('sats')"
            :disable="CurrencyCalc.outOfRange"
            no-caps
          >
            <div
              class="column items-center q-pa-none"
              style="font-size: 2.05rem"
            >
              <div><i class="fa-brands fa-btc" /></div>
              <div class="text-center" style="font-size: 0.5rem; margin: -8px">
                KeepSats
              </div>
            </div>
            <div class="q-px-md" style="font-size: 1.2rem">
              {{ tidyNumber(CurrencyCalc.sats, 0) }}
            </div>
            <div class="q-px-none">
              <q-icon name="qr_code_2"></q-icon>
            </div>
          </q-btn>
        </div>
        <!-- Alternate currencies  -->
        <div class="pad-max-width full-width q-px-md" v-if="isPaymentValid">
          <AlternateCurrency
            v-model="CurrencyCalc"
            @currencyClicked="handleCurrencyClicked"
          />
        </div>
      </div>
      <!-- Settings area -->
      <div class="flex row full-width pad-max-width">
        <!-- Fixed User Bookmark Link -->
        <div class="col-12 q-px-sm q-py-lg">
          <!-- bookmark icon -->
          <div v-if="!hiveAccTo.valid"></div>
          <div v-else>
            <a :href="`/pos/@${hiveAccTo.value}/`">
              <q-icon name="bookmark" class="cursor-pointer" />
              v4v.app/pos/@{{ hiveAccTo.value }}
            </a>
          </div>
        </div>
      </div>
      <!-- Explanation what is this page box -->
      <div class="full-width pad-max-width q-py-lg" v-if="false">
        <div class="pad-max-width">
          <ExplanationBox class="q-pt-md"></ExplanationBox>
        </div>
      </div>
    </div>
    <!-- Show the QR dialog -->
    <POSKeychainShowQR v-model="KeychainDialog" />
    <!-- Show the settings dialog -->
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from "vue"
import { tidyNumber, useUsernameFromRouteParam } from "src/use/useUtils"
import { useQuasar } from "quasar"
import POSKeychainShowQR from "src/components/hive/POSKeychainShowQR.vue"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import SetRateBar from "src/components/utils/SetRateBar.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useRoute } from "vue-router"
import PosHeader from "src/components/hive/PosHeader.vue"
import HiveInputAcc from "src/components/HiveInputAcc.vue"
import LocalCurrency from "src/components/utils/LocalCurrency.vue"
import ListTransactions from "src/components/hive/ListTransactions.vue"
import ConfettiExplosion from "vue-confetti-explosion"
import { useIsEVMAddress } from "src/use/useEVM"

const route = useRoute()
const q = useQuasar()
const t = useI18n().t
const currencySelected = ref("hbd")

const currentTab = ref("sales")

const storeUser = useStoreUser()

const hiveAccTo = ref({
  label: "",
  value: "",
  caption: "",
  fixedUser: false,
  valid: false,
})

const KeychainDialog = ref({ show: false, settings: false })
const CurrencyCalc = ref({
  amount: 0,
  currency: "hbd",
  sats: 0,
  hive: 0,
  hbd: 0,
  local: 0,
  outOfRange: true,
})

const amount = ref({
  txt: "",
  num: 0,
})

const decimalEntry = ref(0)

const currencyOptions = ref()

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
    // select this local currency
    currencySelected.value = localCurrency.value
  }
}

/**
 * ConfettiExplosion component
 */
const visible = ref(false)
const explode = async () => {
  visible.value = false
  await nextTick()
  visible.value = true
}

const destinationAccountType = computed(() => {
  return useIsEVMAddress(hiveAccTo.value.value) ? "evm" : "hive"
})

watch(route, (to, from) => {
  // Code to execute on route change
  if (to.path.includes("/pos")) {
    // first unset hiveAccTo to trigger a refresh
    // wait half a second then run the code
    // wait for a tick
    setTimeout(() => {
      if (storeUser.pos?.hiveAccTo) {
        hiveAccTo.value = {
          label: storeUser.pos.hiveAccTo.label,
          value: storeUser.pos.hiveAccTo.value,
          valid: true,
          caption: storeUser.pos.hiveAccTo.caption,
          fixedUser: false,
        }
      }
    }, 100)
  }
})

watch(
  () => storeUser.localCurrency,
  () => {
    const baseCurrencies = ["hbd", "hive", "sats"]
    if (!currencyOptions.value.includes(storeUser.localCurrency.value)) {
      resetCurrencyOptions(storeUser.localCurrency)
    }
    // If the local currency is one of the base currencies do nothing
    if (baseCurrencies.includes(currencySelected.value)) {
      updateAmounts(amount.value.txt)
      return
    }
    // if the selected currency is no longer in the options, switch to the
    // newly selected local currency
    if (!currencyOptions.value.includes(currencySelected.value)) {
      currencySelected.value = storeUser.localCurrency.value
      CurrencyCalc.value.currency = currencySelected.value
      storeUser.pos.currencySelected = currencySelected.value
    }
    updateAmounts(amount.value.txt)
  }
)

watch(
  () => storeUser.pos.fixedRate,
  () => {
    updateAmounts(amount.value.txt)
  }
)

watch(
  () => hiveAccTo.value.value,
  () => {
    console.log("hiveAccTo changed", hiveAccTo.value.value)
    
    if (!hiveAccTo.value.value) {
      KeychainDialog.value.transactions = []
    }
    if (destinationAccountType.value === "evm") {
      storeUser.pos.receiveCurrency = "sats"
      storeUser.pos.accountType = "evm"
    } else {
      storeUser.pos.accountType = "hive"
    }
  }
)

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
  if (!hiveAccTo.value.value || !hiveAccTo.value.valid) {
    return false
  }
  if (memoHasPipe.value) {
    return false
  }
  return true
})

const memoHasPipe = computed(() => {
  if (!memoInput.value) {
    return false
  }
  if (memoInput.value.includes("|")) {
    return true
  }
  return false
})

onMounted(() => {
  if (!storeUser.pos?.receiveCurrency) {
    storeUser.pos.receiveCurrency = "hbd"
  }
  if (!storeUser.pos?.hiveAccTo) {
    useLoggedInUser()
  }
  // give me the first item in the currencyOptions list

  const path = route.path
  if (path.includes("/sales")) {
    currentTab.value = "sales"
  } else if (path.includes("/history")) {
    currentTab.value = "history"
  } else if (path.includes("/currency")) {
    currentTab.value = "currency"
  }
  if (route.params.hiveAccTo) {
    const username = useUsernameFromRouteParam(route.params.hiveAccTo)
    hiveAccTo.value = {
      label: username,
      value: username,
      caption: username,
    }
    hiveAccTo.value.fixedUser = true
    hiveAccTo.value.valid = true
  } else if (storeUser.pos?.hiveAccTo) {
    hiveAccTo.value = {
      label: storeUser.pos.hiveAccTo.label,
      value: storeUser.pos.hiveAccTo.value,
      caption: storeUser.pos.hiveAccTo.caption,
      fixedUser: false,
    }
  } else {
    useLoggedInUser()
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
})

/**
 * Handles the retry of a transaction.
 *
 * This function is called when a transaction needs to be retried. It sets up the necessary values for the transaction,
 * such as the account to send to (`hiveAccTo`), the currency to send (`currencyToSend`), the amount to send (`amount`),
 * and the memo (`memoInput`). After setting these values, it updates the amounts and shows the payment QR code.
 *
 * @param {Object} val - The transaction data. Should have properties: `hiveAccTo`, `currencyToSend`, `amount`, and `memo`.
 */
function handleRetryTransaction(val) {
  KeychainDialog.value.hiveAccTo = val.hiveAccTo

  hiveAccTo.value = {
    label: val.hiveAccTo,
    value: val.hiveAccTo,
    caption: val.hiveAccTo,
  }
  hiveAccTo.value.valid = true

  handleCurrencyClicked(val.currencyToSend)

  amount.value.num = val.amount
  amount.value.txt = tidyNumber(val.amount, 3)
  memoInput.value = val.memo
  updateAmounts(amount.value.txt)
  // wait a tick
  setTimeout(() => {
    showPaymentQR(val.currencyToSend)
  }, 100)
}

function useLoggedInUser() {
  if (storeUser.hiveAccname) {
    hiveAccTo.value = {
      label: storeUser.hiveAccname,
      value: storeUser.hiveAccname,
      caption: storeUser.profileName,
      fixedUser: false,
    }
  }
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

function bookmarkSite() {
  // You can put any logic here to handle the bookmarking process.
  // Since browsers restrict adding bookmarks via script,
  // inform the user how to bookmark the page manually.
  // jump to a different url
  window.location.href = "/pos/sales/@" + hiveAccTo.value.value
}

const beforeVal = ref("")
const afterVal = ref("")
const afterParsed = ref("")
const currentLocale = ref("")

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
    "lu-LU", // Luxembourg
    "de-AT", // Austria
    "fr-BE",
    "nl-BE", // Belgium
    "hr-HR", // Croatia
    "cs-CZ", // Czech Republic
    "et-EE", // Estonia
    "hu-HU", // Hungary
    "lv-LV", // Latvia
    "lt-LT", // Lithuania
    "sk-SK", // Slovakia
    "sl-SI", // Slovenia
    // Add or remove locales as required
  ]
  beforeVal.value = val
  currentLocale.value = q.lang.getLocale()
  // Check if the current locale is in the list of comma locales
  if (commaLocales.includes(currentLocale.value)) {
    val = val.replace(".", "").replace(",", ".")
  }

  // Handle other locale-specific formats as necessary
  afterVal.value = val
  afterParsed.value = parseFloat(val)
  return parseFloat(val)
}

function updateCurrencySelected(val) {
  currencySelected.value = val.value
  CurrencyCalc.value.currency = val.value
  storeUser.pos.currencySelected = val.value
}

function enterPressed() {}

// Watch the hiveAccTo for changes and update the storeUser.pos Object
watch(hiveAccTo, async (val) => {
  KeychainDialog.value.hiveAccTo = val.value
  storeUser.pos.hiveAccTo = {
    label: val.label,
    value: val.value,
    caption: val.caption,
  }
})

function clearAmount() {
  decimalEntry.value = 0
  amount.value.txt = ""
  amount.value.num = 0
  CurrencyCalc.value.amount = 0
}

const memoInput = ref("")

/**
 * Displays the payment QR code.
 *
 * @param {string} payWith - The payment method to use.
 */
function showPaymentQR(payWith) {
  // always default to not showing lightning invoice first.
  KeychainDialog.value.showLightning = false
  if (!isPaymentValid.value) {
    return
  }
  if (payWith === "sats") {
    KeychainDialog.value.showLightning = true
  }
  KeychainDialog.value.memo = memoInput.value
  KeychainDialog.value.currencyToSend = payWith
  KeychainDialog.value.hiveAccTo = hiveAccTo.value.value
  KeychainDialog.value.currencyCalc = CurrencyCalc.value
  KeychainDialog.value.display = "pos"
  KeychainDialog.value.show = true
}

watch(
  () => KeychainDialog.value?.paid,
  (paid) => {
    if (paid) {
      clearAmount(true)
      setTimeout(() => {
        explode()
      }, 5300)
    } else {
    }
  }
)
</script>

<style lang="scss" scoped>
.fixed-rate-banner {
  font-size: 0.8rem;
}

.amount-display {
  font-size: 2rem;
}

.pad-and-special {
  background-color: none;
}

.pad-max-width {
  max-width: 600px;
  padding: 1rem 0.5rem;
}

.full-width {
  width: 100%;
}

.number-buttons {
  font-size: 1.3rem;
}

.special-buttons {
  font-size: 1.3rem;
}

.special-container {
  display: flex;
  flex-direction: column;
}

.special-button-container {
  flex: 1;
  display: flex;
}

.special-buttons {
  width: 100%;
  height: 100%;
}
</style>
