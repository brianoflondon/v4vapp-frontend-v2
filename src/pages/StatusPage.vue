<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div class="q-pa-md row items-start q-gutter-md">
        <q-card class="my-card" flat bordered>
          <a
            href="https://peakd.com/hive-110369/@v4vapp/hive-to-lightning-gateway-fees"
            target="_blank"
          >
            <q-img src="site-logo/v4vapp-logo-shadows.svg" :ratio="16 / 11" />
          </a>
          <q-card-section>
            <div class="text-overline text-orange-9">V4V.app</div>
            <div class="text-h5 q-mt-sm q-mb-xs">{{ $t("status") }}</div>
            <a
              href="https://peakd.com/hive-110369/@v4vapp/hive-to-lightning-gateway-fees"
              target="_blank"
            >
              <div class="text-caption text-grey">
                {{ $t("status_page_message") }}
              </div>
            </a>
          </q-card-section>
          <q-card-section>
            <div class="vote-button q-pa-lg text-center">
              <VoteProposal v-model="voteOptions" />
            </div>
          </q-card-section>
      </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import VoteProposal from "components/utils/VoteProposal.vue"
const { t } = useI18n()

const voteOptions = ref({
  hiveUser: "",
  showButton: true,
  showDialog: false,
})
</script>

<style lang="sass" scoped></style>
