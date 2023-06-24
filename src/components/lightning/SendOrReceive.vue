<template>
  <div class="send-receive-selector">
    <div class="q-gutter-y-md" style="max-width: 550px">
      <q-tabs dense>
        <q-route-tab name="send" to="/" label="Send" />
        <q-route-tab name="receive" to="/status" label="Receive" />
      </q-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
const tab = ref("send")
</script>

<style lang="scss" scoped></style>
