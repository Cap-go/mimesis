import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist/**',
      'android/**',
      'ios/**',
      'website/**',
      'fastlane/**',
      'public/**',
      'backend/.wrangler/**',
      'backend/.migration/**',
      'translate/.wrangler/**',
      'translate/.seed/**',
      'store/**',
      'CHANGELOG.md',
    ],
    vue: true,
    formatters: true,
  },
  {
    rules: {
      'vue/no-v-html': 'error',
      // cap-* web components use native named slots.
      'vue/no-deprecated-slot-attribute': 'off',
    },
  },
)
