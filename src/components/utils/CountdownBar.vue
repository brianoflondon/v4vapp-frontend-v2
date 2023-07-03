<template>
  <div>
    <q-linear-progress
      class="invoice-timer"
      size="10px"
      :value="percentage"
      color="positive"
      :style="{ width: `${width}px` }"
    >
    </q-linear-progress>
    Expires: {{ expiresHuman }} ({{ expiresIn }})
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { formatTimeAgo } from "@vueuse/core"

const expiresHuman = computed(() => {
  return formatTimeAgo(props.expiry * 1000)
})

const expiresIn = computed(() => {
  return formatTime( props.expiry - Math.floor(Date.now() / 1000))
})

const percentage = ref(0.33)
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

onMounted(() => {
  if (props.expiry > 0) {
    percentage.value = 1
  }
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
