<template>
  <div>
    <q-linear-progress
      class="invoice-timer"
      size="10px"
      :value="fraction"
      color="positive"
      :style="{ width: `${width}px` }"
    >
    {{ message }}
    </q-linear-progress>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { formatTimeAgo } from "@vueuse/core"

const message = computed(() => {
  if (expiryLocal.value === 0) {
    return props.message
  }
  return `${props.message} - ${expiresHuman.value} (${expiresIn.value})`
})

const expiresHuman = computed(() => {
  return formatTimeAgo(expiryLocal.value * 1000)
})

const expiresIn = computed(() => {
  return formatTime(timeLeft.value)
})

const expiresInSecs = computed(() => {
  return timeLeft.value
})

const fraction = ref(1)
const timeLeft = ref(0)
const expiryLocal = ref(0)

// const fraction = ref(0)
const startTime = ref(null)
const props = defineProps({
  width: {
    type: Number,
    default: 300,
  },
  expiry: {
    type: Number,
    default: 0,
  },
  message: {
    type: String,
    default: "",
  },
})

onMounted(() => {
  startTime.value = Math.floor(Date.now() / 1000)
  console.log("countdown bar mounted")
  console.log("props.expiry", props.expiry)
  console.log("startTime", startTime.value)
})

function calcFraction() {
  if (expiryLocal.value === 0) {
    fraction.value = 1
    return
  }
  const now = Math.floor(Date.now() / 1000)
  const timeLengthInvoice = expiryLocal.value - startTime.value
  timeLeft.value = expiryLocal.value - now
  const timeFraction = timeLeft.value / timeLengthInvoice
  fraction.value = timeFraction
}

let timer = null

watch(
  () => props.expiry,
  (newValue, oldValue) => {
    expiryLocal.value = newValue
    if (expiryLocal.value > 0) {
      console.log("props.expiry changed", newValue, oldValue)
      startTime.value = Math.floor(Date.now() / 1000)
      calcFraction()
      console.log("fraction", fraction.value)
      timer = setInterval(() => {
        if (fraction.value > 0) {
          calcFraction()
        } else {
          clearInterval(timer)
          expiryLocal.value = 0
        }
      }, 1000)
    }
  }
)

onUnmounted(() => {
  clearInterval(timer)
})

function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}
</script>

<style lang="scss" scoped></style>
