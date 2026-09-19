import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    // .claude holds agent worktrees, which carry their own dist/ output;
    // docs holds reference code that is not part of the app
    ignores: ['dist/**', 'node_modules/**', '.claude/**', 'docs/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        dataLayer: 'writable',
        gtag: 'writable',
      },
    },
    rules: {
      // shadcn-vue UI primitives and route page components are intentionally single-word.
      'vue/multi-word-component-names': 'off',
      // Allow intentional discards in destructuring (e.g. const { class: _, ...rest } = props).
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]
