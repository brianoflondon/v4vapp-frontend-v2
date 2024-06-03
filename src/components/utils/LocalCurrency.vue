<template>
  <div class="bordered-div row wrap justify-between content-start q-gutter-xs">
    <div class="bordered-div col-8">
      <q-select
        use-input
        fill-input
        hide-selected
        v-model="currency"
        @filter="filterFnAutoselect"
        :options="currencyOptionsFiltered"
        :label="t('local_currency')"
        clearable
      />
    </div>
    <div class="bordered-div col-3">
      <q-input
        :label="`${usdToCurrency}`"
        v-model="formattedFixedRate"
        inputmode="decimal"
        pattern="\d*"
        debounce="1000"
        clearable
      >
        <template v-slot:append>
          <!-- small -->
          <div class="">
            {{ currency.unit?.toUpperCase() }}
          </div>
        </template>
      </q-input>
    </div>
    <div class="fit row wrap justify-center q-pt-sm">
      <div class="bordered-div col-12">
        <div class="text-caption text-left q-pb-sm">
          {{ t("receive_currency") }}
        </div>
        <q-btn-toggle
          spread
          v-model="receiveCurrency"
          push
          no-caps
          dense
          @update:model-value="selectReceiveCurrency($event)"
          toggle-color="primary"
          unelevated
          :options="[
            { label: '', value: 'hbd', slot: 'hbd' },
            { label: '', value: 'hive', slot: 'hive' },
            {
              label: '',
              value: 'sats',
              slot: 'sats',
            },
          ]"
        >
          <!-- HBD Button -->
          <template #hbd>
            <div
              class="row items-center justify-start content-between q-pa-none"
              style="font-size: 1.2rem"
            >
              <div><HbdLogoIcon /></div>
              <div class="q-px-sm" style="font-size: 1rem">HBD</div>
            </div>
          </template>
          <!-- Hive Button -->
          <template #hive>
            <div
              class="row items-center justify-start q-pa-none"
              style="font-size: 2.05rem"
            >
              <div><i class="fa-brands fa-hive" /></div>
              <div class="q-px-sm" style="font-size: 1rem">Hive</div>
            </div>
          </template>
          <template #sats>
            <div class="flex column">
              <div
                class="row items-center justify-start q-pa-none"
                style="font-size: 2.05rem"
              >
                <div><i class="fa-brands fa-btc" /></div>
                <div class="q-px-sm" style="font-size: 1rem">KeepSats</div>
              </div>
            </div>
          </template>
        </q-btn-toggle>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import HbdLogoIcon from "src/components/utils/HbdLogoIcon.vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { useCoingeckoStore } from "src/stores/storeCoingecko"
import { tidyNumber } from "src/use/useUtils"
const t = useI18n().t
const storeUser = useStoreUser()
const storeCoingecko = useCoingeckoStore()

const coingeckoRates = ref([])
const currencyOptions = ref([])
const currencyOptionsFiltered = ref([])
const currency = ref({ label: "US Dollar", value: "usd" })

const receiveCurrency = ref("hbd")

// This is where the actual numeric value is stored
const fixedRate = ref(null)

const formattedFixedRate = computed({
  get: () => {
    // Convert number to string (e.g., format it as needed)
    return tidyNumber(parseFloat(fixedRate?.value))
  },
  set: (value) => {
    // Convert string input back to a number
    if (value) {
      fixedRate.value = parseFloat(value)
      storeUser.pos.fixedRate = fixedRate.value
    } else {
      fixedRate.value = null
      storeUser.pos.fixedRate = null
    }
  },
})

function exchangeRate() {
  if (!coingeckoRates.value[currency.value?.value]?.value) {
    // set the value to 1 USD if the currency is not found
    return null
  }
  return (
    coingeckoRates.value[currency.value.value]?.value /
    coingeckoRates.value["usd"]?.value
  )
}

const usdToCurrency = computed(() => {
  if (!coingeckoRates.value[currency.value.value]?.value) {
    return t("set_rate") + ": $1USD = " + currency.value.unit
  }
  return (
    t("market_rate") +
    ": $1USD = " +
    currency.value.unit +
    " " +
    tidyNumber(exchangeRate(), 2)
  )
})

watch(
  () => currency.value,
  (val) => {
    if (val === "" || val === null || val === undefined) {
      currency.value = {
        label: "US Dollar",
        value: "usd",
        unit: "$",
      }
    }
    storeUser.localCurrency = currency.value
    // reset stored fixedRate to null when currency changes
    fixedRate.value = exchangeRate()
  }
)

watch(
  () => storeUser.localCurrency,
  () => {
    currency.value = storeUser.localCurrency
    // reset stored fixedRate to null when currency changes
    storeUser.pos.fixedRate = null
    fixedRate.value = exchangeRate()
  }
)

async function selectReceiveCurrency(val) {
  console.log(val)
  if (val === "hbd") {
    storeUser.pos.receiveCurrency = "hbd"
  } else if (val === "hive") {
    storeUser.pos.receiveCurrency = "hive"
  } else if (val === "sats") {
    storeUser.pos.receiveCurrency = "sats"
  }
}

async function filterFnAutoselect(val, update, abort) {
  update(() => {
    if (val === "" || val === null || val === undefined) {
      currencyOptionsFiltered.value = []
    } else {
      currencyOptionsFiltered.value = currencyOptions.value.filter((item) => {
        const searchLabels = item.label
          .toLowerCase()
          .includes(val.toLowerCase())
        if (searchLabels) {
          return searchLabels
        }
        const searchValues = item.value
          .toLowerCase()
          .includes(val.toLowerCase())
        return searchValues
      })
      if (currencyOptionsFiltered.value.length === 1) {
        currency.value = currencyOptionsFiltered.value[0]
      }
      if (currencyOptionsFiltered.value.length === 0) {
        currency.value = {
          label: val,
          value: val.substring(0, 3),
          unit: val.substring(0, 3),
        }
      }
    }
  })
}

onMounted(async () => {
  if (storeUser.localCurrency) {
    currency.value = storeUser.localCurrency
  }
  ;[coingeckoRates.value, currencyOptions.value] =
    await storeCoingecko.fetchCoingeckoRates()
  if (storeUser.pos.fixedRate) {
    fixedRate.value = parseFloat(storeUser.pos.fixedRate)
  } else {
    fixedRate.value = null
  }
})
</script>

<style lang="scss" scoped>
.bordered-div {
  border: 0px solid;
  border-color: black;
}
</style>
