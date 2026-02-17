<template>
  <router-view />
</template>

<script>
import { defineComponent, onMounted } from "vue"
import { Dialog } from "quasar"

export default defineComponent({
  name: "App",
  setup() {
    // Toggle this to true/false to show/hide the message of the day
    const showMOTD = false

    onMounted(() => {
      if (showMOTD) {
        const dialog = Dialog.create({
          title: "Maintenance Notice",
          message:
            "v4v.app is now tentatively back online, you can try it if you're brave, announcement coming in a few hours. We will post updates on our Hive blog and X",
          persistent: true,
          ok: "Latest News",
          cancel: "OK",
        })

        dialog.onOk(() => {
          window.open(
            "https://peakd.com/hive-110369/@v4vapp/v4vapp-will-be-down-wednesday-11th-february-10am-utc",
            "_blank",
          )
        })

        dialog.onCancel(() => {
          // Just close
        })
      }
    })

    return {}
  },
})
</script>
