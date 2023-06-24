<template>
  <div>
    <q-toolbar class="top-bar">
      <q-toolbar-title>
        <q-img
          width="50px"
          class="q-mr-sm"
          src="site-logo/v4vapp-logo-shadows.svg"
        />
      </q-toolbar-title>
      <div class="q-pa-none">
        <SendOrReceive />
      </div>
      <!-- <div class="text-caption">{{ appName }} v{{ appVersion }}</div> -->
      <q-space />
      <LanguageSelector />
      <DarkSelector />
      <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
    </q-toolbar>
  </div>
</template>

<script setup>
import LanguageSelector from "components/utils/LanguageSelector.vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import SendOrReceive from "./lightning/SendOrReceive.vue";
const rightDrawerOpen = defineModel(false)

const { appName, appVersion } = useAppDetails()

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<style lang="scss" scoped></style>
