<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/vue/outline'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useMainStore } from '~/store/main'
import { useGameStore } from '~/store/game'
// import { purchase, restore } from '~/services/iap'
import PageLoader from '~/components/PageLoader.vue'
import type { Mode } from '~/services/database'
import type { Database } from '~/types/database.types'

const { t } = useI18n()
const main = useMainStore()
const game = useGameStore()
const router = useRouter()
const loading = ref(false)

const isIos = () => {
  return isPlatform('ios')
}

const langName = (theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)): string => {
  return t(theme.name)
}

const buy = async (theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)) => {
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

const saveTheme = async (theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)) => {
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
        <IonButtons v-if="isIos()" slot="start">
          <IonButton @click="router.go(-1)">
            <ArrowLeftIcon slot="start" class="w-10 md:w-15 text-rose-500" />
          </IonButton>
        </IonButtons>
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
    <IonContent :fullscreen="true" :scroll-y="false">
      <div class="flex flex-col justify-start h-screen p-10 bg-pizazz-500">
        <h1
          class="mb-5 text-5xl font-bold text-center xs:mb-10 text-rose-500 first-letter:uppercase"
        >
          {{ t('themes') }}
        </h1>
        <h3
          v-if="main.offline && main.themes.length > 0"
          class="mx-5 mb-5 font-bold text-center text-1xl text-rose-500 first-letter:uppercase"
        >
          {{ t('noInternet') }}
        </h3>
        <h3
          v-if="main.offline && main.themes.length === 0"
          class="mx-5 mb-5 font-bold text-center text-1xl text-rose-500 first-letter:uppercase"
        >
          {{ t('noInternetFirst') }}
        </h3>
        <div class="overflow-x-scroll no_bar md:w-1/2 md:mx-auto">
          <div
            v-for="theme in main.themes"
            :key="theme.id"
            class="flex items-center my-1 border cursor-pointer xs:my-3 md:my-5 border-rose-500 bg-lavender-500 rounded-xl"
            @click="saveTheme(theme)"
          >
            <div
              class="relative w-20 h-20 mr-3 xs:w-24 xs:h-24 bg-rose-500 rounded-l-xl"
            >
              <div
                v-if="theme.status === 'paid'"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black text-lavender-500 bg-opacity-40 rounded-l-xl"
              >
                <LockClosedIcon class="w-2/3 text-lavender-500" />
              </div>
              <img
                alt="test"
                class="w-full h-full mt-2 fill-current stroke-current text-pizazz-500 svg_icon"
                :src="theme.icon || ''"
              >
            </div>
            <p class="xs:text-2xl text-rose-500">
              {{ langName(theme) }}
            </p>
          </div>
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
