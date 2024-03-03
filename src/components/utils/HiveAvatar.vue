<template>
  <q-img
    :src="avatarUrl"
    :alt="'Hive Avatar for ' + hiveAccname"
    spinner-size="16px"
  >
    <template v-slot:error>
      <img
        :src="useBlankProfileURL()"
        :alt="'Hive Avatar for ' + hiveAccname"
      />
    </template>
  </q-img>
</template>

<script setup>
/**
 * HiveAvatar
 * A component for displaying Hive account avatars
 *
 * @props {string} hiveAccname - The Hive account name
 * @props {string} size - Default: small - small, medium, large size of the avatar
 */
import { useBlankProfileURL, useHiveAvatarURL } from "src/use/useHive"
import { computed } from "vue"

const props = defineProps({
  hiveAccname: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "small",
  },
})

const avatarUrl = computed(() => {
  return useHiveAvatarURL({
    hiveAccname: props.hiveAccname,
    size: props.size,
    reason: "HiveAvatarComponent-",
  })
})
</script>

<style lang="scss" scoped></style>
