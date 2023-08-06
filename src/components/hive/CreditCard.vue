<template>
  <q-card class="credit-card-background q-ma-xs">
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
      class="absolute-bottom q-py-xs text-subtitle2 text-left"
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
        </div>
        <div class="col-4 text-right">
          <tr>
            <td class="numeric-cell">
              {{ storeUser.hiveBalance }}
            </td>
            <td>
              <q-icon name="fa-brands fa-hive" />
            </td>
          </tr>
          <tr>
            <td class="numeric-cell">
              {{ storeUser.hbdBalance }}
            </td>
            <td class="q-pl-sm">
              <q-icon name="img:/avatars/hbd_logo.svg">
                <q-tooltip>HBD - Hive Blockchain Dollar</q-tooltip>
              </q-icon>
            </td>
          </tr>
          <tr>
            <td
              class="table-border-top numeric-cell q-pt-xs"
              style="border-top: 1px solid"
            >
              <strong>{{ storeUser.satsBalance }}</strong>
            </td>
            <td>
              <q-icon name="fa-brands fa-btc">
                <q-tooltip>BTC equivalent in Sats</q-tooltip>
              </q-icon>
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

const q = useQuasar()

// generate random number between 0 and 1
const backgroundIndex = Math.floor(Math.random() * 3)

const lightDark = computed(() => {
  if (q.dark.isActive) {
    return "dark"
  }
  return "light"
})

const backgroundImage = ref([
  "dolphins",
  "lightning01",
  "lightning02",
  "lightning03",
])
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
  return `credit-card/backgrounds/${backgroundImage.value[backgroundIndex]}.webp`
})
const creditCardShading = computed(() => {
  if (q.dark.isActive) {
    return "background: rgba(0, 0, 0, 0.6)"
  } else {
    return "background: rgba(0, 0, 0, 0)"
  }
})

const creditCardImage = computed(() => {
  if (q.dark.isActive) {
    return "credit-card/credit-card-dolphins-dark.webp"
  }
  return "credit-card/credit-card-dolphins-light.webp"
})

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
