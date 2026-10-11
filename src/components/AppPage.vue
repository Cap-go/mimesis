<script setup lang="ts">
import { setupPage } from '@capgo/capacitor-transitions/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { back, setTitleCollapsed } from '~/services/navigation'
import { isNative, platform } from '~/services/platform'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const emit = defineEmits<{ enter: [] }>()

const { t } = useI18n()
const route = useRoute()
const pageRef = ref<HTMLElement | null>(null)
const chrome = route.meta.chrome
// Native chrome draws the bars and titles; the browser build draws its own.
const webHeader = !isNative && chrome !== 'immersive'
const showTitle = props.title && !isNative
// iOS large titles shrink as the page scrolls; keep the content offset at the large size so the
// collapse never makes it jump.
const top = chrome === 'immersive'
  ? 'var(--safe-top)'
  : chrome === 'tab' && platform === 'ios' ? 'calc(var(--inset-top) + 96px + 0.5rem)' : 'calc(var(--safe-top) + 0.5rem)'
const scrolled = ref(false)
let cleanup: (() => void) | undefined

// Cached pages stay in the DOM and can still fire scroll events; only the visible one drives the bar.
let active = true

function syncScroll(y: number) {
  if (!active)
    return
  scrolled.value = y > 4
  if (chrome === 'tab')
    setTitleCollapsed(y > 36)
}

function onScroll(event: Event) {
  syncScroll((event.target as HTMLElement).scrollTop)
}

onMounted(() => {
  if (pageRef.value) {
    cleanup = setupPage(pageRef.value, {
      onWillEnter: () => {
        active = true
      },
      onWillLeave: () => {
        active = false
      },
      onDidEnter: () => {
        // Cached pages come back with their scroll position: match the title to it.
        syncScroll(pageRef.value?.querySelector('cap-content')?.scrollTop ?? 0)
        emit('enter')
      },
    })
  }
})
onUnmounted(() => cleanup?.())
</script>

<template>
  <cap-page ref="pageRef">
    <cap-content slot="content" fullscreen @scroll.passive="onScroll">
      <div
        class="relative mx-auto flex w-full max-w-2xl flex-col"
        :class="chrome === 'immersive' ? 'h-full' : 'min-h-full pb-8'"
        :style="{
          paddingTop: top,
          paddingLeft: 'calc(var(--inset-left) + 1.25rem)',
          paddingRight: 'calc(var(--inset-right) + 1.25rem)',
          paddingBottom: chrome === 'tab' && !isNative ? 'calc(var(--inset-bottom) + 6rem)' : chrome === 'immersive' ? 'var(--safe-bottom)' : 'calc(var(--safe-bottom) + 1rem)',
        }"
      >
        <div v-if="webHeader && chrome === 'push'" class="-ml-3 pt-1">
          <button type="button" class="btn-ghost text-base text-plum-900" @click="back()">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            {{ t('back') }}
          </button>
        </div>
        <header v-if="showTitle || subtitle" class="pb-5" :class="showTitle ? 'pt-3' : 'pt-1'">
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
    <!-- Scroll edge: content fading under the native bar, like system apps. -->
    <div
      v-if="isNative && chrome !== 'immersive'"
      class="scroll-edge pointer-events-none absolute inset-x-0 top-0 z-10 transition-opacity duration-200"
      :class="scrolled ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />
    <slot name="overlay" />
  </cap-page>
</template>
