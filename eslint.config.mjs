// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
  rules: {
    "no-console": "error",
    "vue/html-self-closing": "off",
    "no-unused-vars": "warn",
  },
});
