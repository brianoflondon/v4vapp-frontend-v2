<template>
  <div v-if="storeUser.currentUser" class="q-pa-sm">
    <div v-if="storeUser.loginType === 'hive'">
      <q-avatar round size="sm">
        <img :src="avatar" />
        <q-tooltip>
          {{ storeUser.profileName }}<br />
          @{{ storeUser.currentUser }}
        </q-tooltip>
      </q-avatar>
    </div>
    <div v-if="storeUser.loginType === 'evm'">
      <q-avatar round size="lg">
        <i class="fa-brands fa-ethereum"></i>
        <q-tooltip>
          {{ storeUser.profileName }}<br />
          @{{ storeUser.currentUser }}
        </q-tooltip>
      </q-avatar>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useHiveAvatarURL } from "src/use/useHive"
const storeUser = useStoreUser()
const avatar = ref(null)
avatar.value = useHiveAvatarURL({
  hiveAccname: storeUser.currentUser,
  size: "small",
})

watch(
  () => storeUser.currentUser,
  (newVal) => {
    avatar.value = useHiveAvatarURL({
      hiveAccname: storeUser.currentUser,
      size: "small",
    })
  }
)
</script>

<style lang="scss" scoped></style>
