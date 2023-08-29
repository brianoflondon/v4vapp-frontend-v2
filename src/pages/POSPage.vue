<template>
  <q-page>
    <div
      class="flex column text-center items-center"
      @keydown="(event) => handleKeypress(event)"
    >
      <!-- show numButtons in a numeric pad -->
      <!-- Display Area -->
      <div
        class="flex row items-center amount-input-area pad-max-width full-width q-pa-md"
      >
        <div class="col-9 q-pa-sm">
          <q-input
            class="amount-display"
            v-model="amount.txt"
            type="text"
            inputmode="numeric"
            pattern="\d*"
            :label="$t('amount') + ' running total ' + runningTotal.txt"
            stack-label
            debounce="1000"
            :input-style="{ 'text-align': 'right' }"
            :error-message="errorMessage"
            :error="errorState"
            tabindex="1"
            :readonly="true"
          />
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
      <div class="memo-input flex pad-max-width full-width q-px-md q-py-sm">
        <q-input
          v-model="memoInput"
          class="full-width"
          label="Memo"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>
      <!-- Buttons Area -->
      <div class="pad-and-special row full-width pad-max-width">
        <!-- Number Pad -->
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
  </q-page>
</template>

<script setup>
import { ref } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { is } from "quasar"

const errorState = ref(false)
const errorMessage = ref("")
const amount = ref({
  txt: "0.00",
  num: 0,
})

const runningTotal = ref({
  txt: "0.00",
  num: 0,
})
const runningTotalAwait = ref(false)
const decimalEntry = ref(0)
const items = ref(0)

const currencyOptions = ref(["USD", "HBD", "HIVE"])
const currency = ref("USD")

const specialButtons = ref(["AC", "C", "+", "Pay"])

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

function clearAmount(clearRunning = false) {
  decimalEntry.value = 0
  amount.value.txt = "0.00"
  amount.value.num = 0
  items.value = 0
  if (clearRunning) {
    runningTotalAwait.value = false
    runningTotal.value.num = 0
    runningTotal.value.txt = "0.00"
  }
}

const memoInput = ref(null)
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

function buttonPushed(button) {
  console.log("buttonPushed", button)
  if (button === "Pay") {
    console.log("Pay")
    return
  }
  if (button === "AC") {
    clearAmount(true)
    return
  }
  if (button === "C") {
    clearAmount(false)
    return
  }
  if (button === "+") {
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

const vAutofocus = {
  mounted(el) {
    el.focus()
  },
}
</script>

<style lang="scss" scoped>
.amount-display {
  font-size: 2rem;
}

.pad-and-special {
  border: 5px solid blue;
  background-color: gray;
}

.pad-max-width {
  max-width: 400px;
  border: 0.1px solid red;
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
