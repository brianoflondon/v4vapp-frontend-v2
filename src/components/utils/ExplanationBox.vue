<template>
  <!-- default-opened -->
  <q-expansion-item
    icon="question_answer"
    :label="$t('explanation_title')"
  >
    <q-card-section
      class="multiline-container text-left q-pa-xs"
      style="white-space: pre-line"
    >
      <div class="multiline-text">
        {{ $t("explanation_text") }}
      </div>
    </q-card-section>
  </q-expansion-item>
</template>

<script setup></script>

<style lang="scss" scoped>
.multiline-container {
  margin-bottom: 1em; /* Adjust the margin-bottom value to set the paragraph spacing */
}

.multiline-text {
  margin: 0; /* Reset the default margins of paragraphs */
}
</style>
