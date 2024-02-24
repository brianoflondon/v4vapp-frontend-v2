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
          <div class="row col-12">
            <div
              v-if="false"
              class="col-6 text-right text-h6 credit-card-text embossed-text"
            >
              {{ balances["keepSats"] }}
              <span>
                シ
                <q-tooltip>シ {{ $t("sats") }}</q-tooltip>
              </span>
            </div>
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
      <div class="row items-top justify-between">
        <div class="col-8 flex items-center">
          <div class="credit-card-avatar">
            <q-avatar rounded size="xl">
              <HiveAvatar :hiveAccname="storeUser.hiveAccname" />
            </q-avatar>
          </div>
          <div class="credit-card-text q-pl-sm">
            <div class="text-h7 embossed-text">
              {{ storeUser.profileName }}
            </div>
            <div class="text-subtitle2">
              {{ storeUser.hiveAccname }}@v4v.app
            </div>
          </div>
          <div style="font-size: 0.7rem">
            <q-checkbox
              v-model="savingsToggle"
              checked-icon="savings"
              unchecked-icon="savings"
              :label="$t('savings')"
            >
            </q-checkbox>
            <q-tooltip>{{ $t("savings_tooltip") }}</q-tooltip>
          </div>
        </div>
        <!-- Table for the balances  -->
        <div class="col-4 text-right">
          <div class="row justify-end">
            <table>
              <tr v-if="nonZeroKeepSats">
                <td class="numeric-cell-lg">
                  {{ balances["keepSats"] }}<br />
                </td>
                <td>
                  シ
                  <q-tooltip>シ = {{ $t("sats") }}</q-tooltip>
                </td>
              </tr>
              <tr>
                <td class="numeric-cell">{{ balances["hive"] }}<br /></td>
                <td>
                  <q-icon name="fa-brands fa-hive" />
                </td>
              </tr>
              <tr>
                <td class="numeric-cell">
                  {{ balances["hbd"] }}
                </td>
                <td class="q-pl-sm">
                  <HbdLogoIcon />
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
import ConfettiExplosion from "vue-confetti-explosion"

const storeUser = useStoreUser()
const q = useQuasar()
const savingsToggle = ref(false)

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
const explode = async () => {
  visible.value = false
  await nextTick()
  visible.value = true
}

let timeoutId = null

const maxValue = backgroundImage.length
// generate random number between 0 and 1
const backgroundIndex = ref(Math.floor(Math.random() * maxValue))

onMounted(() => {
  scheduleUpdate()
})

watch(
  () => storeUser.keepSatsBalanceNum,
  (newVal, oldVal) => {
    // This function will be called whenever `storeUser.keepSatsBalance` changes
    console.log(
      "keepSatsBalance changed from",
      oldVal,
      "to",
      newVal,
      "delta:",
      newVal - oldVal
    )
    const satsChange = tidyNumber(newVal - oldVal, 0)
    if (oldVal !== undefined && satsChange !== 0) {
      explode()
      q.notify({
        message: `KeepSats Balance changed by ${satsChange} sats`,
        color: "primary",
        position: "top",
        icon: "savings",
        timeout: 5000,
      })
    }
    // You can add your own code here to do something when `storeUser.keepSatsBalance` changes
  }
)

async function scheduleUpdate() {
  await storeUser.update()
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
  emit("balances", balances.value)
  return balances.value.keepSats !== "0"
})
const balances = computed(() => {
  if (savingsToggle.value) {
    return {
      hive: storeUser.savingsHiveBalance,
      hbd: storeUser.savingsHbdBalance,
      sats: storeUser.savingsSatsBalance,
      totalSats: storeUser.totalSatsBalance,
      keepSats: storeUser.keepSatsBalance,
    }
  } else {
    return {
      hive: storeUser.hiveBalance,
      hbd: storeUser.hbdBalance,
      sats: storeUser.satsBalance,
      totalSats: storeUser.totalSatsBalance,
      keepSats: storeUser.keepSatsBalance,
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
  console.log("changeBackground")
  backgroundIndex.value = (backgroundIndex.value + 1) % maxValue
  storeUser.update()
  emit("balances", balances.value)
}
</script>

<style lang="scss" scoped>
.div-border {
  border: 1px solid black;
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
}

.numeric-cell-lg {
  text-align: right;
  font-size: 1.5rem;
}
</style>
