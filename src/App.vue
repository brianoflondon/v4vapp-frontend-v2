<template>
  <router-view />
</template>

<script>
import { defineComponent, onMounted } from "vue";
import { Dialog } from "quasar";

export default defineComponent({
  name: "App",
  setup() {
    // Toggle this to true/false to show/hide the message of the day
    const showMOTD = true;

    onMounted(() => {
      if (showMOTD) {
        const dialog = Dialog.create({
          title: "Maintenance Notice",
          message:
            "v4v.app is still down but getting close to re-launch. PLEASE DO NOT USE THIS SITE UNTIL FURTHER NOTICE. We will post updates on our Hive blog and X",
          persistent: true,
          ok: "Latest News",
          cancel: "OK",
        });

        dialog.onOk(() => {
          window.open("https://peakd.com/hive-110369/@v4vapp/v4vapp-will-be-down-wednesday-11th-february-10am-utc", "_blank");
        });

        dialog.onCancel(() => {
          // Just close
        });
      }
    });

    return {};
  },
});
</script>
