<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { resetTo, tabs } from '~/services/navigation'

const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
    :style="{ paddingBottom: 'max(0.75rem, var(--inset-bottom))' }"
    :aria-label="t('navigation')"
  >
    <div class="flex w-full max-w-md items-stretch gap-1 rounded-full bg-cream/85 p-1.5 shadow-card ring-1 ring-plum-900/5 backdrop-blur-xl">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        class="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-bold transition"
        :class="route.meta.tab === item.id ? 'bg-rose-100 text-rose-600' : 'text-plum-500'"
        :aria-current="route.meta.tab === item.id ? 'page' : undefined"
        @click="route.path !== item.path && resetTo(item.path, 'none')"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- static icon markup from navigation.ts -->
        <span class="size-6" aria-hidden="true" v-html="item.svg" />
        {{ t(item.title) }}
      </button>
    </div>
  </nav>
</template>
