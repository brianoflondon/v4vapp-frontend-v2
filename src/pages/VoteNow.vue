<template>
  <q-page>
    <div class="vote-button q-pa-lg text-center">
      <VoteProposal v-model="voteOptions" />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import VoteProposal from "components/utils/VoteProposal.vue";

const voteOptions = ref({
  hiveUser: "",
  showButton: false,
  showDialog: true,
});
</script>

<style lang="scss" scoped></style>
