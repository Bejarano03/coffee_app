// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },

  {
    files: ['**/*, {js, jsx, ts, tsx}'],

    rules: {
      'react/no-unkown-property':'off',
      'react/no-unstable-nested-components': 'off',
    }
  }
]);
