<script setup lang="ts">
import { setupPage } from '@capgo/capacitor-transitions/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { back } from '~/services/navigation'
import { isNative } from '~/services/platform'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const emit = defineEmits<{ enter: [] }>()

const { t } = useI18n()
const route = useRoute()
const pageRef = ref<HTMLElement | null>(null)
const chrome = route.meta.chrome
// Native chrome draws the bars; the browser build draws its own.
const webHeader = !isNative && chrome !== 'immersive'
const showTitle = props.title && (!isNative || chrome === 'tab')
let cleanup: (() => void) | undefined

onMounted(() => {
  if (pageRef.value)
    cleanup = setupPage(pageRef.value, { onDidEnter: () => emit('enter') })
})
onUnmounted(() => cleanup?.())
</script>

<template>
  <cap-page ref="pageRef">
    <cap-content slot="content" fullscreen>
      <div
        class="relative mx-auto flex min-h-full w-full max-w-2xl flex-col px-5"
        :class="chrome === 'immersive' ? '' : 'pb-8'"
        :style="{
          paddingTop: chrome === 'immersive' ? 'var(--safe-top)' : 'calc(var(--safe-top) + 0.5rem)',
          paddingBottom: chrome === 'tab' && !isNative ? 'calc(var(--inset-bottom) + 6rem)' : chrome === 'immersive' ? 'var(--safe-bottom)' : 'calc(var(--safe-bottom) + 1rem)',
        }"
      >
        <div v-if="webHeader && chrome === 'push'" class="-ml-3 pt-1">
          <button type="button" class="btn-ghost text-base text-plum-900" @click="back()">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            {{ t('back') }}
          </button>
        </div>
        <header v-if="showTitle || subtitle" class="pb-5 pt-3">
          <h1 v-if="showTitle" class="text-4xl font-extrabold leading-none tracking-tight text-plum-900 sm:text-5xl">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-2 text-lg font-semibold text-plum-700/80">
            {{ subtitle }}
          </p>
        </header>
        <slot />
      </div>
    </cap-content>
    <slot name="overlay" />
  </cap-page>
</template>
