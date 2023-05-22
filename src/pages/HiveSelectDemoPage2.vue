<template>
  <q-page>
    <div class="q-pa-md row items-start q-gutter-md">
      <q-card class="sidebyside-card hive-selector">
        <input
          type="text"
          v-model="hiveAccname"
          placeholder="Hive Account Name"
          class="q-pa-sm"
        />
        <q-card-section class="q-pa-sm"><p>HiveSelectAcc</p></q-card-section>
        <q-card-section class="text-center q-pa-sm">
          <HiveSelectAcc2 dense v-model="hiveAccname" />
        </q-card-section>
        <q-card-section>
          <div class="image-container">
            <a href="https://peakd.com/created/v4vapp-v2">
              <div v-if="hiveAccname">
                <HiveAvatar :hiveAccname="hiveAccname" size="large" />
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
      <q-card class="sidebyside-card">
        <div class="image-container">
          <q-card-section>
            <q-avatar rounded size="md">
              <HiveAvatar
                :hiveAccname="hiveAccname"
                size="small"
                :qImg="false"
              />
            </q-avatar>
          </q-card-section>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import HiveSelectAcc2 from "components/HiveSelectAcc2.vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { ref } from "vue"

const hiveAccname = ref("")
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
