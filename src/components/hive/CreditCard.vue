<template>
  <q-card @click="changeBackground" class="credit-card-background q-ma-xs">
    <q-img
      :src="creditCardBackground"
      width="365px"
      basic
      style="border-radius: 15px"
    />
    <div class="credit-card-shading" :style="creditCardShading"></div>
    <q-img
      :src="creditCardOverlay"
      width="365px"
      style="position: absolute; top: 0; left: 0; border-radius: 15px"
    />
    <q-card-section
      v-if="storeUser.currentUser"
      class="credit-card-strip absolute-bottom q-py-xs text-subtitle2 text-left"
      :style="creditCardStripStyle"
    >
      <div class="row">
        <div class="col-8 flex items-center">
          <div class="credit-card-avatar">
            <q-avatar rounded size="md">
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
        <div class="col-4 text-right">
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
          <tr>
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
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { computed, ref } from "vue"
const storeUser = useStoreUser()
import { useQuasar } from "quasar"
import HbdLogoIcon from "../utils/HbdLogoIcon.vue"

const q = useQuasar()
const savingsToggle = ref(false)

const backgroundImage = [
  "sealogo01",
  "sealogo02",
  "lightning01",
  "lightning02",
  "lightning03",
  "lightning04",
  "dolphins",
]

const maxValue = backgroundImage.length
// generate random number between 0 and 1
const backgroundIndex = ref(Math.floor(Math.random() * maxValue))

const lightDark = computed(() => {
  if (q.dark.isActive) {
    return "dark"
  }
  return "light"
})

const balances = computed(() => {
  if (savingsToggle.value) {
    return {
      hive: storeUser.savingsHiveBalance,
      hbd: storeUser.savingsHbdBalance,
      sats: storeUser.savingsSatsBalance,
      totalSats: storeUser.totalSatsBalance,
    }
  } else {
    return {
      hive: storeUser.hiveBalance,
      hbd: storeUser.hbdBalance,
      sats: storeUser.satsBalance,
      totalSats: storeUser.totalSatsBalance,
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
  return `credit-card/overlay/${lightDark.value}/credit-card.webp`
})
const creditCardBackground = computed(() => {
  return `credit-card/backgrounds/${
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
  console.log(backgroundIndex.value)
}

storeUser.update()
</script>

<style lang="scss" scoped>
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

// .credit-card-text {
//   color: white;
// }

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
</style>
