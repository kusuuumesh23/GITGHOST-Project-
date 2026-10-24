module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    // Architecture rule: Restrict demo data imports across entire codebase
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/data/demo/**', '**/data/demo', '@/data/demo', '@/data/demo/**'],
            message: 'Demo data must only be imported within src/services/mock.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Allow demo data imports in services/mock
      files: ['src/services/mock/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Layering rule: No fetch or direct service access in pages and components
      files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.name='fetch']",
            message:
              'Direct fetch calls are prohibited in pages and components. Use hooks and services instead.',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/data/demo/**', '**/data/demo', '@/data/demo', '@/data/demo/**'],
                message: 'Demo data must only be imported within src/services/mock.',
              },
              {
                group: ['**/services/**', '**/services', '@/services', '@/services/**'],
                message:
                  'Pages and components must not call services directly. Use hooks instead.',
              },
            ],
          },
        ],
      },
    },
  ],
};
