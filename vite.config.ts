/// <reference types="vitest" />

import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import EnvironmentPlugin from 'vite-plugin-environment'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import pack from './package.json'
import { getRightKey } from './scripts/utils.mjs'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
    // Workaround to fix inline dependency of a dependency, which is the case in @ionic/react
    mainFields: ['module'],
  },
  plugins: [
    vue(),
    WindiCSS(),
    EnvironmentPlugin(
      {
        VITE_APP_VERSION: pack.version,
        domain: 'mimesis.fun',
        crisp: '1011b75e-c4f6-400c-a6ff-c5077adb9db3',
        VITE_SUPABASE_ANON_KEY: getRightKey('supa_anon'),
        VITE_SUPABASE_URL: getRightKey('supa_url'),
      },
      { defineOn: 'import.meta.env' },
    ),
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    deps: {
      inline: ['@vue', 'plausible', 'plausible-tracker'],
    },
  },
})
