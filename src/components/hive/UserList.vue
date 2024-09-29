<template>
  <div class="debug-only">UserList.vue</div>
  <div class="q-pa-md user-list">
    <q-list>
      <q-item
        clickable
        @click="doClick(user.hiveAccname)"
        v-for="user in storeUser.users"
        :key="user.hiveAccname"
        :active="storeUser.currentUser === user.hiveAccname"
        active-class="user-list-active"
      >
        <q-item-section avatar>
          <q-avatar>
            <HiveAvatar :hiveAccname="user.hiveAccname" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.profileName }}</q-item-label>
          <q-item-label v-if="user.loginType === 'hive'" caption
            >@{{ user.hiveAccname }}</q-item-label
          >
          <q-tooltip caption>
            {{ $t("Expires") }}
            <br />
            API:
            {{ storeUser.getUser(user.hiveAccname).loginHASExpireHuman }}
            <br />
            Login:
            {{ storeUser.getUser(user.hiveAccname).loginAgeHuman }}
            <br />
            API:
            {{ storeUser.getUser(user.hiveAccname).hasApiToken }}
            <br />
          </q-tooltip>
        </q-item-section>
        <q-item-section side v-if="storeUser.getUser(user.hiveAccname).isHAS">
          <q-icon name="img:/has/hive-auth-logo.svg" />
        </q-item-section>
        <q-item-section
          side
          v-if="
            storeUser.getUser(user.hiveAccname).isKeychain &&
            user.loginType === 'hive'
          "
        >
          <q-icon name="img:/keychain/hive-keychain-round.svg" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
const storeUser = useStoreUser()

const emit = defineEmits(["update", "click"])

function doClick(item) {
  storeUser.switchUser(item)
  navigator.clipboard.writeText(item).then(
    () => {
      console.log("Copied to clipboard")
    },
    (err) => {
      console.error("Failed to copy to clipboard", err)
    }
  )
  emit("update", item)
}
</script>

<style lang="scss" scoped></style>
