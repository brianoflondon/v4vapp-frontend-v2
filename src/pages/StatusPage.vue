<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
      <div class="q-pa-md row items-start q-gutter-md">
        <q-card class="my-card" flat bordered>
          <a
            href="https://peakd.com/hive-110369/@v4vapp/hive-to-lightning-gateway-fees"
            target="_blank"
          >
            <q-img src="/site-logo/v4vapp-logo-shadows.svg" :ratio="16 / 11" />
          </a>
          <q-card-section>
            <div class="text-overline text-orange-9">V4V.app</div>
            <div class="text-h5 q-mt-sm q-mb-xs">{{ $t("status") }}</div>
            <div class="text-body1">
              <a
                href="https://peakd.com/hive-110369/@v4vapp/hive-to-lightning-gateway-fees"
                target="_blank"
              >
                {{ $t("status_page_message") }}
              </a>
              <p class="text-right text-caption">
                {{ appName }} v{{ appVersion }}
              </p>
            </div>
          </q-card-section>
          <q-card-section>
            <q-markdown :content="contentStatus"> </q-markdown>
          </q-card-section>
          <q-card-section>
            <div class="vote-button q-pa-lg text-center">
              <VoteProposal v-model="voteOptions" />
            </div>
          </q-card-section>
        </q-card>
        <q-markdown
          content="hello world"
        ></q-markdown>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import VoteProposal from "components/utils/VoteProposal.vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import { useGetHiveFeesPost } from "src/use/useHive"
import { QMarkdown } from "@quasar/quasar-ui-qmarkdown"

const { appName, appVersion } = useAppDetails()
console.log("appName", appName, "appVersion", appVersion)

const contentStatus = ref("Loading....")

onMounted(async () => {
  try {
    contentStatus.value = await useGetHiveFeesPost()
    console.log("contentStatus", contentStatus.value)
  } catch (error) {
    contentStatus.value = "Error loading content"
    console.log("error", error)
  }
})

const voteOptions = ref({
  hiveUser: "",
  showButton: true,
  showDialog: false,
})
</script>

<style lang="scss" scoped>
.q-markdown h1 {
  font-size: 1.1rem;
}
</style>
