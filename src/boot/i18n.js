import { defineBoot } from "#q-app";
import { createI18n } from "vue-i18n";
import messages from "src/i18n";

// Create i18n instance
export const i18n = createI18n({
  locale: "en-US",
  globalInjection: true,
  messages,
});

export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});
