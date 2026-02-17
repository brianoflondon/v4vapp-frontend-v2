<template>
  <div
    class="progress-items q-pt-sm q-pb-md q-px-md"
    style="max-width: 350px"
    v-if="dInvoice?.progress && dInvoice?.progress.length > 0"
  >
    <q-list separator>
      <q-item-label header>{{ $t("Progress") }}</q-item-label>
      <q-separator />
      <q-item
        v-for="(item, index) in dInvoice.progress.slice().reverse()"
        :key="index"
        dense
        bordered
        padding
      >
        <q-item-section>
          <q-item-label>{{ item }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
const dInvoice = defineModel();
</script>

<style lang="scss" scoped></style>
