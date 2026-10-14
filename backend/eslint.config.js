import js from '@eslint/js';
import nPlugin from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      n: nPlugin,
      import: importPlugin,
      promise: promisePlugin,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'promise/no-nesting': 'off',
      'n/no-missing-import': 'off', // handled by module resolution at runtime; noisy with ESM extensions
      'n/no-unpublished-import': 'off',
      'import/no-unresolved': 'off', // same reason
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  prettierConfig,
];
