<template>
  <!-- default-opened -->
  <q-expansion-item icon="question_answer" :label="titleHere" dense>
    <q-card-section
      class="multiline-container text-left q-pa-xs"
      style="white-space: pre-line"
    >
      <div class="multiline-text">
        {{ textHere }}
      </div>
    </q-card-section>
  </q-expansion-item>
</template>

<script setup>
// add props for the title and text
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
const t = useI18n().t;

const titleHere = ref("");
const textHere = ref("");

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  text: {
    type: String,
    default: "",
  },
});

onMounted(() => {
  if (props.title === "") {
    titleHere.value = t("explanation_title");
  } else {
    titleHere.value = props.title;
  }
  if (props.text === "") {
    textHere.value = t("explanation_text");
  } else {
    textHere.value = props.text;
  }
});
</script>

<style lang="scss" scoped>
.multiline-container {
  margin-bottom: 1em; /* Adjust the margin-bottom value to set the paragraph spacing */
}

.multiline-text {
  margin: 0; /* Reset the default margins of paragraphs */
}
</style>
