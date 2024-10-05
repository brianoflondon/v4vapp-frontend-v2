<template>
  <div class="row q-pa-sm destinations">
    <div class="col-12 q-px-sm sending-to">
      <div class="q-pa-sm">
        <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options />
      </div>
      <div class="q-pa-sm">
        <div class="row">
          <div class="col-12">
            <q-input
              filled
              type="number"
              inputmode="decimal"
              v-model="amountSats"
              :label="$t('amount_to_send') + ' ' + amountDisplay + ' sats'"
              stack-label
            />
          </div>
          <div class="q-pa-sm">
            <q-btn
              color="primary"
              label="Generate"
              @click="generateUnlimitedInvoice"
            />
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
import { ref, onMounted, computed } from "vue"
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

const KeychainDialog = ref({ show: false, settings: false })

onMounted(() => {
  console.log("UnlimitedInvoice.vue")
  // on load set the hiveAccTo to the current user
  hiveAccTo.value = {
    label: storeUser.hiveAccname,
    value: storeUser.hiveAccname,
    caption: storeUser.profileName,
  }
  if (storeUser.currentUser === "v4vapp.tre") {
    amountSats.value = 999900
  }
})

async function generateUnlimitedInvoice() {
  console.log("generateUnlimitedInvoice")
  console.log("hiveAccTo", hiveAccTo.value)
  console.log("amountSats", amountSats.value)
  invoice.value = await useGetUnlimitedInvoice(
    hiveAccTo.value.value,
    amountSats.value,
    "v4v.app"
  )
  console.log(invoice.value.pr)
  copyToClipboard(invoice.value.pr)
}
</script>

<style lang="scss" scoped>
// add bordered div
.destinations {
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>
