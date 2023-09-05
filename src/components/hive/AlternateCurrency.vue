<template>
  <div class="alternate-currency full-width row wrap justify-around items-start content-start">
    <div class="text-center q-pa-xs"><i class="fa-brands fa-hive" style="color: green" />${{ amounts.hbd }} </div>
    <div class="text-center q-pa-xs"><i class="fa-brands fa-hive" />&thinsp;{{ amounts.hive }} </div>
    <div class="text-center q-pa-xs">{{ amounts.sats }}シ</div>
  </div>
</template>

<style lang="scss" scoped>
.alternate-currency {
  font-size: 0.8em;
  background: "$grey-5";
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { tidyNumber } from "src/use/useUtils"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
const storeAPIStatus = useStoreAPIStatus()

const props = defineProps({
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "HBD",
  },
})

const amounts = computed(() => {
  switch (props.currency) {
    case "HBD":
      return {
        sats: tidyNumber(props.amount * storeAPIStatus.HBDSatsNumber, 0),
        hive: tidyNumber(
          (props.amount * storeAPIStatus.HBDSatsNumber) /
            storeAPIStatus.hiveSatsNumber,
          3
        ),
        hbd: tidyNumber(props.amount, 3),
      }
    case "HIVE":
      return {
        sats: tidyNumber(props.amount * storeAPIStatus.hiveSatsNumber, 0),
        hive: tidyNumber(props.amount, 3),
        hbd: tidyNumber(
          (props.amount * storeAPIStatus.hiveSatsNumber) /
            storeAPIStatus.HBDSatsNumber,
          3
        ),
      }
    case "SATS":
      return {
        sats: tidyNumber(props.amount, 0),
        hive: tidyNumber(props.amount / storeAPIStatus.hiveSatsNumber, 3),
        hbd: tidyNumber(props.amount / storeAPIStatus.HBDSatsNumber, 3),
      }
  }
  return {
    sats: 0,
    hive: 0,
    hbd: 0,
  }
})
</script>
