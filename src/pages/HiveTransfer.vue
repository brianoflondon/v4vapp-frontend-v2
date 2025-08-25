<template>
  <q-page>
    <div class="fit row wrap justify-center q-pb-md">
      <div>
        <CreditCard />
      </div>
    </div>
    <div class="q-pa-sm">
      <div class="row q-pa-sm destinations">
        <div class="col-6 q-px-sm v4vapp-sending-from">
          {{ sendingFromLabel }}
          <div class="q-pa-none">
            <HiveSelectFancyAcc dense v-model="hiveAccFrom" fancy-options />
          </div>
        </div>
        <div class="col-6 q-px-sm v4vapp-sending-to">
          {{ sendingToLabel }}
          <div class="q-pa-none">
            <HiveSelectFancyAcc dense v-model="hiveAccTo" fancy-options />
          </div>
        </div>
      </div>
      <div class="flex justify-center q-pa-sm amount-buttons">
        <div v-for="button in btnAmounts" :key="button.id" class="q-pa-sm">
          <q-btn
            rounded
            color="primary"
            :label="tidyNumber(button)"
            @click="amount = button"
            tabindex="-1"
          />
        </div>
      </div>
      <div class="row q-pa-sm">
        <div class="col-4 q-pr-sm">
          <q-input
            filled
            type="number"
            inputmode="decimal"
            v-model="amount"
            :label="$t('amount_to_send')"
            stack-label
            v-autofocus
          />
        </div>
        <div class="col-6 q-pr-sm vertical-middle text-center currency-options">
          <q-option-group
            v-model="optionsSelected"
            :options="optionsCurrency"
            color="primary"
            label="Currency:"
            inline
          />
        </div>
        <div class="col-2 q-pr-sm vertical-middle text-center">
          <q-btn rounded @click="sendTransfer">Send</q-btn>
        </div>
      </div>
      <div class="amounts-display row q-pa-sm">
        <div class="col q-pr-sm" v-for="(value, key) in optionsCur" :key="key">
          <q-input
            v-model="allAmounts[key]"
            outlined
            :editable="false"
            :readonly="true"
            :label="value.label + ' ' + $t('amount')"
            stack-label
            tabindex="-1"
            @click="copyNumToClipboard(allAmounts[key])"
          />
        </div>
      </div>
      <div class="memo-row row q-pa-sm">
        <div class="col-8">
          <div class="col q-pr-sm">
            <q-input filled v-model="memo" label="Memo / Boost:" stack-label />
          </div>
          <div class="col-8 q-pr-sm">
            <q-input
              filled
              v-model="podcastMemo"
              label="Extra Details:"
              stack-label
              readonly
            />
          </div>
        </div>
        <div class="col-4 q-pl-sm">
          <div class="row text-center justify-center">
            <CreateHASQRCode :qrText="qrCodeText" :width="200" :height="200" />
          </div>
        </div>
      </div>
    </div>
    <div class="q-pa-sm">
      <div>
        <q-input
          v-model="searchPodcast"
          label="Podcast Index Search"
          filled
          debounce="400"
        />
      </div>
      <div v-if="selectedPodcast">
        <q-list>
          <q-item-label>{{ selectedPodcast.title }}</q-item-label>
          <q-item
            v-for="valueItem in valueBlocks?.value?.destinations"
            :key="valueItem.id"
          >
            <q-item-section>
              <q-item-label>{{ valueItem.name }} </q-item-label>
              <q-item-label>{{ valueItem.address }}</q-item-label>
            </q-item-section>
            <q-item-section>{{ valueItem.split }}</q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-list bordered separator>
        <q-item
          clickable
          v-ripple
          v-for="item in result?.feeds"
          :key="item.id"
          @click="podcastClicked(item)"
        >
          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
            <q-item-label caption lines="3">
              {{ item.description }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { encodeOp } from "hive-uri"
import CreateHASQRCode from "src/components/qrcode/CreateHASQRCode.vue"
import { defineComponent, ref, watch, onMounted, computed } from "vue"
import { useQuasar } from "quasar"
import { KeychainSDK } from "keychain-sdk"
import { useStoreUser } from "src/stores/storeUser"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import HiveSelectFancyAcc from "src/components/HiveSelectFancyAcc.vue"
import { api } from "boot/axios"
import { useI18n } from "vue-i18n"
import CreditCard from "src/components/hive/CreditCard.vue"

const t = useI18n().t
const hiveAccFrom = ref({ label: "", value: "", caption: "" })
const hiveAccTo = ref({ label: "", value: "", caption: "" })

const $q = useQuasar()
const storeUser = useStoreUser()
const storeAPIStatus = useStoreAPIStatus()

const amount = ref("10")
const memo = ref("")

const btnAmountsNormal = [10, 100, 200, 500, 1000, 1500, 2000, 3000, 5000]
const btnAmountsSats = [5000, 10000, 25000, 50000, 100000, 250000]

const btnAmounts = ref(btnAmountsNormal)

const optionsCur = {
  HIVE: {
    symbol: "HIVE",
    label: "Hive",
    amount: 0,
  },
  HBD: {
    symbol: "HBD",
    label: "HBD",
    amount: 0,
  },
  sats: {
    symbol: "sats",
    label: "Sats",
    amount: 0,
  },
  USD: {
    symbol: "USD",
    label: "USD",
    amount: 0,
  },
}
const optionsCurrency = Object.entries(optionsCur).map(([key, value]) => ({
  label: value.label,
  value: key,
}))

const optionsSelected = ref("HIVE")

defineComponent({
  name: "TestingTransfers",
})

const sendingFromLabel = computed(
  () => t("sending") + " " + t("from") + " " + hiveAccFrom.value.caption
)

const sendingToLabel = computed(
  () => t("sending") + " " + t("to") + " " + hiveAccTo.value.caption
)

const hiveAmount = computed(() => {
  let answer = 0
  if (optionsSelected.value === "HIVE") {
    answer = Number(amount.value).toFixed(3)
  }
  if (optionsSelected.value === "HBD") {
    answer = Number(amount.value / storeAPIStatus.hiveHBDNumber).toFixed(3)
  }
  if (optionsSelected.value === "sats") {
    answer = Number(amount.value / storeAPIStatus.hiveSatsNumber).toFixed(3)
  }
  if (optionsSelected.value === "BTC") {
    answer = Number(amount.value / storeAPIStatus.hiveBTCNumber).toFixed(3)
  }
  if (optionsSelected.value === "USD") {
    answer = Number(
      amount.value / storeAPIStatus.apiStatus.crypto.hive.usd
    ).toFixed(3)
  }
  return answer
})

const allAmounts = computed(() => {
  return {
    HIVE: Number(hiveAmount.value).toFixed(3),
    HBD: Number(hiveAmount.value * storeAPIStatus.hiveHBDNumber).toFixed(3),
    sats: tidyNumber(
      (hiveAmount.value * storeAPIStatus.hiveSatsNumber).toFixed(0)
    ),
    USD: tidyNumber(
      (hiveAmount.value * storeAPIStatus.apiStatus?.crypto?.hive?.usd).toFixed(
        2
      )
    ),
    LOCAL: tidyNumber(
      (hiveAmount.value * storeAPIStatus.apiStatus?.crypto?.hive?.usd).toFixed(
        2
      )
    ),
  }
})

function tidyNumber(x) {
  if (x) {
    const parts = x.toString().split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
  } else {
    return null
  }
}

async function copyNumToClipboard(value) {
  try {
    const valueNumber = parseFloat(value.replace(/,/g, ""))
    await navigator.clipboard.writeText(valueNumber)
  } catch (error) {
    console.error("Failed to copy value to clipboard:", error)
  }
}

watch(optionsSelected, () => {
  if (optionsSelected.value === "sats") {
    btnAmounts.value = btnAmountsSats
  } else {
    btnAmounts.value = btnAmountsNormal
  }
})

const currencyToSend = computed(() => {
  if (optionsSelected.value === "HBD") {
    return "HBD"
  }
  return "HIVE"
})

const amountToSend = computed(() => {
  if (optionsSelected.value === "HBD") {
    return parseFloat(amount.value).toFixed(3)
  }
  return hiveAmount.value
})

async function sendTransfer() {
  try {
    const keychain = new KeychainSDK(window)
    let memoToSend = memo.value
    if (podcastMemo.value) {
      memoToSend = podcastMemo.value
    }

    const formParamsAsObject = {
      data: {
        username: hiveAccFrom.value.value,
        to: hiveAccTo.value.value,
        amount: amountToSend.value,
        memo: memoToSend,
        enforce: false,
        currency: currencyToSend.value,
      },
      options: {},
    }
    const transfer = await keychain.transfer(
      formParamsAsObject.data,
      formParamsAsObject.options
    )
  } catch (error) {
    console.error("❌ failure")
    console.error({ error })
    $q.notify(`${error.message}`)
  }
}

const vAutofocus = {
  mounted(el) {
    el.focus()
  },
}

const qrCodeText = computed(() => {
  const op = [
    "transfer",
    {
      from: hiveAccFrom.value.value,
      to: hiveAccTo.value.value,
      amount: amountToSend.value + " " + currencyToSend.value,
      memo: memo.value,
    },
  ]
  const hiveUri = encodeOp(op)
  return hiveUri
})

onMounted(() => {
  if (storeUser.hiveAccname) {
    hiveAccFrom.value = {
      label: storeUser.hiveAccname,
      value: storeUser.hiveAccname,
      caption: storeUser.hiveAccname,
    }
    if (storeUser.hiveAccname === "v4vapp.tre") {
      hiveAccTo.value = {
        label: "bdhivesteem",
        value: "bdhivesteem",
        caption: "bdhivesteem",
      }
      memo.value = "100116033"
    }
    if (storeUser.hiveAccname === "v4vapp.dev") {
      hiveAccTo.value = {
        label: "hivehydra",
        value: "hivehydra",
        caption: "hivehydra",
      }
      memo.value = "#brianoflondon@sats.v4v.app"
    }
  }
  // Auto-fill amount based on balance, rounding to nearest 50 HIVE
  checkAndSetAmount()
})

// Function to check if balance is available and set amount
function checkAndSetAmount() {
  console.log("Checking Hive balance...")
  console.log("storeUser.hiveBalanceLocal:", storeUser.hiveBalanceLocal)

  // Check if we have a valid balance (not null and not loading indicator)
  if (storeUser.hiveBalanceLocal && storeUser.hiveBalanceLocal !== "💰💰💰") {
    // Balance is already available and valid, call autoFillAmountFromBalance directly
    autoFillAmountFromBalance(50)
  } else {
    // Set up a watcher to wait for the balance to be available
    const stopWatch = watch(
      () => storeUser.hiveBalanceLocal,
      (newBalance) => {
        // Only proceed if we have a valid balance (not null and not loading indicator)
        if (newBalance && newBalance !== "💰💰💰") {
          autoFillAmountFromBalance(50)
          stopWatch() // Stop watching once we've used the balance
        }
      },
      { immediate: true } // Check immediately and then on changes
    )
  }
}

/**
 * Automatically sets the amount based on available balance
 * @param {number} roundToNearest - The increment to round down to (e.g., 50, 100)
 */
function autoFillAmountFromBalance(roundToNearest = 50) {
  // Double-check that we have a valid balance
  if (storeUser.hiveBalanceLocal && storeUser.hiveBalanceLocal !== "💰💰💰") {
    try {
      // Get the available balance as a number
      const availableBalance = parseFloat(storeUser.hiveBalanceLocal)

      // Verify that we have a valid number
      if (isNaN(availableBalance)) {
        console.log("Invalid balance format:", storeUser.hiveBalanceLocal)
        return
      }

      console.log(
        `Available balance: ${availableBalance} HIVE (from storeUser.hiveBalanceLocal)`
      )

      // Calculate a safe amount (80% of available balance)
      const safeAmount = availableBalance * 0.8

      // Round down to the nearest specified increment
      const roundedAmount =
        Math.floor(safeAmount / roundToNearest) * roundToNearest

      // Set a minimum value (10 HIVE or the user's balance if lower)
      const minAmount = 10

      // Update the amount ref with the calculated value, or minAmount if roundedAmount is less than minAmount
      amount.value =
        roundedAmount >= minAmount
          ? roundedAmount.toString()
          : availableBalance < minAmount
          ? availableBalance.toFixed(3)
          : minAmount.toString()

      console.log(
        `Auto-filled amount: ${amount.value} HIVE (from balance: ${availableBalance} HIVE)`
      )
    } catch (error) {
      console.error("Error calculating amount from balance:", error)
    }
  } else {
    console.log("No valid Hive balance available, using default amount")
    // Keep default value
  }
}

// ----------------- Podcast Index Search -----------------

const searchPodcast = ref("")
const selectedPodcast = ref()
const result = ref()
const valueBlocks = ref()
// const podcastMemo = ref("")

watch(searchPodcast, async (newValue, oldValue) => {
  console.log("searchPodcast", newValue)
  if (newValue.length > 2) {
    await searchPodcastIndex()
  }
})

const searchPodcastIndex = async () => {
  const call = `/search/byterm?q=${searchPodcast.value}&val=lightning`
  const res = await api.get("/pi/", {
    params: { call: call },
  })
  if (res?.data?.status === "true") {
    result.value = res.data
  }
  console.log("res", res)
}

async function getValueBlocks(podcastGuid) {
  const call = `/value/bypodcastguid?guid=${podcastGuid}`
  console.log("call", call)
  try {
    const res = await api.get("/pi/", {
      params: { call: call },
    })
    console.log(res)
    if (res?.data?.status === "true") {
      valueBlocks.value = res.data
    }
    console.log("res", res)
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

const podcastMemo = computed(() => {
  if (selectedPodcast.value) {
    return (
      "#podcastGuid | " +
      selectedPodcast.value.podcastGuid +
      " | " +
      (hiveAmount.value * storeAPIStatus.hiveSatsNumber).toFixed(0) +
      " sats | " +
      amount.value +
      " | " +
      optionsSelected.value +
      " | " +
      memo.value
    )
  } else {
    return ""
  }
})

async function podcastClicked(item) {
  getValueBlocks(item.podcastGuid)
  selectedPodcast.value = item
  console.log("podcastClicked", item)
}
</script>
