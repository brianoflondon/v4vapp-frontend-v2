<template>
  <q-page>
    <div class="flex column text-center items-center">
      <!-- Pay To bar -->
      <div
        class="div flex row pad-max-width full-width items-center q-pa-sm q-pt-md"
      >
        <div class="col-8 q-px-sm">
          <div class="pad-max-width full-width">
            <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options />
          </div>
        </div>
        <!-- Button to use Logged in User -->
        <div class="div col-4 q-px-sm" v-if="storeUser.hiveAccname">
          <q-btn
            class="full-width"
            style="font-size: x-small; white-space: pre-line"
            color="primary"
            :label="useStoreUserButtonLabel"
            @click="useLoggedInUser"
            :disable="!storeUser.hiveAccname"
          >
            <q-tooltip>
              Reset payment recipient to<br />
              {{ storeUser.profileName }}<br />
              @{{ storeUser.hiveAccname }}</q-tooltip
            >
          </q-btn>
        </div>
      </div>
      <!-- show numButtons in a numeric pad -->
      <!-- Display Area -->
      <div
        class="flex row items-center amount-input-area pad-max-width full-width q-pa-sm"
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
        <div class="col-3 q-pa-sm amount-input-area">
          <q-select
            v-model="currency"
            :options="currencyOptions"
            label="Currency"
            dense
          />
        </div>
      </div>
      <!-- Memo -->
      <div class="memo-input flex pad-max-width full-width q-px-md q-py-sm">
        <q-input clearable v-model="memoInput" class="full-width" label="Memo">
        </q-input>
      </div>
      <!-- Pay button -->
      <div class="pad-max-width full-width q-px-md q-py-xs">
        <q-btn
          class="full-width"
          style="font-size: 1.2rem; white-space: pre-line"
          color="secondary"
          icon="qr_code_2"
          :label="payButtonLabel"
          @click="generatePaymentQR"
        />
      </div>
      <!-- List of received transactions -->
      <div class="pad-max-width q-px-md q-py-xs">
        {{ t("list_received_payments") }}
        {{ hiveAccTo.value }}
        <ListTransactions v-model="KeychainDialog"></ListTransactions>
      </div>

      <!-- Explanation what is this page box -->
      <div style="max-width: 200px">
        <ExplanationBox class="q-pt-md"></ExplanationBox>
      </div>
      <!-- Old page links -->
      <div class="q-pt-lg">
        <q-btn
          color="primary"
          :label="t('old_page')"
          style="font-size: 0.6rem; white-space: pre-line"
          @click="$router.push('/hive')"
        ></q-btn>
      </div>
    </div>
    <!-- Show the QR dialog -->
    <KeychainShowQR v-if="KeychainDialog.show" v-model="KeychainDialog" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { tidyNumber, genRandAlphaNum } from "src/use/useUtils"
import { useQuasar } from "quasar"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import KeychainShowQR from "src/components/hive/KeychainShowQR.vue"
import ListTransactions from "src/components/hive/ListTransactions.vue"
import ExplanationBox from "src/components/utils/ExplanationBox.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"

const q = useQuasar()
const t = useI18n().t

const storeUser = useStoreUser()
const hiveAccTo = ref({ label: "", value: "", caption: "" })

const KeychainDialog = ref({ show: false })

const amount = ref({
  txt: "",
  num: 0,
})

const payButtonLabel = computed(() => {
  return t("pay") + " " + tidyNumber(amount.value.num, 3) + " " + currency.value
})

const decimalEntry = ref(0)
const items = ref(0)

const currencyOptions = ref(["HBD", "HIVE"])
const currency = ref("HBD")

onMounted(() => {
  if (storeUser.pos?.hiveAccTo) {
    hiveAccTo.value = {
      label: storeUser.pos.hiveAccTo.label,
      value: storeUser.pos.hiveAccTo.value,
      caption: storeUser.pos.hiveAccTo.caption,
    }
  } else {
    useLoggedInUser()
  }
})

function useLoggedInUser() {
  if (storeUser.hiveAccname) {
    hiveAccTo.value = {
      label: storeUser.hiveAccname,
      value: storeUser.hiveAccname,
      caption: setCaption(storeUser.profileName),
    }
  }
}

// When the amount is updated manually deal with that here
function updateAmounts(val) {
  if (val === "") {
    amount.value.num = 0
    return
  }
  amount.value.num = parseFloat(val)
}

function enterPressed() {}

function setCaption(profileName) {
  return t("pay_to") + " " + profileName
}

const useStoreUserButtonLabel = computed(() => {
  return t("use") + "\n@" + storeUser.hiveAccname
})

// Watch the hiveAccTo for changes and update the storeUser.pos Object
watch(hiveAccTo, async (val) => {
  console.debug("hiveAccTo", val)
  KeychainDialog.value.hiveAccTo = val.value
  storeUser.pos.hiveAccTo = {
    label: val.label,
    value: val.value,
    caption: val.caption,
  }
  hiveAccTo.value.caption = setCaption(val.caption)
})

function clearAmount() {
  decimalEntry.value = 0
  amount.value.txt = ""
  amount.value.num = 0
  items.value = 0
}

const memoInput = ref("")

function generatePaymentQR() {
  console.log("generatePaymentQR")
  // Check if there is a running total, if that is 0 use the amount
  // on the screen
  if (amount.value.num === 0) {
    q.notify({
      message: t("no_amount"),
      type: "negative",
      position: "top",
      timeout: 2000,
    })
    return
  }
  if (hiveAccTo.value.value === "") {
    q.notify({
      message: t("no_account"),
      type: "negative",
      position: "top",
      timeout: 2000,
    })
    return
  }

  KeychainDialog.value.amountToSend = parseFloat(amount.value.num).toFixed(3)
  KeychainDialog.value.currencyToSend = currency.value
  KeychainDialog.value.amountString =
    KeychainDialog.value.amountToSend +
    " " +
    KeychainDialog.value.currencyToSend
  KeychainDialog.value.hiveAccTo = hiveAccTo.value.value
  // Add a check code onto the memo.
  KeychainDialog.value.checkCode = "v4v-" + genRandAlphaNum(5)
  KeychainDialog.value.memo = memoInput.value
    ? memoInput.value + " " + KeychainDialog.value.checkCode
    : KeychainDialog.value.checkCode
  KeychainDialog.value.op = [
    "transfer",
    {
      from: "",
      to: KeychainDialog.value.hiveAccTo,
      amount: KeychainDialog.value.amountString,
      memo: KeychainDialog.value.memo,
    },
  ]
  KeychainDialog.value.show = true
}

watch(
  () => KeychainDialog.value?.paid,
  (paid) => {
    console.log("watch KeychainDialog Paid?", paid)
    if (paid) {
      console.log("paid")
      clearAmount(true)
    } else {
      console.log("not paid")
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
