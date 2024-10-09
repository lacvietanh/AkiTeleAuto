/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  ignorePatterns: ['*.css'],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@electron-toolkit',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off',
    "no-unused-vars": ["error", {
      "vars": "all",
      "args": "after-used",
      "caughtErrors": "all",
      "ignoreRestSiblings": false,
      "reportUsedIgnorePattern": false
  }]
  }
}
