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
            "v4v.app will be down for a big upgrade starting on Wednesday 11th February at 10am UTC. I hope to have it back up and running within a few hours but this may take up to two days.",
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
