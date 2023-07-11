<template>
  <div>
    <q-btn
      flat
      @click="$q.dark.toggle()"
      :title="$q.dark.isActive ? $t('change_light') : $t('change_dark')"
      :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
      size="sm"
    />
  </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
