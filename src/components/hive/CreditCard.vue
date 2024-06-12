<template>
  <div>
    <ConfettiExplosion v-if="visible" />
  </div>
  <q-card @click="changeBackground" class="credit-card-background q-ma-xs">
    <q-img
      :src="creditCardBackground"
      width="365px"
      basic
      style="border-radius: 15px"
    />
    <div class="stored-sats">
      <div class="credit-card-shading" :style="creditCardShading">
        <div class="items-end flex row">
          <div class="card-spacer row col-12"></div>
          <!-- Sats balance on the face of the credit card -->
          <div class="row col-12" v-if="false">
            <div class="text-h6 credit-card-text embossed-text"></div>
          </div>
          <!-- Sats balance on the face of the credit card -->
        </div>
      </div>
    </div>
    <q-img
      :src="creditCardOverlay"
      width="365px"
      style="position: absolute; top: 0; left: 0; border-radius: 15px"
    />
    <q-card-section
      v-if="storeUser.currentUser"
      class="credit-card-strip absolute-bottom q-py-xs q-px-sm text-subtitle2 text-left"
      :style="creditCardStripStyle"
    >
      <div class="credit-card-text row items-top justify-between">
        <!-- Name avatar and buttons -->
        <div class="profile-details col-7 flex items-center">
          <div class="credit-card-avatar">
            <q-avatar rounded size="lg">
              <HiveAvatar :hiveAccname="storeUser.hiveAccname" />
            </q-avatar>
          </div>
          <div class="credit-card-text q-pl-sm">
            <div class="profile-name text-h7 embossed-text">
              {{ storeUser.profileName }}
            </div>
            <div class="text-subtitle2">
              {{ storeUser.hiveAccname }}@v4v.app
            </div>
          </div>
          <div style="font-size: 1.2rem">
            <q-checkbox
              v-model="currencyToggle"
              size="sm"
              unchecked-icon="currency_exchange"
              checked-icon="currency_exchange"
              :label="storeUser.localCurrency.unit"
            >
            </q-checkbox>
            <q-tooltip>{{ $t("savings_tooltip") }}</q-tooltip>
          </div>
          <div class="q-px-sm" style="font-size: 0.7rem">
            <q-checkbox
              v-model="savingsToggle"
              size="sm"
              checked-icon="savings"
              unchecked-icon="savings"
              :label="$t('savings')"
            >
            </q-checkbox>
            <q-tooltip>{{ $t("savings_tooltip") }}</q-tooltip>
          </div>
        </div>
        <!-- End Name avatar and buttons -->
        <!-- Table for the balances  -->
        <div class="col-5 text-right">
          <div class="row justify-end">
            <table>
              <tr>
                <td class="keepsats-table-cell">KeepSats</td>
              </tr>
              <tr v-if="nonZeroKeepSats">
                <td class="numeric-cell-lg">
                  <span v-if="currencyToggle" style="font-size: 1rem">
                    {{ storeUser.localCurrency.unit }}
                  </span>
                  {{ balances["keepSats"] }}<br />
                </td>
                <td class="numeric-cell">
                  <div v-if="!balances['bitcoinDisplay']">
                    <span>シ</span>
                    <q-tooltip>シ = {{ $t("sats") }}</q-tooltip>
                  </div>
                  <div v-else>
                    <span><i class="fa-brands fa-btc" /></span>
                    <q-tooltip>Bitcoin</q-tooltip>
                  </div>
                </td>
                <td class="keepsats-table-cell numeric-cell q-pl-sm">
                  sats
                </td>
              </tr>
              <tr>
                <td class="numeric-cell">
                  <span v-if="currencyToggle">
                    {{ storeUser.localCurrency.unit }}
                  </span>
                  {{ balances["hive"] }}<br />
                </td>
                <td>
                  <q-icon name="fa-brands fa-hive" />
                </td>
                <td class="keepsats-table-cell numeric-cell q-pl-sm">
                  Hive
                </td>
              </tr>
              <tr>
                <td class="numeric-cell">
                  <span v-if="currencyToggle">
                    {{ storeUser.localCurrency.unit }}
                  </span>
                  {{ balances["hbd"] }}
                </td>
                <td class="numeric-cell q-pl-sm">
                  <HbdLogoIcon />
                </td>
                <td class="keepsats-table-cell numeric-cell q-pl-sm">
                  HUSD
                </td>
              </tr>
              <!-- Lower summation of Hive amounts -->
              <tr v-if="false">
                <td
                  class="table-border-top numeric-cell q-pt-xs"
                  style="border-top: 1px solid"
                >
                  <strong>{{ balances["sats"] }}</strong
                  ><br />
                  <div style="font-size: 0.7rem; line-height: 0.3rem">
                    +<q-icon name="savings"></q-icon>&nbsp;{{
                      balances["totalSats"]
                    }}
                  </div>
                </td>
                <td>
                  シ
                  <q-tooltip>シ = {{ $t("sats") }}</q-tooltip>
                </td>
              </tr>
            </table>
          </div>
          <!-- Lower summation of Hive amounts -->
        </div>
        <!-- Table for the balances  -->
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { nextTick, computed, ref, onMounted, watch } from "vue"
import { useQuasar } from "quasar"
import HbdLogoIcon from "../utils/HbdLogoIcon.vue"
import { tidyNumber } from "src/use/useUtils"
import { useI18n } from "vue-i18n"

// import { useLocalCurrencyBalances } from "src/use/useCurrencyCalc"
import ConfettiExplosion from "vue-confetti-explosion"

const storeUser = useStoreUser()
const q = useQuasar()
const savingsToggle = ref(false)
const currencyToggle = ref(false)
const t = useI18n().t

const adminOverride = ref(false)

// emit balances to the parent component
const emit = defineEmits(["balances"])

const backgroundImage = [
  "sealogo01",
  "sealogo02",
  "lightning01",
  "lightning02",
  "lightning03",
  "lightning04",
  "dolphins",
]

/**
 * ConfettiExplosion component
 */
const visible = ref(false)
async function explode() {
  visible.value = false
  await nextTick()
  visible.value = true
}

let timeoutId = null

const maxValue = backgroundImage.length
// generate random number between 0 and 1
const backgroundIndex = ref(Math.floor(Math.random() * maxValue))

onMounted(async () => {
  scheduleUpdate()
})

watch(
  () => storeUser.keepSatsBalanceNum,
  (newVal, oldVal) => {
    // This function will be called whenever `storeUser.keepSatsBalance` changes
    if (oldVal === "💰💰💰") {
      oldVal = 0
    }
    if (newVal === "💰💰💰") {
      newVal = 0
    }
    console.debug(
      "keepSatsBalance changed from",
      oldVal,
      "to",
      newVal,
      "delta:",
      newVal - oldVal
    )
    const satsChange = tidyNumber(newVal - oldVal, 0)
    // check if satsChange is a number and not 0

    if (oldVal !== undefined && satsChange !== 0) {
      const color = newVal - oldVal > 0 ? "positive" : "negative"
      explode()
      q.notify({
        message: `${t("balance_changed")} ${satsChange} sats`,
        color: color,
        position: "top-left",
        icon: "savings",
        timeout: 5000,
        actions: [
          {
            icon: "close",
            round: true,
            color: "white",
            handler: () => {},
          },
        ],
      })
    }
    // You can add your own code here to do something when `storeUser.keepSatsBalance` changes
  }
)

async function scheduleUpdate() {
  await storeUser.update(false)
  // Schedule the next update after 5 minutes
  timeoutId = setTimeout(scheduleUpdate, 5 * 60 * 1000)
}

const lightDark = computed(() => {
  if (q.dark.isActive) {
    return "dark"
  }
  return "light"
})

const nonZeroKeepSats = computed(() => {
  if (storeUser.currentKeepSats) {
    if (storeUser.currentKeepSats !== "0") {
      return true
    }
  }
  return false
})

const balances = computed(() => {
  if (currencyToggle.value) {
    if (savingsToggle.value) {
      return {
        hive: storeUser.savingsHiveBalanceLocal,
        hbd: storeUser.savingsHbdBalanceLocal,
        sats: storeUser.savingsSatsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalanceLocal,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    } else {
      return {
        hive: storeUser.hiveBalanceLocal,
        hbd: storeUser.hbdBalanceLocal,
        sats: storeUser.satsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalanceLocal,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    }
  } else {
    if (savingsToggle.value) {
      return {
        hive: storeUser.savingsHiveBalance,
        hbd: storeUser.savingsHbdBalance,
        sats: storeUser.savingsSatsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalance,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    } else {
      return {
        hive: storeUser.hiveBalance,
        hbd: storeUser.hbdBalance,
        sats: storeUser.satsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalance,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    }
  }
})

const creditCardStripStyle = computed(() => {
  if (q.dark.isActive) {
    return "background: rgba(0, 0, 0, 0.4)"
  } else {
    return "background: rgba(200, 200, 200, 0.8)"
  }
})
const creditCardOverlay = computed(() => {
  return `/credit-card/overlay/${lightDark.value}/credit-card.webp`
})
const creditCardBackground = computed(() => {
  return `/credit-card/backgrounds/${
    backgroundImage[backgroundIndex.value]
  }.webp`
})
const creditCardShading = computed(() => {
  if (q.dark.isActive) {
    return "background: rgba(0, 0, 0, 0.6)"
  } else {
    return "background: rgba(0, 0, 0, 0)"
  }
})

function changeBackground() {
  backgroundIndex.value = (backgroundIndex.value + 1) % maxValue
  storeUser.update(false)
  explode()
}

watch([() => storeUser.localCurrency, () => storeUser.pos.fixedRate], () => {
  storeUser.update()
})
</script>

<style lang="scss" scoped>
.div-border {
  border: 1px solid black;
}

.profile-name {
  font-weight: bold;
  word-wrap: break-word;
}

.card-spacer {
  height: 4.5rem;
}
.credit-card-background {
  position: relative;
  width: 365px;
  height: auto;
  border-radius: 15px;
  overflow: hidden;
}

.credit-card-shading {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: 15px;
}

.credit-card-aspect-ratio {
  width: 100%;
  height: 0;
  padding-bottom: calc(
    100% / 1.586
  ); /* Set the padding-bottom to achieve the desired aspect ratio */
  background-size: cover;
  border-radius: 12px;
  opacity: 1;
}

.numeric-cell {
  text-align: right;
  line-height: 0.9rem;
}

.numeric-cell-lg {
  text-align: right;
  font-size: 1.5rem;
  padding: 0px;
  margin: 0px;
  line-height: 1.3rem;
}

.keepsats-table-cell {
  padding: 0px;
  margin: 0px;
  text-align: left;
  font-size: 0.6rem;
  line-height: 0.6rem;
}
</style>
