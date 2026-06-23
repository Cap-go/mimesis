import process from 'node:process'
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist/**',
      'ios/App/App/capacitor.config.json',
      'fastlane/**',
      'android/**/build/**',
      'android/.gradle/**',
      'android/app/src/main/assets/**',
      'ios/App/App/public/**',
      'scripts/**',
      'seed_db/**',
      'vitest.setup.ts',
      'public/**',
      'supabase/functions/_script/**',
      '**/supabase.types*',
      'supabase/functions/_backend/scripts/**',
      'CHANGELOG.md',
    ],
    vue: true,
    formatters: true,
  },
  {
    rules: {
      'vue/no-v-html': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
)
