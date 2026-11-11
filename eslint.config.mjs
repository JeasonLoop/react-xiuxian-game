import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'vite-env.d.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin, react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettier.rules,
      'react/react-in-jsx-scope': 'off',
      // react-hooks v7 的 recommended 预设启用了 React Compiler 诊断规则，
      // 以下 4 条规则的修复必须改动 hooks 依赖数组或 setState 行为，超出本次清理范围，
      // 因此仅关闭这几条，保留 rules-of-hooks / exhaustive-deps / use-memo 等原有规则
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // 允许以下划线开头的参数/变量/捕获异常不触发 no-unused-vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
