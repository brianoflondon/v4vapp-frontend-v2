<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated class="bg-primary text-white">
      <TopBar v-model="rightDrawerOpen" />
    </q-header>
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" elevated>
      <div>
        <SideMenu
          v-model="rightDrawerOpen"
          @close-menu="rightDrawerOpen = false"
        />
      </div>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
    <PriceBar />
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from "vue"
import PriceBar from "components/PriceBar.vue"
import SideMenu from "components/SideMenu.vue"
import { useQuasar } from "quasar" // Enables Dark mode detection
import TopBar from "components/TopBar.vue"
import { useStoreUser } from "src/stores/storeUser"

const q = useQuasar() // Enables Dark mode detection
q.dark.set("auto") // Enables Dark mode detection

const rightDrawerOpen = ref(false)

const isPWA =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone
const isIphone = /iPhone/.test(window.navigator.userAgent)

onMounted(() => {
  // Initialize the store this only happens here.
  useStoreUser().initialize()
  const isDev = window.location.href.includes("dev.v4v.app")
  const isLocalhost =
    window.location.href.includes("localhost") ||
    window.location.href.includes("127.0") ||
    window.location.href.includes("192.168") ||
    window.location.href.includes("10.0")
  if (isDev || isLocalhost) {
    console.debug("checking PWA and iPhone")
    console.debug("isPWA: ", isPWA)
    console.debug("isIphone: ", isIphone)
    if (isPWA && isIphone) {
      console.debug("iPhone PWA")
      // Add extra space to the bottom of the screen
    } else {
      console.debug("Not iPhone PWA")
      // Do nothing
    }
    q.notify({
      message: `isPWA: ${isPWA}, isIphone: ${isIphone}`,
      color: "primary",
      position: "top",
      timeout: 2000,
    })
  }
})
</script>
