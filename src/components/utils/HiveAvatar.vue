<template>
  <img
    ref="avatarImg"
    :src="avatarUrl"
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
import { computed } from "vue"
import { ref } from "vue"

const avatarImg = ref(null)

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

let tryAgain = 0

const avatarUrl = computed(() => {
  return useHiveAvatarURL({
    hiveAccname: props.hiveAccname,
    size: props.size,
    reason: "HiveAvatarComponent-" + tryAgain,
  })
})

function handleImageError(error) {
  // If the image fails to load, use the blank profile image
  console.error("Error loading Hive avatar", error)
  if (avatarImg.value) {
    avatarImg.value.src = useBlankProfileURL()
  }
  
}
</script>

<style lang="scss" scoped></style>
