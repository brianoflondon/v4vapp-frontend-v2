<template>
  <div class="q-pb-lg">
    <q-card width="370px" v-if="storeUser.currentUser" class="q-pa-xs">
      <q-card-section class="credit-card q-pa-xs">
        <q-img
          class="credit-card-aspect-ratio"
          :src="creditCardImage"
          width="360px"
          basic
        >
          <div class="text-overlay">
            <i class="fa-brands fa-hive" />
          </div>
          <div class="absolute-bottom text-subtitle2 text-left">
            <div class="row">
              <div class="col-8 flex items-center">
                <div>
                  <q-avatar rounded size="md">
                    <HiveAvatar :hiveAccname="storeUser.hiveAccname" />
                  </q-avatar>
                </div>
                <div class="q-pl-sm">
                  <div class="text-h7 embossed-text">
                    {{ storeUser.profileName }}
                  </div>
                  <div class="text-subtitle2">@{{ storeUser.hiveAccname }}</div>
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
                  <td class="numeric-cell q-pt-sm">
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
          </div>
        </q-img>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { computed, ref } from "vue"
const storeUser = useStoreUser()
import { useQuasar } from "quasar"

const q = useQuasar()

const creditCardImage = computed(() => {
  if (q.dark.isActive) {
    return "credit-card/credit-card-dolphins-dark.webp"
  }
  return "credit-card/credit-card-dolphins-light.webp"
})

storeUser.update()
</script>

<style lang="scss" scoped>
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

.text-overlay {
  position: absolute;
  top: 0;
  left: 0;
  color: white;
  font-size: 16px;
  padding: 10px;
}

.numeric-cell {
  text-align: right;
}
</style>
