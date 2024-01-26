<template>
  <q-page>
    <CreditCard />
    <pre>
      {{ routePage }}
    </pre>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { useUsernameFromRouteParam } from "src/use/useUtils.js"
import CreditCard from "components/hive/CreditCard.vue"

const route = useRoute()
const routePage = ref("")

const hiveAccount = ref()

onMounted(() => {
  console.log("GetHive.vue onMounted")
  console.log("route", route)
  routePage.value = route
  hiveAccount.value = useUsernameFromRouteParam(route.params.hiveAccTo)
})
</script>

<style lang="scss" scoped></style>
