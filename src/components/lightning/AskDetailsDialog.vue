<template>
  <div v-if="dInvoice">
    <q-dialog v-model="dInvoice.askDetails" @show="showDialog">
      <q-card>
        <q-card-section>
          <div class="row q-pa-md">
            <div class="left-side-details col-7 q-gutter-md">
              <p>{{ $t("asking_details") }}</p>
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
          <div class="row input-amounts justify-around">
            <div class="input-sats input-amount q-pa-sm">
              <q-input
                v-model="amounts.sats"
                type="text"
                inputmode="numeric"
                pattern="\d*"
                :label="$t('send') + ' (Sats)'"
                stack-label
                debounce="1000"
                v-autofocus
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'sats')"
                :error-message="errorMessage"
                :error="errorState"
              />
            </div>
            <!-- USD INPUT -->
            <div class="input-hbd input-amount q-pa-sm">
              <q-input
                v-model="amounts.hbd"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                :label="$t('send') + ' (HBD)'"
                stack-label
                debounce="1000"
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hbd')"
              />
            </div>
            <!-- USD INPUT -->
            <div class="input-hive input-amount q-pa-sm">
              <q-input
                v-model="amounts.hive"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                :label="$t('send') + ' (Hive)'"
                stack-label
                debounce="1000"
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hive')"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-section
          v-if="dInvoice?.v4vapp?.metadata?.commentLength"
          class="q-pa-md"
        >
          <q-input
            v-model="dInvoice.v4vapp.comment"
            label="Comment"
            type="text"
            counter
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
            flat
            :label="$t('cancel')"
            color="primary"
            v-close-popup
          ></q-btn>
          <q-btn
            flat
            :label="$t('ok')"
            color="primary"
            @click="createInvoice"
            :disabled="errorState"
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { callBackGenerateInvoice } from "src/use/useLightningInvoice"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { tidyNumber } from "src/use/useUtils"
import { useI18n } from "vue-i18n"
const t = useI18n().t

const storeAPIStatus = useStoreAPIStatus()
const dInvoice = defineModel({})
const emit = defineEmits(["newInvoice"])
const errorMessage = ref("")
const errorState = ref(false)
const amounts = ref({
  sats: 0,
  hbd: 0,
  hive: 0,
})

function showDialog() {
  console.log("showDialog, dInvoice.value.v4vapp.amountToSend")
  if (dInvoice.value.v4vapp.amountToSend) {
    updateAmounts(dInvoice.value.v4vapp.amountToSend, "sats")
  }
}

function updateAmounts(amount, currency) {
  if (amount === "") {
    amount = "1"
  }
  console.log("updateAmounts, amount, currency", amount, currency)
  // strip out all the commas
  // check if amount is a string
  if (typeof amount === "string") {
    amount = parseFloat(amount.replace(/,/g, ""), 10)
  }
  console.log("updateAmounts, amount, currency", amount, currency)
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
  console.log("Sats amount: ", sats)
  console.log(dInvoice.value.v4vapp.metadata.minSats)
  console.log(dInvoice.value.v4vapp.metadata.maxSats)
  if (sats < dInvoice.value.v4vapp.metadata.minSats) {
    console.log("amounts.value.sats < dInvoice.value.metadata.minSats")
    errorMessage.value = t("too_low")
    errorState.value = true
  } else if (sats > dInvoice.value.v4vapp.metadata.maxSats) {
    console.log("amounts.value.sats > dInvoice.value.metadata.maxSats")
    errorMessage.value = t("too_high")
    errorState.value = true
  } else {
    errorMessage.value = ""
    errorState.value = false
  }

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
  console.log(
    "createInvoice",
    dInvoice.value.v4vapp.amountToSend,
    dInvoice.value.v4vapp?.comment
  )
  try {
    dInvoice.value.v4vapp.amountToSend = Math.round(
      dInvoice.value.v4vapp.amountToSend
    )
    const response = await callBackGenerateInvoice(
      dInvoice.value.callback,
      dInvoice.value.v4vapp.amountToSend,
      dInvoice.value.v4vapp?.comment
    )
    console.log("response", response)
    dInvoice.value.askDetails = false
    dInvoice.value.callback = response
    console.log('emit("newInvoice", response)', response)
    emit("newInvoice", response)
  } catch (error) {
    console.log("error", error)
  }
}
</script>

<style lang="scss" scoped>
.input-amount {
  width: 6.3rem;
}
</style>
