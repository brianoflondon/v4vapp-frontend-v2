<template>
  <div v-if="dInvoice">
    <q-dialog v-model="dInvoice.askDetails">
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
          <div class="row input-amounts">
            <div class="input-sats col-6 q-pa-md">
              <q-input
                v-model="dInvoice.v4vapp.amountToSend"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                :label="$t('amount_to_send') + ' (Sats)'"
                stack-label
                v-autofocus
                :input-style="{ 'text-align': 'right' }"
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
            <div class="input-usd col-6 q-pa-md">
              <q-input
                v-model="amountUSD"
                type="text"
                pattern="\d*"
                inputmode="numeric"
                :label="$t('amount_to_send') + ' (USD)'"
                stack-label
                :input-style="{ 'text-align': 'right' }"
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
const dInvoice = defineModel({})

const emit = defineEmits(["newInvoice"])

const amountUSD = ref(null)

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

<style lang="scss" scoped></style>
