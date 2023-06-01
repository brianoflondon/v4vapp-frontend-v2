<template>
  <img
    ref="avatarImg"
    :src="
      useHiveAvatarURL({
        hiveAccname: hiveAccname,
        size: size,
        reason: 'HiveAvatarComponent',
      })
    "
    :alt="'Hive Avatar for ' + hiveAccname"
    @error="handleImageError"
  />
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
import { ref } from "vue"

const avatarImg = ref(null)

const props = defineProps({
  hiveAccname: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "small",
  },
  qImg: {
    type: Boolean,
    default: true,
  },
})

function handleImageError(error) {
  // If the image fails to load, use the blank profile image
  avatarImg.value.src = useBlankProfileURL()
}
</script>

<style lang="scss" scoped></style>
