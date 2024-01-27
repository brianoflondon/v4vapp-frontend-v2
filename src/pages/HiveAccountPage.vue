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
  routePage.value = safeStringify(route)
  hiveAccount.value = useUsernameFromRouteParam(route.params.hiveAccTo)
})

function safeStringify(obj) {
  const cache = new Set()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Duplicate reference found, discard key
        return
      }
      // Store value in our set
      cache.add(value)
    }
    return value
  })
}
</script>

<style lang="scss" scoped></style>
