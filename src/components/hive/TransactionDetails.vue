<template>
  <q-dialog :v-model="showDetails">
    <q-card>
      <q-toolbar>
        <!-- Title Bar -->
        <q-toolbar-title>Details</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="showDetails = false" />
      </q-toolbar>
      <q-card-section>
        <pre>
          {{ transaction }}
        </pre>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from "vue";

const showDetails = ref(true);

const props = defineProps({
  transaction: {
    type: object,
    required: true,
  },
});
</script>

<style lang="scss" scoped></style>
