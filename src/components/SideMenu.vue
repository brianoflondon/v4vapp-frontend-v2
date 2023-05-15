<template>
  <div>
    <q-list>
      <q-item-label header> Side Menu </q-item-label>
      <EssentialLink v-for="link in linkList" :key="link.title" v-bind="link" />
    </q-list>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import EssentialLink from "components/EssentialLink.vue";
const t = useI18n().t;

const linkList = ref([
  {
    title: t("home"),
    caption: t("home"),
    icon: "home",
    link: "/",
  },
  {
    title: t("status"),
    caption: t("Status Page"),
    icon: "hive",
    link: "status",
  },
]);
</script>

<style lang="scss" scoped></style>
b
