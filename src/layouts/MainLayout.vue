<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title> V4V.app v2 Dev </q-toolbar-title>
        <div class="text-caption">{{ appName }} v{{ appVersion }}</div>
        <q-space />
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

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title> Prices </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from "vue"
import LanguageSelector from "components/utils/LanguageSelector.vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import SideMenu from "components/SideMenu.vue"
import { getAppDetails } from "components/utils/getAppDetails.js"
const { appName, appVersion } = getAppDetails()

const rightDrawerOpen = ref(false)

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>
