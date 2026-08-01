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

      <div class="q-pa-none row items-center no-wrap">
        <q-badge
          v-if="showGatewayClosedBanner"
          color="negative"
          text-color="white"
          class="q-mr-sm"
        >
          {{ $t("gateway_status_closed") }}
        </q-badge>
        <TabBar />
      </div>

      <q-space />
      <LanguageSelector />
      <DarkSelector />
      <LoggedInUser @click="toggleRightDrawer" />
      <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
    </q-toolbar>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue"
import LanguageSelector from "components/utils/LanguageSelector.vue"
import DarkSelector from "components/utils/DarkSelector.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import TabBar from "components/TabBar.vue"
import LoggedInUser from "components/utils/LoggedInUser.vue"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"

const rightDrawerOpen = defineModel({ default: false })
const { appName, appVersion } = useAppDetails()
const storeAPIStatus = useStoreAPIStatus()

let gatewayTimeoutId = null

const showGatewayClosedBanner = computed(() => {
  return storeAPIStatus.isGatewayAnyClosed
})

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

async function scheduleGatewayStatusUpdate() {
  await storeAPIStatus.updateGatewayStatus()
  gatewayTimeoutId = setTimeout(
    scheduleGatewayStatusUpdate,
    storeAPIStatus.refreshIntervalMs,
  )
}

onMounted(async () => {
  await scheduleGatewayStatusUpdate()
})

onUnmounted(() => {
  clearTimeout(gatewayTimeoutId)
})
</script>

<style lang="scss" scoped></style>
