/// <reference types="vitest/config" />

import { resolve } from 'node:path'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import pack from './package.json' with { type: 'json' }

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pack.version),
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('cap-'),
        },
      },
    }),
    tailwindcss(),
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [resolve(import.meta.dirname, 'locales/**')],
    }),
  ],
  server: {
    port: 3332,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})
