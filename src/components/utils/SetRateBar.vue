<template>
  {{ exchangeRateMessage }}
</template>

<script setup>
import { computed } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { useI18n } from "vue-i18n"
import { tidyNumber } from "src/use/useUtils"

const storeUser = useStoreUser()
const t = useI18n().t

const exchangeRateMessage = computed(() => {
  // Return a label for use on the amount entry field indicating if the exchange rate is set and fixed in the settings dialog
  if (storeUser.pos.fixedRate) {
    return (
      t("set_rate") +
      ": $1USD = " +
      storeUser.localCurrency.unit.toUpperCase() +
      tidyNumber(storeUser.pos.fixedRate, 2)
    )
  }
  return t("market_rate")
})
</script>

<style lang="scss" scoped>

</style>
