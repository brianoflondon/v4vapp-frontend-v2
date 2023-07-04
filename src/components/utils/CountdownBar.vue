<template>
  <div v-if="expiryLocal">
    <q-linear-progress
      class="invoice-timer"
      size="10px"
      :value="fraction"
      color="positive"
      :style="{ width: `${width}px` }"
    >
    </q-linear-progress>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue"
import { formatTimeAgo } from "@vueuse/core"
const fraction = ref(1)
const timeLeft = ref(0)
const expiryLocal = ref(0)
const startTime = ref(null)

function expiresHuman() {
  return formatTimeAgo(expiryLocal.value * 1000)
}

function expiresIn() {
  return formatTime(timeLeft.value)
}

const props = defineProps({
  width: {
    type: Number,
    default: 300,
  },
  expiry: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(["message", "timeLeft"])

onMounted(() => {
  startTime.value = Math.floor(Date.now() / 1000)
  expiryLocal.value = props.expiry
  if (props.expiry > startTime.value) {
    startTimer()
  }
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
  emit("message", expiresHuman())
  emit("timeLeft", timeLeft.value)
}

let timer = null

watch(
  () => props.expiry,
  (newValue, oldValue) => {
    console.log("props.expiry changed", newValue, oldValue)
    expiryLocal.value = newValue
    console.log("expiryLocal.value", expiryLocal.value)
    startTime.value = Math.floor(Date.now() / 1000)
    startTimer()
  }
)

function startTimer() {
  console.log("exires in", expiresIn())
  if (expiryLocal.value > startTime.value) {
    calcFraction()
    timer = setInterval(() => {
      if (fraction.value > 0) {
        calcFraction()
      } else {
        clearInterval(timer)
        expiryLocal.value = 0
        startTime.value = 0
        emit("timeLeft", -1)
        emit("message", "Expired")
      }
    }, 1000)
  }
}

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
