<template>
  <q-card>
    <q-list>
      <q-item-label class="text-left q-pa-sm">{{
        $t("login_as")
      }}</q-item-label>
      <q-item class="fill-item">
        <HiveSelectAcc
          dense
          :label="label"
          @updateValue="
            (value) => {
              hiveAccname = value
            }
          "
        />
      </q-item>
      <q-item
        dense
        v-if="
          hiveAccname !== '' && hiveAccname !== null && !$q.platform.is.electron
        "
      >
        <q-btn
          flat
          label="Hive-Keychain"
          icon="img:keychain/hive-keychain-round.svg"
          @click="checkLoginKeychain(username)"
        />
      </q-item>
    </q-list>
  </q-card>

  <div></div>
</template>

<script setup>
import { ref } from "vue"
import HiveSelectAcc from "components/HiveSelectAcc.vue"

const hiveAccname = ref("")
const label = ref("Hive Account")
</script>

<style lang="scss" scoped>
.fill-item {
  flex: 1;
}
</style>
