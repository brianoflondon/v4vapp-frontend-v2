<template>
  <q-page>
    <div class="flex column text-center items-center">
      <!-- Pay To bar -->
      <!-- Pre-selected user name from path -->
      <div
        v-if="route.params.hiveAccTo"
        class="div flex row pad-max-width full-width items-center q-pa-sm q-pt-md"
      >
        <div class="col-9">
          <PosHeader />
        </div>
        <!-- Button to Show Currency settings -->
        <div class="div col-3 q-px-sm" v-if="true">
          <q-btn
            round
            @click="KeychainDialog.settings = !KeychainDialog.settings"
            icon="settings"
            ><q-tooltip>{{ t("local_currency") }}</q-tooltip>
          </q-btn>
        </div>
        <div class="col-12 q-px-sm q-pb-md" v-else>
          <!-- bookmark icon -->
          <div v-if="!hiveAccTo.valid">
            <q-icon name="bookmark" class="cursor-pointer" />
          </div>
          <div v-else>
            <a :href="`/pos/@${hiveAccTo.value}/`">
              <q-icon name="bookmark" class="cursor-pointer" />{{
                `v4v.app/pos/@${hiveAccTo.value}`
              }}
            </a>
          </div>
        </div>
      </div>
      <!-- Select a user and Local Currency Settings -->
      <div
        class="div flex row pad-max-width full-width items-start q-pa-sm q-pt-lg q-pb-md"
        v-else
      >
        <div class="col-9 q-px-sm">
          <div class="pad-max-width full-width">
            <!-- <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options /> -->
            <HiveInputAcc v-model="hiveAccTo" :prefix="t('pay_to')">
            </HiveInputAcc>
          </div>
        </div>
        <!-- Button to Show Currency settings -->
        <div class="div col-3 q-px-none row justify-start items-center">
          <div class="q-px-xs">
            <q-btn
              round
              dense
              @click="KeychainDialog.settings = !KeychainDialog.settings"
              icon="settings"
              ><q-tooltip>{{ t("local_currency") }}</q-tooltip>
            </q-btn>
          </div>
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
        <SetRateBar
          v-if="
            storeUser.pos.fixedRate &&
            currencySelected === storeUser.localCurrency.value
          "
          @click="KeychainDialog.settings = !KeychainDialog.settings"
        />
      </div>
      <!-- Memo -->
      <div class="memo-input flex pad-max-width full-width q-px-md q-py-xs">
        <q-input
          clearable
          v-model="memoInput"
          class="full-width"
          :label="t('memo')"
        >
        </q-input>
      </div>
      <!-- Pay buttons -->
      <div class="pad-max-width full-width q-px-md q-py-md q-gutter-sm">
        <!-- HBD Button -->
        <q-btn
          color="secondary"
          @click="showPaymentQR('hbd')"
          :disable="!isPaymentValid"
        >
          <div class="column items-center q-pa-none" style="font-size: 1.2rem">
            <div><HbdLogoIcon /></div>
            <div class="text-center" style="font-size: 0.5rem; margin: -8px">
              HBD
            </div>
          </div>
          <div class="q-px-md" style="font-size: 1.2rem">
            {{ tidyNumber(CurrencyCalc.hbd, 2) }}
          </div>
          <div class="q-px-none">
            <q-icon name="qr_code_2"></q-icon>
          </div>
        </q-btn>
        <!-- Hive Button -->
        <q-btn
          color="primary"
          @click="showPaymentQR('hive')"
          :disable="!isPaymentValid"
        >
          <div class="column items-center q-pa-none" style="font-size: 2.05rem">
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
        <!-- Alternate currencies  -->
        <div class="pad-max-width full-width q-px-md" v-if="isPaymentValid">
          <AlternateCurrency v-model="CurrencyCalc" />
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
    <KeychainShowQR v-if="KeychainDialog.show" v-model="KeychainDialog" />
    <!-- Show the settings dialog -->
    <POSSettingsDialog
      v-if="KeychainDialog.settings"
      v-model="KeychainDialog"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { useQuasar } from "quasar"
import KeychainShowQR from "src/components/hive/KeychainShowQR.vue"
import POSSettingsDialog from "src/components/POSSettingsDialog.vue"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import SetRateBar from "src/components/utils/SetRateBar.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useRoute } from "vue-router"
import PosHeader from "src/components/hive/PosHeader.vue"
import HiveInputAcc from "src/components/HiveInputAcc.vue"

const route = useRoute()
const q = useQuasar()
const t = useI18n().t
const currencySelected = ref("hbd")

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
})

const amount = ref({
  txt: "",
  num: 0,
})

const decimalEntry = ref(0)

const currencyOptions = ref()

function resetCurrencyOptions(localCurrency) {
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

watch(route, (to, from) => {
  // Code to execute on route change
  if (to.path === "/pos") {
    // first unset hiveAccTo to trigger a refresh
    // wait half a second then run the code
    // wait for a tick
    setTimeout(() => {
      if (storeUser.pos?.hiveAccTo) {
        hiveAccTo.value = {
          label: storeUser.pos.hiveAccTo.label,
          value: storeUser.pos.hiveAccTo.value,
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
  return true
})

onMounted(() => {
  if (route.params.hiveAccTo) {
    const username = extractUsernameFromRouteParam(route.params.hiveAccTo)
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
    // give me the first item in the currencyOptions list
    currencySelected.value = currencyOptions.value[0].value
    storeUser.pos.currencySelected = currencySelected.value
  }
})

function extractUsernameFromRouteParam(routeParam) {
  // Assuming routeParam is in the format 'v4vapp.dev/bookmark'
  var slashPosition = routeParam.indexOf("/")

  // Extract the substring before the first /
  // If there is no /, it extracts the entire string
  var username =
    slashPosition !== -1 ? routeParam.substring(0, slashPosition) : routeParam

  return username
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

// When the amount is updated manually deal with that here
function updateAmounts(val) {
  if (val === "" || val === null) {
    amount.value.num = 0
    return
  }
  amount.value.num = parseLocalizedFloat(val)
  CurrencyCalc.value.amount = amount.value.num
}

function bookmarkSite() {
  // You can put any logic here to handle the bookmarking process.
  // Since browsers restrict adding bookmarks via script,
  // inform the user how to bookmark the page manually.
  // jump to a different url
  window.location.href = "/pos/@" + hiveAccTo.value.value
  // wait for the page to load
  // setTimeout(() => {
  //   // scroll to the bottom of the page
  //   alert(
  //     "To bookmark this page, press " +
  //       (navigator.userAgent.toLowerCase().indexOf("mac") != -1
  //         ? "Command/Cmd"
  //         : "CTRL") +
  //       " + D on your keyboard."
  //   )
  // }, 1000)
}

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

function showPaymentQR(payWith) {
  if (!isPaymentValid.value) {
    return
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
    } else {
    }
  }
)
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}

.pad-and-special {
  background-color: none;
}

.pad-max-width {
  max-width: 400px;
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
