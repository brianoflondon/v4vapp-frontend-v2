<template>
  <div
    class="fit row wrap q-pa-sm q-pt-md justify-start items-start content-start q-gutter-md"
  >
    <div>
      <q-avatar rounded size="lg">
        <HiveAvatar :hiveAccname="storeUser.pos.hiveAccTo.value" />
      </q-avatar>
    </div>
    <div class="text-h6">
      {{ displayName }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStoreUser } from "src/stores/storeUser";
import HiveAvatar from "components/utils/HiveAvatar.vue";
import { onMounted } from "vue";
import { useHiveProfile } from "src/use/useHive";

const storeUser = useStoreUser();
const hiveProfileMetadata = ref({ profile: { name: "" } });

const displayName = computed(() => {
  return hiveProfileMetadata.value?.profile?.name
    ? hiveProfileMetadata.value.profile.name
    : storeUser.pos.hiveAccTo.value;
});

onMounted(async () => {
  hiveProfileMetadata.value.profile.name = storeUser.pos.hiveAccTo.value;
  const hiveProfile = await useHiveProfile(storeUser.pos.hiveAccTo.value);
  hiveProfileMetadata.value = hiveProfile?.metadata;
});
</script>

<style lang="scss" scoped></style>
