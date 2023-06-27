<template>
  <div class="q-pa-md" style="max-width: 350px">
    <q-list>
      <q-item
        clickable
        @click="doClick(user.hiveAccname)"
        v-for="user in storeUser.users"
        :key="user.hiveAccname"
        :active="storeUser.currentUser === user.hiveAccname"
        active-class="bg-grey-7 text-white"
      >
        <q-item-section avatar>
          <q-avatar>
            <HiveAvatar :hiveAccname="user.hiveAccname" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.profileName }}</q-item-label>
          <q-item-label caption>@{{ user.hiveAccname }}</q-item-label>
          <q-item-label caption>{{ user.timeAgo }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { useStoreUser, HiveUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { store } from "quasar/wrappers"
const storeUser = useStoreUser()

function doClick(item) {
  storeUser.switchUser(item)
}
</script>

<style lang="scss" scoped></style>
