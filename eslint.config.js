import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid/configs/typescript';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  solid,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'solid/reactivity': 'warn',
      'solid/no-destructure': 'warn',
      'solid/no-innerhtml': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'no-unassigned-vars': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-assignment': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.trae/', '.skillhub/'],
  },
);
