<template>
  <div v-if="dInvoice">
    <q-dialog class="q-mx-lg" v-model="dInvoice.askDetails" @show="showDialog">
      <q-card>
        <q-card-section>
          <div class="row q-pa-sm">
            <div class="left-side-details col-7 q-gutter-md">
              <p>{{ main_message }}</p>
              <p>
                <strong>{{ dInvoice?.v4vapp?.metadata?.requestString }}</strong>
              </p>
            </div>
            <div
              v-if="dInvoice.v4vapp.metadata.imgUrl"
              class="right-side-details col-5 q-gutter-md"
            >
              <q-img
                :src="dInvoice.v4vapp.metadata.imgUrl"
                spinner-color="red"
                style="height: 150px; max-width: 150px"
              />
            </div>
          </div>
          <!-- SATS INPUT -->
          <div class="row q-pb-none input-amounts justify-around">
            <div class="input-sats input-amount q-pa-none">
              <q-input
                v-model="amounts.sats"
                type="text"
                inputmode="numeric"
                pattern="\d*"
                label="Sats"
                stack-label
                debounce="1000"
                v-autofocus
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'sats')"
                @keyup.enter="createInvoice"
                :error-message="errorMessage"
                :error="errorState"
                tabindex="1"
              />
            </div>
            <!-- USD INPUT -->
            <div class="input-hbd input-amount q-pa-none">
              <q-input
                v-model="amounts.hbd"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                label="HBD"
                stack-label
                debounce="1000"
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hbd')"
              />
            </div>
            <!-- USD INPUT -->
            <div class="input-hive input-amount q-pa-none">
              <q-input
                v-model="amounts.hive"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                label="Hive"
                stack-label
                debounce="1000"
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hive')"
              />
            </div>
          </div>
          <div class="row amount-buttons q-py-sm q-gutter-sm">
            <q-btn rounded label="$1" />
            <q-btn rounded label>5</q-btn>
            <q-btn rounded label>10</q-btn>
          </div>
          <div class="row sats-slider q-py-sm">
            <q-badge color="primary"> Sats: </q-badge>
            <q-slider
              v-model="amounts.satsNum"
              :min="dInvoice.v4vapp.metadata.minSats"
              :max="dInvoice.v4vapp.metadata.maxSats"
              :step="100"
              label
              label-always
              switch-label-side
              @update:model-value="(val) => updateAmounts(val, 'sats')"
            ></q-slider>
          </div>
        </q-card-section>
        <q-card-section
          v-if="dInvoice?.v4vapp?.metadata?.commentLength"
          class="q-pa-sm"
        >
          <q-input
            v-model="dInvoice.v4vapp.comment"
            label="Comment"
            type="text"
            counter
            tabindex="2"
            :rules="[
              (val) =>
                val.length <= dInvoice?.v4vapp?.metadata?.commentLength ||
                `${t('comment_length')}: (${
                  dInvoice?.v4vapp?.metadata?.commentLength
                } ${t('characters')})`,
            ]"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            :label="$t('cancel')"
            color="primary"
            v-close-popup
            tabindex="4"
          ></q-btn>
          <q-btn
            :label="$t('ok')"
            color="primary"
            @click="createInvoice"
            :disabled="errorState"
            tabindex="3"
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useCreateInvoice } from "src/use/useLightningInvoice"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { tidyNumber } from "src/use/useUtils"
import { useI18n } from "vue-i18n"
const t = useI18n().t

const storeAPIStatus = useStoreAPIStatus()
const dInvoice = defineModel({})
const emit = defineEmits(["newInvoice", "amounts"])
const errorMessage = ref("")
const errorState = ref(false)
const amounts = ref({
  sats: 0,
  hbd: 0,
  hive: 0,
  satsNum: 1000,
})
const main_message = ref("")

function showDialog() {
  console.log("dInvoice", dInvoice.value.makingInvoice)
  if (dInvoice.value?.makingInvoice) {
    main_message.value = t("making_invoice")
  } else {
    main_message.value = t("asking_details")
  }
  if (dInvoice.value.v4vapp.amountToSend) {
    updateAmounts(dInvoice.value.v4vapp.amountToSend, "sats")
  }
}

function updateAmounts(amount, currency) {
  if (amount === "") {
    amount = "1"
  }
  // strip out all the commas
  // check if amount is a string
  if (typeof amount === "string") {
    amount = parseFloat(amount.replace(/,/g, ""), 10)
  }
  let sats, hive, hbd

  switch (currency) {
    case "sats":
      sats = parseInt(amount)
      hive = amount / storeAPIStatus.hiveSatsNumber
      hbd = amount / storeAPIStatus.HBDSatsNumber
      break

    case "hive":
      sats = amount * storeAPIStatus.hiveSatsNumber
      hive = amount
      hbd =
        (amount * storeAPIStatus.hiveSatsNumber) / storeAPIStatus.HBDSatsNumber
      break

    case "hbd":
      sats = amount * storeAPIStatus.HBDSatsNumber
      hive =
        (amount * storeAPIStatus.HBDSatsNumber) / storeAPIStatus.hiveSatsNumber
      hbd = amount
      break

    default:
      return
  }
  dInvoice.value.v4vapp.amountToSend = parseInt(sats)
  if (sats < dInvoice.value.v4vapp.metadata.minSats) {
    errorMessage.value = t("too_low")
    errorState.value = true
  } else if (sats > dInvoice.value.v4vapp.metadata.maxSats) {
    errorMessage.value = t("too_high")
    errorState.value = true
  } else {
    errorMessage.value = ""
    errorState.value = false
  }
  amounts.value.satsNum = sats
  amounts.value.sats = tidyNumber(sats.toFixed(0))
  amounts.value.hive = tidyNumber(hive.toFixed(3))
  amounts.value.hbd = tidyNumber(hbd.toFixed(2))
}

const vAutofocus = {
  mounted(el) {
    el.focus()
  },
}

async function createInvoice() {
  console.log("dInvoice callback", dInvoice.value.callback)
  const newInvoice = await useCreateInvoice(dInvoice.value)
  emit("newInvoice", newInvoice)
  emit("amounts", amounts.value)
}

// function modifyComment() {
//   if (dInvoice.value.hiveHbd === "hbd") {
//     if (dInvoice.value.v4vapp.comment === undefined) {
//       dInvoice.value.v4vapp.comment = "#HBD"
//     } else {
//       dInvoice.value.v4vapp.comment += " #HBD"
//     }
//   }
// }

// async function createInvoice() {
//   try {
//     dInvoice.value.v4vapp.amountToSend = Math.round(
//       dInvoice.value.v4vapp.amountToSend
//     )
//     modifyComment()
//     const response = await callBackGenerateInvoice(
//       dInvoice.value.callback,
//       dInvoice.value.v4vapp.amountToSend,
//       dInvoice.value.v4vapp?.comment
//     )
//     dInvoice.value.askDetails = false
//     dInvoice.value.callback = response
//     emit("newInvoice", response)
//     emit("amounts", amounts.value)
//   } catch (error) {
//     console.log("error", error)
//   }
// }
</script>

<style lang="scss" scoped>
.input-amount {
  width: 6.3rem;
}
</style>
