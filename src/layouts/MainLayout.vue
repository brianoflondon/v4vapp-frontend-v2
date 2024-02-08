<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated class="bg-primary text-white">
      <TopBar v-model="rightDrawerOpen" />
    </q-header>
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" elevated>
      <div><SideMenu v-model="rightDrawerOpen" @close-menu="rightDrawerOpen = false"/></div>
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
import SideMenu from "components/SideMenu.vue"
import { useQuasar } from "quasar" // Enables Dark mode detection
import TopBar from "components/TopBar.vue"

const $q = useQuasar() // Enables Dark mode detection
$q.dark.set("auto") // Enables Dark mode detection

const rightDrawerOpen = ref(false)
</script>
