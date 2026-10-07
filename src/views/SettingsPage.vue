<script setup lang="ts">
import type { BuildInfo } from '~/services/updater'
import { InAppReview } from '@capacitor-community/in-app-review'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import { openChat } from '~/services/crisp'
import { tap } from '~/services/haptics'
import { availableLocales, setLocale } from '~/services/i18n'
import { refreshChrome } from '~/services/navigation'
import { isNative } from '~/services/platform'
import { getBuildInfo } from '~/services/updater'
import { ROUND_OPTIONS, SCORE_OPTIONS, useSettingsStore } from '~/store/settings'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const build = ref<BuildInfo | null>(null)

function languageName(code: string) {
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function changeLocale(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  settings.locale = value
  setLocale(value)
  refreshChrome()
}

function open(url: string) {
  window.open(url, '_blank', 'noopener')
}

function rate() {
  if (isNative)
    void InAppReview.requestReview()
  else
    open('https://mimesis.fun')
}

onMounted(async () => {
  build.value = await getBuildInfo()
})
</script>

<template>
  <AppPage :title="t('tabSettings')">
    <section class="mb-6">
      <h2 class="mb-2 px-2 text-sm font-extrabold uppercase tracking-widest text-plum-900/60">
        {{ t('settingsGame') }}
      </h2>
      <div class="card divide-y divide-plum-900/10">
        <div class="p-4">
          <p id="round-label" class="mb-3 font-bold text-plum-900">
            {{ t('roundLength') }}
          </p>
          <div class="grid grid-cols-4 gap-1 rounded-2xl bg-pizazz-50 p-1" role="radiogroup" aria-labelledby="round-label">
            <button
              v-for="value in ROUND_OPTIONS" :key="value"
              type="button" role="radio" :aria-checked="settings.roundSeconds === value"
              class="min-h-11 rounded-xl font-display font-bold transition"
              :class="settings.roundSeconds === value ? 'bg-rose-500 text-white shadow' : 'text-plum-700'"
              @click="tap(); settings.roundSeconds = value"
            >
              {{ t('seconds', { n: value }) }}
            </button>
          </div>
        </div>
        <div class="p-4">
          <p id="score-label" class="mb-3 font-bold text-plum-900">
            {{ t('targetScore') }}
          </p>
          <div class="grid grid-cols-4 gap-1 rounded-2xl bg-pizazz-50 p-1" role="radiogroup" aria-labelledby="score-label">
            <button
              v-for="value in SCORE_OPTIONS" :key="value"
              type="button" role="radio" :aria-checked="settings.targetScore === value"
              class="min-h-11 rounded-xl font-display font-bold transition"
              :class="settings.targetScore === value ? 'bg-rose-500 text-white shadow' : 'text-plum-700'"
              @click="tap(); settings.targetScore = value"
            >
              {{ value }}
            </button>
          </div>
        </div>
        <label class="flex min-h-14 items-center justify-between gap-4 p-4">
          <span class="font-bold text-plum-900">{{ t('sounds') }}</span>
          <input v-model="settings.sound" type="checkbox" class="peer sr-only" @change="tap()">
          <span class="relative h-8 w-14 shrink-0 rounded-full bg-plum-900/20 transition peer-checked:bg-rose-500 peer-focus-visible:ring-4 peer-focus-visible:ring-rose-300 after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" aria-hidden="true" />
        </label>
        <label class="flex min-h-14 items-center justify-between gap-4 p-4">
          <span class="font-bold text-plum-900">{{ t('language') }}</span>
          <select :value="locale" class="min-h-11 rounded-xl bg-pizazz-50 px-3 font-bold text-plum-900 outline-none focus:ring-2 focus:ring-rose-400" @change="changeLocale">
            <option v-for="code in availableLocales" :key="code" :value="code">
              {{ languageName(code) }}
            </option>
          </select>
        </label>
      </div>
      <p v-if="locale !== 'fr'" class="mt-2 px-2 text-sm font-semibold text-plum-900/70">
        {{ t('contentLanguageNote') }}
      </p>
    </section>

    <section class="mb-6">
      <h2 class="mb-2 px-2 text-sm font-extrabold uppercase tracking-widest text-plum-900/60">
        {{ t('support') }}
      </h2>
      <div class="card divide-y divide-plum-900/10">
        <button type="button" class="flex min-h-14 w-full items-center justify-between p-4 text-left font-bold text-plum-900 active:bg-plum-900/5" @click="rate()">
          {{ t('rate') }}<span aria-hidden="true" class="text-plum-500">›</span>
        </button>
        <button type="button" class="flex min-h-14 w-full items-center justify-between p-4 text-left font-bold text-plum-900 active:bg-plum-900/5" @click="openChat()">
          {{ t('chat') }}<span aria-hidden="true" class="text-plum-500">›</span>
        </button>
        <button type="button" class="flex min-h-14 w-full items-center justify-between p-4 text-left font-bold text-plum-900 active:bg-plum-900/5" @click="open('https://github.com/Cap-go/mimesis')">
          {{ t('openSource') }}<span aria-hidden="true" class="text-plum-500">›</span>
        </button>
      </div>
    </section>

    <footer class="mt-auto flex flex-col items-center gap-1 pt-4 text-center text-sm font-semibold text-plum-900/70">
      <img src="/assets/icon/icon.png" alt="" class="mb-2 size-14 rounded-2xl shadow-card" aria-hidden="true">
      <p>
        {{ t('version', { v: build?.native ?? '' }) }}<template v-if="build && build.bundle !== build.native">
          · {{ build.bundle }}
        </template>
      </p>
      <button type="button" class="underline decoration-dotted underline-offset-4" @click="open('https://capgo.app/?ref=mimesis')">
        {{ t('liveUpdates') }}
      </button>
      <p>{{ t('madeBy') }}</p>
    </footer>
  </AppPage>
</template>
