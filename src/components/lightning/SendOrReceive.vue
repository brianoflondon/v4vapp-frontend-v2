<template>
  <div class="send-receive-selector">
    <div class="q-gutter-y-md">
      <q-btn-toggle
        v-model="model"
        spread
        no-caps
        toggle-color="primary"
        :options="[
          { label: 'Send', value: 'send' },
          { label: 'Receive', value: 'receive' },
        ]"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
const model = ref("send")
</script>

<style lang="scss" scoped></style>
