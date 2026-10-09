<script setup lang="ts">
import type { Theme } from '~/services/api'
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import { tap } from '~/services/haptics'
import { currentLocale } from '~/services/i18n'
import { push } from '~/services/navigation'
import { useCatalogStore } from '~/store/catalog'
import { useGameStore } from '~/store/game'

const { t } = useI18n()
const catalog = useCatalogStore()
const game = useGameStore()

function start(theme: Theme) {
  tap()
  game.theme = theme.id
  game.reset()
  game.nextTeam()
  push('/game')
}
</script>

<template>
  <AppPage :title="t('themes')" :subtitle="t('themesSubtitle')">
    <div v-if="catalog.loading && !catalog.themes.length" class="grid grid-cols-2 gap-4" aria-busy="true">
      <div v-for="i in 6" :key="i" class="card min-h-48 animate-pulse opacity-60" />
    </div>

    <div v-else-if="catalog.error" class="card flex flex-col items-center gap-4 p-8 text-center">
      <p class="text-lg font-semibold">
        {{ t('loadError') }}
      </p>
      <button type="button" class="btn-primary" @click="catalog.load(currentLocale())">
        {{ t('retry') }}
      </button>
    </div>

    <ul v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <li v-for="(theme, index) in catalog.themes" :key="theme.id">
        <button
          type="button"
          class="card group flex min-h-48 w-full flex-col items-start justify-between p-4 text-left transition duration-150 active:scale-[0.97]"
          @click="start(theme)"
        >
          <span
            class="flex size-16 items-center justify-center rounded-2xl"
            :class="index % 3 === 0 ? 'bg-rose-500' : index % 3 === 1 ? 'bg-plum-900' : 'bg-pizazz-500'"
          >
            <img v-if="theme.icon" :src="theme.icon" alt="" class="size-10 brightness-0 invert" aria-hidden="true">
          </span>
          <span>
            <span class="block font-display text-xl font-extrabold leading-tight text-plum-900">{{ t(theme.name) }}</span>
            <span class="mt-0.5 block text-sm font-bold text-plum-500">{{ t('cardsCount', { n: catalog.guessesFor(theme.id).length }) }}</span>
          </span>
        </button>
      </li>
    </ul>
  </AppPage>
</template>
