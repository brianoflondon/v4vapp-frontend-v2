<template>
  <div>
    <q-btn
      flat
      @click="$q.dark.toggle()"
      :title="$q.dark.isActive ? 'Change to light mode' : 'Change to dark mode'"
      :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
      size="sm"
    />
  </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
