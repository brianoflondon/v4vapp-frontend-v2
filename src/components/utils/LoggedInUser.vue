<template>
  <div v-if="storeUser.currentUser" class="q-pa-sm">
    <q-avatar round size="sm">
      <img :src="avatar" />
    </q-avatar>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useHiveAvatarURL } from "src/use/useHive";
const storeUser = useStoreUser()
const avatar = ref(null)
console.log(storeUser.currentUser)
avatar.value = useHiveAvatarURL({ hiveAccname: storeUser.currentUser, size: "small" })

watch(() => storeUser.currentUser, (newVal) => {
  avatar.value = useHiveAvatarURL({ hiveAccname: storeUser.currentUser, size: "small" })
})
</script>

<style lang="scss" scoped></style>
