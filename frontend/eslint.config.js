import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript support
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': ts,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    rules: {
      ...ts.configs['recommended'].rules,
      ...ts.configs['stylistic-type-checked'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // React support
  {
    ...reactRecommended,
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactRecommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },

  // React Hooks rules
  {
    plugins: {
      'react-hooks': hooks,
    },
    rules: hooks.configs.recommended.rules,
  },

  // Prettier compatibility (must be last)
  prettier,
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
          endOfLine: 'lf',
          arrowParens: 'always',
          bracketSameLine: false,
          jsxSingleQuote: false,
        },
      ],
    },
  },
];
