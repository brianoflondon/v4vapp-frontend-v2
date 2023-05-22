<template>
  <span v-if="qImg">
    <q-img
      spinner-color="primary"
      spinner-size="82px"
      :alt="'Hive Avatar for ' + hiveAccname"
      :src="
        useHiveAvatarURL({ hiveAccname: props.hiveAccname, size: props.size })
      "
    >
      <template v-slot:error>
        <q-img
          spinner-color="primary"
          spinner-size="82px"
          :alt="'Hive Avatar for ' + hiveAccname"
          :src="useBlankProfileURL()"
        />
      </template>
    </q-img>
  </span>
  <span v-else>
    <img
      ref="avatarImg"
      :src="useHiveAvatarURL({ hiveAccname: hiveAccname, size: size })"
      :alt="'Hive Avatar for ' + hiveAccname"
      @error="handleImageError"
    />
  </span>
</template>

<script setup>
/**
 * HiveAvatar
 * A component for displaying Hive account avatars
 *
 * @props {string} hiveAccname - The Hive account name
 * @props {string} size - Default: small - small, medium, large size of the avatar
 * @props (boolean) qImg - Default: true - If true, uses a q-img component instead of a q-avatar component
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
  console.log("Image failed to load", error)
  avatarImg.value.src = useBlankProfileURL()
}
</script>

<style lang="scss" scoped></style>
