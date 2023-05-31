<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title> V4V.app v2 Dev </q-toolbar-title>
        <div class="text-caption">{{ appName }} v{{ appVersion }}</div>
        <q-space />
        <KeychainStatus />
        <LanguageSelector />
        <DarkSelector />
        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" elevated>
      <div><SideMenu /></div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
    <PriceBar />
  </q-layout>
</template>

<script setup>
import { ref } from "vue"
import PriceBar from "components/PriceBar.vue"
import LanguageSelector from "components/utils/LanguageSelector.vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import SideMenu from "components/SideMenu.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import KeychainStatus from "components/utils/KeychainStatus.vue"
import { useQuasar } from "quasar" // Enables Dark mode detection

const $q = useQuasar() // Enables Dark mode detection
$q.dark.set("auto") // Enables Dark mode detection

const { appName, appVersion } = useAppDetails()

const rightDrawerOpen = ref(false)

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>
