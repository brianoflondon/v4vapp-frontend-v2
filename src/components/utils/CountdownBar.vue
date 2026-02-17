<template>
  <div v-if="expiryLocal">
    <q-linear-progress
      class="invoice-timer"
      name="invoice-timer"
      size="20px"
      :value="fraction"
      color="green-9"
      :style="{ width: `${width}px` }"
    >
      <div class="absolute-full flex flex-center text-caption">
        <q-badge color="white" text-color="accent" :label="expiresIn()" />
      </div>
    </q-linear-progress>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { formatTimeAgo } from "@vueuse/core";
import { formatTime } from "src/use//useUtils.js";
const fraction = ref(1);
const timeLeft = ref(0);
const expiryLocal = ref(0);
const startTime = ref(null);
const timer = ref(null);

function expiresHuman() {
  return formatTimeAgo(expiryLocal.value * 1000);
}

function expiresIn() {
  return formatTime(timeLeft.value);
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
});

const emit = defineEmits(["message", "timeLeft"]);

onMounted(() => {
  startTime.value = Math.floor(Date.now() / 1000);
  expiryLocal.value = props.expiry;
  if (props.expiry > startTime.value) {
    startTimer();
  }
});

function calcFraction() {
  if (expiryLocal.value === 0) {
    fraction.value = 1;
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const timeLengthInvoice = expiryLocal.value - startTime.value;
  timeLeft.value = expiryLocal.value - now;
  const timeFraction = timeLeft.value / timeLengthInvoice;
  fraction.value = timeFraction;
  emit("message", expiresHuman());
  emit("timeLeft", timeLeft.value);
}

watch(
  () => props.expiry,
  (newValue, oldValue) => {
    expiryLocal.value = newValue;
    startTime.value = Math.floor(Date.now() / 1000);
    startTimer();
  },
);

function startTimer() {
  if (expiryLocal.value > startTime.value) {
    calcFraction();
    timer.value = setInterval(() => {
      if (fraction.value > 0) {
        calcFraction();
      } else {
        clearInterval(timer.value);
        expiryLocal.value = 0;
        startTime.value = 0;
        emit("timeLeft", -1);
        emit("message", "Expired");
      }
    }, 1000);
  }
}

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>

<style lang="scss" scoped></style>
