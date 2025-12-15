<template>
  <div class="row q-pa-sm destinations">
    <div class="col-12 q-px-sm sending-to">
      <div class="q-pa-sm">
        <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options />
      </div>
      <div class="q-pa-sm">
        <div class="row items-center">
          <div class="col-12">
            <q-input
              filled
              type="number"
              inputmode="decimal"
              v-model="amountSats"
              :label="$t('amount_to_send') + ' ' + amountDisplay + ' sats'"
              stack-label
              @update:model-value="() => handleInput()"
            />
          </div>
          <div class="q-pa-sm">
            <q-btn
              color="primary"
              label="Generate"
              :disable="!amountChanged"
              @click="generateUnlimitedInvoice"
              clearable
            />
          </div>
          <div class="q-px-sm">
            <q-btn
              icon="content_copy"
              size="sm"
              round
              :disable="!invoice.pr"
              @click="copyToClipboard(invoice.pr)"
            >
              <q-tooltip>{{ t("copy_qrcode") }}</q-tooltip>
            </q-btn>
          </div>
          <!-- Show the QR dialog -->
          <div class="col-12">
            <q-input
              v-model="invoice.pr"
              label="Invoice"
              stack-label
              rows="6"
              readonly
              autogrow
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import { useI18n } from "vue-i18n"
import { tidyNumber } from "src/use/useUtils"
import { useGetUnlimitedInvoice } from "src/use/useLightningInvoice"
import { copyToClipboard } from "quasar"

const t = useI18n().t

const storeUser = useStoreUser()
const hiveAccTo = ref({ label: "", value: "", caption: "" })
const amountSats = ref(0)
const amountDisplay = computed(() => {
  return tidyNumber(amountSats.value, 0)
})
const invoice = ref({})
const amountChanged = ref(false)

// track changes to the logged in user
watch(storeUser, () => {
  resetValues()
})

onMounted(() => {
  // on load set the hiveAccTo to the current user
  resetValues
})

function resetValues() {
  hiveAccTo.value = {
    label: storeUser.hiveAccname,
    value: storeUser.hiveAccname,
    caption: storeUser.profileName,
  }
  const specialUsers = [
    "v4vapp.tre",
    "devtre.v4vapp",
    "brianoflondon",
    "v4vapp-test",
  ]
  if (specialUsers.includes(storeUser.currentUser)) {
    amountSats.value = 999900
  }
  amountChanged.value = true
}

function handleInput() {
  amountChanged.value = true
}

async function generateUnlimitedInvoice() {
  try {
    invoice.value = await useGetUnlimitedInvoice(
      hiveAccTo.value.value,
      amountSats.value,
      "v4v.app"
    )
    if (invoice.value.error) {
      invoice.value.pr = invoice.value.error
      return
    }
    amountChanged.value = false
    copyToClipboard(invoice.value.pr)
  } catch (error) {
    invoice.value.pr = "Error"
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
// add bordered div
.destinations {
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>
