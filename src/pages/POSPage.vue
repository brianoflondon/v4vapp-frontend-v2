<template>
  <q-page>
    <div class="flex column text-center items-center">
      <!-- Pay To bar -->
      <div class="div flex row pad-max-width full-width items-center q-pa-sm">
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
            :label="$t('amount') + ' running total ' + runningTotal.txt"
            stack-label
            debounce="500"
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
        <q-input
          clearable
          v-model="memoInput"
          class="full-width"
          label="Memo"
          @focus="handleFocus"
          @blur="handleBlur"
        >
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
      <!-- Number Pad -->
      <div
        v-if="!isMobile"
        @keydown="(event) => handleKeypress(event)"
        class="pad-and-special row full-width pad-max-width"
      >
        <div class="class col-10">
          <div class="pad-max-width q-gutter-none row justify-center q-pa-none">
            <div
              v-for="(button, index) in numButtons"
              :key="index"
              class="col-4 q-pa-xs"
            >
              <q-btn
                :label="button"
                color="primary"
                @click="buttonPushed(button)"
                class="full-width number-buttons"
              ></q-btn>
            </div>
          </div>
        </div>
        <!-- Special Buttons -->
        <div class="class col-2 special-container">
          <div
            class="q-pa-xs special-button-container"
            v-for="(button, index) in specialButtons"
            :key="index"
          >
            <q-btn
              :label="button"
              color="secondary"
              @click="buttonPushed(button)"
              class="full-width special-buttons"
            ></q-btn>
          </div>
        </div>
      </div>
    </div>
    <KeychainShowQR v-if="KeychainDialog.show" v-model="KeychainDialog" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { tidyNumber, genRandAlphaNum } from "src/use/useUtils"
import { useQuasar } from "quasar"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import KeychainShowQR from "src/components/hive/KeychainShowQR.vue"
import { useStoreUser } from "src/stores/storeUser"
import { encodeOp } from "hive-uri"
import { useI18n } from "vue-i18n"

const q = useQuasar()
const t = useI18n().t

const storeUser = useStoreUser()
const hiveAccTo = ref({ label: "", value: "", caption: "" })

const KeychainDialog = ref({ show: false })
const isMobile = computed(() => {
  return q.platform.is.mobile
})

const amount = ref({
  txt: "0.00",
  num: 0,
})

const runningTotal = ref({
  txt: "0.00",
  num: 0,
})
const runningTotalAwait = ref(false)
const payButtonLabel = computed(() => {
  console.log("payButtonLabel", runningTotal.value)
  return (
    t("pay") +
    " " +
    tidyNumber(runningTotal.value.num / 100, 3) +
    " " +
    currency.value
  )
})

const decimalEntry = ref(0)
const items = ref(0)

const currencyOptions = ref(["HBD", "HIVE"])
const currency = ref("HBD")

const specialButtons = ref(["AC", "C", "+", "="])

const numButtons = ref([
  "7",
  "8",
  "9",
  "4",
  "5",
  "6",
  "1",
  "2",
  "3",
  "0",
  ".",
  ".00",
])

onMounted(() => {
  console.log("onMounted")
  if (isMobile.value) {
    amount.value.txt = ""
  }
  console.log("storeUser.pos", storeUser.pos)
  console.log("storeUser.hiveAccname", storeUser.hiveAccname)
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

// When the amount is updated manually deal with that here
function updateAmounts(val) {
  if (val.endsWith("+")) {
    amount.value.txt = amount.value.txt.slice(0, -1)
    if (amount.value.txt === "") {
      amount.value.txt = "0.00"
    }
    amount.value.num = parseFloat(val) * 100
    buttonPushed("+")
  }
  if (val.endsWith(".")) {
    amount.value.num = parseFloat(val) * 100
  }
  amount.value.num = parseFloat(val) * 100
  if (isMobile.value) {
    if (parseFloat(val)) {
      amount.value.txt = parseFloat(val)
      runningTotal.value.num = amount.value.num
      runningTotal.value.txt = amount.value.txt
    }
  }
  console.log(val)
  console.log(amount.value.num)
}

function enterPressed() {
  console.log("enterPressed")
  buttonPushed("=")
}

function useLoggedInUser() {
  console.log("useLoggedInUser")
  if (storeUser.hiveAccname) {
    hiveAccTo.value = {
      label: storeUser.hiveAccname,
      value: storeUser.hiveAccname,
      caption: setCaption(storeUser.profileName),
    }
  }
}

function setCaption(profileName) {
  return t("pay_to") + " " + profileName
}

const useStoreUserButtonLabel = computed(() => {
  return t("use") + "\n@" + storeUser.hiveAccname
})

// Watch the hiveAccTo for changes and update the storeUser.pos Object
watch(hiveAccTo, async (val) => {
  console.debug("hiveAccTo", val)
  storeUser.pos.hiveAccTo = {
    label: val.label,
    value: val.value,
    caption: val.caption,
  }
  hiveAccTo.value.caption = setCaption(val.caption)
})

function clearAmount(clearRunning = false) {
  decimalEntry.value = 0
  amount.value.txt = isMobile.value ? "" : "0.00"
  amount.value.num = 0
  items.value = 0
  if (clearRunning) {
    runningTotalAwait.value = false
    runningTotal.value.num = 0
    runningTotal.value.txt = "0.00"
  }
}

const memoInput = ref("")
let isFocused = ref(false)

const handleFocus = () => {
  isFocused.value = true
  console.log("Input is focused:", isFocused.value)
}

const handleBlur = () => {
  isFocused.value = false
  console.log("Input is focused:", isFocused.value)
}

function handleKeypress(event) {
  console.log(event)
  if (isFocused.value) {
    return
  }
  if (event.key >= "0" && event.key <= "9") {
    console.log(`Numeric key pressed: ${event.key}`)
    buttonPushed(event.key)
  }
  if (
    event.key === "Backspace" ||
    event.key === "Delete" ||
    event.key === "a" ||
    event.key === "A"
  ) {
    console.log(`Backspace key pressed: ${event.key}`)
    clearAmount(true)
  }
  if (event.key === "c" || event.key === "C") {
    console.log(`C key pressed: ${event.key}`)
    clearAmount(false)
  }
  if (event.key === ".") {
    console.log(`Decimal key pressed: ${event.key}`)
    decimalEntry.value = true
    buttonPushed(".")
  }
  if (event.key === "Enter") {
    console.log(`Enter key pressed: ${event.key}`)
    buttonPushed("Pay")
  }
}

function generatePaymentQR() {
  console.log("generatePaymentQR")
  // Check if there is a running total, if that is 0 use the amount
  // on the screen
  if (runningTotal.value.num === 0 && amount.value.num === 0) {
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

  if (runningTotal.value.num === 0) {
    runningTotal.value.num = amount.value.num
    runningTotal.value.txt = amount.value.txt
  }
  KeychainDialog.value.amountToSend = parseFloat(
    runningTotal.value.num / 100
  ).toFixed(3)
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
  const op = [
    "transfer",
    {
      from: "",
      to: KeychainDialog.value.hiveAccTo,
      amount: KeychainDialog.value.amountString,
      memo: KeychainDialog.value.memo,
    },
  ]
  console.log(op)
  KeychainDialog.value.qrCodeTextHive = encodeOp(op)
  KeychainDialog.value.qrCodeText = KeychainDialog.value.qrCodeTextHive
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

function buttonPushed(button) {
  // if (navigator.vibrate) {
  //   console.log("Vibration is supported")
  //   navigator.vibrate(150) // Vibrate for 15ms
  // }
  console.log("buttonPushed", button)
  if (button === "AC") {
    clearAmount(true)
    return
  }
  if (button === "C") {
    clearAmount(false)
    return
  }
  if (button === "+") {
    console.log("need to deal with + slightly differently")
  }
  if (button === "+" || button === "=") {
    runningTotalAwait.value = true
    items.value += 1
    runningTotal.value.num += amount.value.num
    runningTotal.value.txt = tidyNumber(
      (runningTotal.value.num / 100).toString(),
      2
    )
    amount.value.txt = runningTotal.value.txt
    return
  }

  if (button === ".") {
    amount.value.num *= 100
    amount.value.txt = tidyNumber((amount.value.num / 100).toString(), 2)
    decimalEntry.value = 2
    return
  }
  if (button === ".00") {
    amount.value.num = 100 * amount.value.num
    amount.value.txt = tidyNumber((amount.value.num / 100).toString(), 2)
    console.log("Decimal pushed : amount", amount.value)
    return
  }
  if (amount.value.txt === "0.00" || runningTotalAwait.value) {
    amount.value.txt = "0.0" + button
    amount.value.num = parseInt(button)
    runningTotalAwait.value = false
    return
  }
  if (decimalEntry.value > 0) {
    console.log("decimalEntry.value", decimalEntry.value)
    console.log("button", button)
    console.log("amount.value.num", amount.value.num)
    amount.value.num =
      amount.value.num + parseInt(button) * 10 ** (decimalEntry.value - 1)
    decimalEntry.value -= 1
    console.log(amount.value.num)
    amount.value.txt = tidyNumber((amount.value.num / 100).toString(), 2)

    return
  }
  amount.value.num = 10 * amount.value.num
  amount.value.num += parseInt(button)
  amount.value.txt = tidyNumber((amount.value.num / 100).toString())

  console.log("amount", amount.value)
}
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
