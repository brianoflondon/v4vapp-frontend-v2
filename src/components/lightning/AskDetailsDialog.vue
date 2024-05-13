<template>
  <div v-if="dInvoice">
    <q-dialog class="q-ma-lg" v-model="dInvoice.askDetails" @show="showDialog">
      <q-card
        class="q-pa-none"
        :style="{
          backgroundImage: q.dark.isActive
            ? `linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url(${dInvoice.v4vapp.metadata.imgUrl})`
            : `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${dInvoice.v4vapp.metadata.imgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
      >
        <q-card-section class="header-bar">
          {{ headerBarTitle }} <q-icon :name="headerIcon" />
        </q-card-section>
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
                inputmode="decimal"
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
                inputmode="decimal"
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
                inputmode="decimal"
                label="Hive"
                stack-label
                debounce="1000"
                :input-style="{ 'text-align': 'right' }"
                @update:model-value="(val) => updateAmounts(val, 'hive')"
              />
            </div>
          </div>
          <div v-if="true" class="row amount-buttons q-py-sm q-gutter-sm">
            <NumberButtons
              @button-pressed="(val) => updateAmounts(val, 'hbd')"
            />
          </div>
          <div class="row hbd-slider q-py-sm">
            <q-badge color="green-10"> HBD: </q-badge>
            <q-slider
              v-model="amounts.hbdNum"
              color="green-10"
              :min="
                dInvoice.v4vapp.metadata.minSats / storeAPIStatus.HBDSatsNumber
              "
              :max="
                dInvoice.v4vapp.metadata.maxSats /
                  storeAPIStatus.HBDSatsNumber -
                3
              "
              label
              switch-label-side
              @update:model-value="(val) => updateAmounts(val, 'hbd')"
            ></q-slider>
          </div>
          <div class="row sats-slider q-py-sm">
            <q-badge color="primary"> Sats: </q-badge>
            <q-slider
              v-model="amounts.satsNum"
              color="primary"
              :min="dInvoice.v4vapp.metadata.minSats"
              :max="dInvoice.v4vapp.metadata.maxSats"
              :step="100"
              label
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
            :label="$t('comment')"
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
import { ref, computed } from "vue"
import { useQuasar } from "quasar"
import { useCreateInvoice } from "src/use/useLightningInvoice"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { tidyNumber } from "src/use/useUtils"
import { useI18n } from "vue-i18n"
import { useHiveAvatarURL } from "src/use/useHive"
import NumberButtons from "components/utils/NumberButtons.vue"
const t = useI18n().t
const q = useQuasar()

const storeAPIStatus = useStoreAPIStatus()
const dInvoice = defineModel()
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

const headerBarTitle = computed(() => {
  if (dInvoice.value.v4vapp.type === "hiveAccname") {
    return t("send_to_hive")
  }
  return t("send_to_lightning")
})

const headerIcon = computed(() => {
  if (dInvoice.value.v4vapp.type === "hiveAccname") {
    return "fa-brands fa-hive"
  }
  return "fa-sharp fa-solid fa-bolt"
})

const hiveAvatar = computed(() => {
  console.log("computing hiveAvatar", dInvoice.value.v4vapp.sendTo)
  if (!dInvoice.value?.v4vapp?.sendTo) {
    return
  }
  const ans = useHiveAvatarURL({ hiveAccname: dInvoice.value.v4vapp.sendTo })
  console.log(ans)
  return ans
})

function showDialog() {
  if (dInvoice.value?.makingInvoice) {
    main_message.value = t("making_invoice")
  } else {
    main_message.value = t("asking_details")
  }
  if (dInvoice.value.v4vapp.amountToSend) {
    updateAmounts(dInvoice.value.v4vapp.amountToSend, "sats")
  }
}

function calcSatsFeeOnly(sats) {
  let satsWithFees = sats
  satsWithFees *= 1 + storeAPIStatus.apiStatus.config.conv_fee_percent
  satsWithFees += storeAPIStatus.apiStatus.config.conv_fee_sats
  return satsWithFees - sats
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
  // Sending is true for sending Hive to Lightning
  const sending = dInvoice.value.sending
  switch (currency) {
    case "sats":
      sats = parseInt(amount)
      if (sending) {
        amount += calcSatsFeeOnly(sats)
      } else {
        amount -= calcSatsFeeOnly(sats)
      }
      hive = amount / storeAPIStatus.hiveSatsNumber
      hbd = amount / storeAPIStatus.HBDSatsNumber
      break

    case "hive":
      sats = amount * storeAPIStatus.hiveSatsNumber
      if (sending) {
        sats -= calcSatsFeeOnly(sats)
      } else {
        sats += calcSatsFeeOnly(sats)
      }
      hive = amount
      hbd =
        (amount * storeAPIStatus.hiveSatsNumber) / storeAPIStatus.HBDSatsNumber
      break

    case "hbd":
      sats = amount * storeAPIStatus.HBDSatsNumber
      if (sending) {
        sats -= calcSatsFeeOnly(sats)
      } else {
        sats += calcSatsFeeOnly(sats)
      }
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
  amounts.value.satsNum = parseFloat(sats.toFixed(0))
  amounts.value.hbdNum = parseFloat(hbd.toFixed(2))
  amounts.value.sats = tidyNumber(sats.toFixed(0), 0)
  amounts.value.hive = tidyNumber(hive.toFixed(3))
  amounts.value.hbd = tidyNumber(hbd.toFixed(2))
}

const vAutofocus = {
  mounted(el) {
    el.focus()
  },
}

async function createInvoice() {
  if (dInvoice.value.v4vapp.type === "hiveAccname") {
    let amountSats
    if (typeof amounts.value.sats === "string") {
      amountSats = parseFloat(amounts.value.sats.replace(/,/g, ""), 10)
    }
    dInvoice.value.askDetails = false
    dInvoice.value.satoshis = amountSats
    dInvoice.value.v4vapp.amountToSend = amountSats
    emit("newInvoice", dInvoice.value)
    return
  }
  const newInvoice = await useCreateInvoice(dInvoice.value)
  emit("newInvoice", newInvoice)
  // emit("amounts", amounts.value)
}
</script>

<style lang="scss" scoped>
.input-amount {
  width: 6.3rem;
  font-size: 2rem;
}

.header-bar {
  font-size: 1.5rem;
  background: #333; /* Change this to the color you want */
  color: #fff; /* Change this to the color you want for the text */
  text-align: center;
}
</style>
