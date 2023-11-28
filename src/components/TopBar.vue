<template>
  <div>
    <q-toolbar class="top-bar">
      <q-toolbar-title>
        <q-img
          width="50px"
          class="q-mr-sm"
          src="/site-logo/v4vapp-logo-shadows.svg"
        >
          <q-tooltip>{{ appName }} - {{ appVersion }}</q-tooltip>
        </q-img>
      </q-toolbar-title>
      <div class="q-pa-none">
        <TabBar />
      </div>
      <q-space />
      <LanguageSelector />
      <DarkSelector />
      <LoggedInUser />
      <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
    </q-toolbar>
  </div>
</template>

<script setup>
import LanguageSelector from "components/utils/LanguageSelector.vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import TabBar from "components/TabBar.vue"
import LoggedInUser from "components/utils/LoggedInUser.vue"
const rightDrawerOpen = defineModel(false)

const { appName, appVersion } = useAppDetails()
console.log("appName", appName.value, "appVersion", appVersion.value)
const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<style lang="scss" scoped></style>
