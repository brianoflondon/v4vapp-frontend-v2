<template>
  <q-page>
    <div class="q-pa-md row items-start q-gutter-md">
      <q-card class="sidebyside-card hive-fancy-selector">
        <q-card-section class="q-pa-sm">
          <p>HiveSelectFancyAcc</p>
        </q-card-section>
        <q-card-section class="text-center q-pa-sm">
          <HiveSelectFancyAcc
            filled
            dense
            @updateValue="
              (value) => {
                hiveAccname = value
              }
            "
            fancyOptions
          />
        </q-card-section>
        <q-card-section>
          <div class="image-container">
            <a href="https://peakd.com/created/v4vapp-v2">
              <div v-if="hiveAccname">
                <q-img
                  spinner-color="primary"
                  spinner-size="82px"
                  :alt="'Hive Avatar for ' + hiveAccname"
                  :src="hiveAvatar"
                >
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center">
                      <q-icon name="error" size="lg" color="red" />
                    </div>
                  </template>
                </q-img>
              </div>
              <div v-else>
                <q-img
                  alt="V4V.app v2 Quasar Stars"
                  src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
                />
              </div>
            </a>
          </div>
        </q-card-section>
      </q-card>
      <q-card class="sidebyside-card hive-selector">
        <q-card-section class="q-pa-sm"><p>HiveSelectAcc</p></q-card-section>
        <q-card-section class="text-center q-pa-sm">
          <HiveSelectAcc
            dense
            @updateValue="
              (value) => {
                hiveAccname = value
              }
            "
          />
        </q-card-section>
        <q-card-section>
          <div class="image-container">
            <a href="https://peakd.com/created/v4vapp-v2">
              <div v-if="hiveAccname">
                <q-img
                  spinner-color="primary"
                  spinner-size="82px"
                  :alt="'Hive Avatar for ' + hiveAccname"
                  :src="hiveAvatar"
                >
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center">
                      <q-icon name="error" size="lg" color="red" />
                    </div>
                  </template>
                </q-img>
              </div>
              <div v-else>
                <q-img
                  alt="V4V.app v2 Quasar Stars"
                  src="~assets/general-images/v4vapp-v2-quasar-stars.webp"
                />
              </div>
            </a>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import HiveSelectAcc from "components/HiveSelectAcc.vue"
import { useHiveAvatarURL } from "src/use/useHive"
import { ref, computed } from "vue"

const hiveAccname = ref("")
const hiveAvatar = computed(() => {
  return useHiveAvatarURL({ hiveAccname: hiveAccname.value, size: "large" })
})
</script>

<style lang="sass" scoped>
.sidebyside-card
  width: 45%
  height: auto
  max-width: 500px

.image-container img
  width: 95%
  height: auto
</style>
