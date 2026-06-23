<script setup lang="ts">
import type { Mode } from '~/services/database'
import type { Database } from '~/types/database.types'
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
// import { purchase, restore } from '~/services/iap'
import PageLoader from '~/components/PageLoader.vue'
import { useGameStore } from '~/store/game'
import { useMainStore } from '~/store/main'

const { t } = useI18n()
const main = useMainStore()
const game = useGameStore()
const router = useRouter()
const loading = ref(false)

function isIos() {
  return isPlatform('ios')
}

function langName(theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)): string {
  return t(theme.name)
}

async function buy(theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)) {
  if (theme.status !== 'paid' || !theme.package)
    return
  try {
    loading.value = true
    // await purchase(theme.package)
    theme.status = 'purchased'
  }
  catch (e) {
    loading.value = false
    return console.error(e)
  }
}

async function saveTheme(theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)) {
  if (theme.status === 'paid' && theme.package)
    return buy(theme)

  game.theme = theme.id
  game.reset()
  main.nextGuess()
  game.nextTeam()
  router.push({ path: '/game' })
}
</script>

<template>
  <IonPage>
    <IonHeader mode="ios">
      <IonToolbar color="secondary">
        <template #start>
          <IonButtons v-if="isIos()">
            <IonButton aria-label="Go back" @click="router.go(-1)">
              <template #start>
                <ArrowLeftIcon class="w-10 md:w-15 text-rose-500" aria-hidden="true" />
              </template>
            </IonButton>
          </IonButtons>
        </template>
        <IonTitle />
        <!-- <IonButtons v-if="isIos()" slot="end">
          <IonButton
            class="px-3 py-1 mx-auto w-30 mt-1 text-sm border xs:mt-2 bg-lavender-500 border-rose-500 text-rose-500 rounded-xl first-letter:uppercase"
            @click="restore()"
          >
            {{ t('restore') }}
          </IonButton>
        </IonButtons> -->
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true" :scroll-y="true">
      <div class="flex min-h-screen flex-col justify-start bg-pizazz-500 px-4 py-6 xs:px-8 md:px-10">
        <h1
          class="mb-6 text-4xl font-bold leading-tight text-center xs:mb-10 xs:text-5xl text-rose-900 first-letter:uppercase"
        >
          {{ t('themes') }}
        </h1>
        <div
          v-if="main.offline && main.themes.length > 0"
          class="mb-6 px-4 py-3 text-center text-base font-medium bg-yellow-200 text-rose-500 border-2 border-rose-500 rounded-lg shadow-sm first-letter:uppercase md:mx-auto md:max-w-xl"
        >
          {{ t('noInternet') }}
        </div>
        <div
          v-if="main.offline && main.themes.length === 0"
          class="mb-6 px-4 py-3 text-center text-base font-medium bg-yellow-200 text-rose-500 border-2 border-rose-500 rounded-lg shadow-sm first-letter:uppercase md:mx-auto md:max-w-xl"
        >
          {{ t('noInternetFirst') }}
        </div>
        <div class="w-full max-w-xl mx-auto pb-6">
          <button
            v-for="theme in main.themes"
            :key="theme.id"
            type="button"
            class="flex min-h-20 items-center w-full my-2 text-left border-2 cursor-pointer transition-all duration-150 xs:my-3 md:my-4 border-rose-500 bg-lavender-500 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            :aria-label="`${t('themes')}: ${langName(theme)}`"
            @click="saveTheme(theme)"
          >
            <div
              class="relative flex-shrink-0 w-20 h-20 mr-4 xs:w-24 xs:h-24 xs:mr-5 bg-rose-500 rounded-l-xl"
            >
              <div
                v-if="theme.status === 'paid'"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black text-lavender-500 bg-opacity-50 rounded-l-xl"
              >
                <LockClosedIcon class="w-10 h-10 xs:w-12 xs:h-12 text-lavender-500" aria-hidden="true" />
              </div>
              <img
                alt=""
                aria-hidden="true"
                class="w-full h-full p-2 fill-current stroke-current text-pizazz-500 svg_icon"
                :src="theme.icon || ''"
              >
            </div>
            <p class="flex-1 pr-4 text-lg font-medium leading-snug xs:text-2xl text-rose-500">
              {{ langName(theme) }}
            </p>
          </button>
        </div>
      </div>
      <PageLoader :show="loading" />
    </IonContent>
  </IonPage>
</template>

<style scoped>
  ion-toolbar {
  --border-style: none;
}
</style>
