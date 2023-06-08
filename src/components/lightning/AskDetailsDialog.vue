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
                v-autofocus
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'sats')"
                :rules="[
                  (val) => !!val || 'Required',
                  (val) =>
                    val >= dInvoice?.v4vapp?.metadata?.minSats || $t('too_low'),
                  (val) =>
                    val <= dInvoice?.v4vapp?.metadata?.maxSats ||
                    $t('too_high'),
                ]"
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
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hive')"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <pre>{{ amounts }}</pre>
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
const storeAPIStatus = useStoreAPIStatus()
const dInvoice = defineModel({})
const emit = defineEmits(["newInvoice"])
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

function someChange(val) {
  console.log("someChange, val", val)
}

function updateAmounts(amount, currency) {
  console.log("updateAmounts, amount, currency", amount, currency)
  if (currency === "sats") {
    dInvoice.value.v4vapp.amountToSend = amount
    amounts.value.sats = amount
    amounts.value.hive = amount / storeAPIStatus.hiveSatsNumber
    amounts.value.hbd = amount / storeAPIStatus.HBDSatsNumber
    amounts.value.hbd = tidyNumber(amounts.value.hbd.toFixed(2))

    amounts.value.hive = tidyNumber(amounts.value.hive.toFixed(3))

  } else if (currency === "hive") {
    amounts.value.hive = amount
    dInvoice.value.v4vapp.amountToSend = amount * storeAPIStatus.hiveSatsNumber
    amounts.value.sats = amount * storeAPIStatus.hiveSatsNumber
    amounts.value.hbd =
      (amount * storeAPIStatus.hiveSatsNumber) / storeAPIStatus.HBDSatsNumber
    amounts.value.hbd = tidyNumber(amounts.value.hbd.toFixed(2))
  } else if (currency === "hbd") {
    amounts.value.hbd = amount
    dInvoice.value.v4vapp.amountToSend = amount * storeAPIStatus.HBDSatsNumber
    amounts.value.sats = amount * storeAPIStatus.HBDSatsNumber
    amounts.value.hive =
      (amount * storeAPIStatus.HBDSatsNumber) / storeAPIStatus.hiveSatsNumber
    amounts.value.hive = tidyNumber(amounts.value.hive.toFixed(3))
  }
  dInvoice.value.v4vapp.amountToSend = parseInt(amounts.value.sats)
  amounts.value.sats = dInvoice.value.v4vapp.amountToSend
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
  width: 7rem;
}
</style>
