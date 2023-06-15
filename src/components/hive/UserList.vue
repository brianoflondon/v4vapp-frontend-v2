<template>
  <div class="q-pa-md" style="max-width: 350px">
    <q-list>
      <q-item
        clickable
        @click="doClick(user.hiveAccname)"
        v-for="user in storeUser.users"
        :key="user.hiveAccname"
      >
        <q-item-section avatar>
          <q-avatar>
            <HiveAvatar :hiveAccname="user.hiveAccname" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.profileName }}</q-item-label>
          <q-item-label caption>@{{ user.hiveAccname }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
const storeUser = useStoreUser()

function doClick(item) {
  storeUser.switchUser(item)
}
</script>

<style lang="scss" scoped></style>
