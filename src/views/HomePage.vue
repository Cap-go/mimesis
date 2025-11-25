<script setup lang="ts">
import {
  ChatBubbleLeftIcon as ChatIcon,
  ClipboardDocumentListIcon as ClipboardListIcon,
  EllipsisVerticalIcon as DotsVerticalIcon,
  ExclamationCircleIcon as ExclamationIcon,
  FlagIcon,
  InformationCircleIcon,
  PlayIcon,
  PlusCircleIcon,
  PlusIcon,
  LanguageIcon as TranslateIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import {
  actionSheetController,
  IonContent,
  IonInput,
  IonPage,
  isPlatform,
} from '@ionic/vue'
import { RateApp } from 'capacitor-rate-app'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Modal from '~/components/ModalComponent.vue'
import { openChat } from '~/services/crips'
import { randomPlayer, randomTeam, useGameStore } from '~/store/game'
import { useMainStore } from '~/store/main'

const modals = reactive({
  inequal: false,
  lang: false,
  rules: false,
})
const router = useRouter()
const game = useGameStore()
const main = useMainStore()
const { t, locale } = useI18n()

function setLang(l: string) {
  main.lang = l
  locale.value = l
}
const lenghtLangs = computed(() => Object.keys(main.langs).length)
function saveTeam() {
  if (game.mode === 1)
    modals.inequal = true
  else
    router.push('/theme')
}
async function presentActionSheet() {
  const actionSheet = await actionSheetController.create({
    header: `${t('more')} V${import.meta.env.VITE_APP_VERSION}`,
    buttons: [
      {
        text: t('openSource'),
        handler: () => {
          window.open('https://github.com/Forgr-ee/Mimesis', '_blank')
        },
      },
      {
        text: t('rate'),
        handler: () => {
          if (isPlatform('capacitor'))
            RateApp.requestReview()
        },
      },
      {
        text: `${t('by')} Martin DONADIEU`,
        handler: () => {
          window.open('https://msha.ke/martindonadieu', '_blank')
        },
      },
      {
        text: t('close'),
        role: 'cancel',
      },
    ],
  })
  await actionSheet.present()

  const { role } = await actionSheet.onDidDismiss()
  console.log('onDidDismiss resolved with role', role)
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true" :scroll-y="false">
      <div
        class="flex flex-col justify-center h-screen bg-pizazz-500 item-center"
      >
        <img
          class="object-contain h-24 mx-auto mb-6 xsheight:h-32"
          src="/assets/icon/icon.png"
          alt="logo"
        >
        <h1
          class="mx-auto text-5xl font-bold leading-tight text-center text-gray-50 first-letter:uppercase"
        >
          {{ t('createTeam') }}
        </h1>
        <Modal :open="modals.lang">
          <template #icon>
            <TranslateIcon class="w-6 h-6 text-red-600" aria-hidden="true" />
          </template>
          <template #title>
            {{ t('langTitle') }}
          </template>
          <template #content>
            <div>
              <button
                v-for="l in main.langs"
                :key="`locale-${l}`"
                class="p-2 my-2 font-medium rounded-lg"
                :class="{ 'bg-rose-500': main.lang === l }"
                @click="setLang(l)"
              >
                {{ t(l) }}
              </button>
            </div>
          </template>
          <template #buttons>
            <button
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="modals.lang = false"
            >
              {{ t('accept') }}
            </button>
          </template>
        </Modal>
        <Modal :open="modals.rules">
          <template #icon>
            <ClipboardListIcon
              class="w-6 h-6 text-red-600"
              aria-hidden="true"
            />
          </template>
          <template #title>
            {{ t('ruleTitle') }}
          </template>
          <template #content>
            <div class="text-left">
              <p class="my-1">
                - {{ t('rule010') }}
                <strong>{{ t('rule011') }}</strong>
                {{ t('rule012') }}
              </p>
              <p class="my-1">
                - {{ t('rule020') }} <strong>{{ t('rule021') }}</strong>.
              </p>
              <p class="my-1">
                - {{ t('rule030') }}
              </p>
              <p class="my-1">
                - {{ t('rule040') }}
              </p>
              <p class="pt-5 my-1">
                <strong>{{ t('rule050') }}:</strong>
                {{ t('rule051') }}
              </p>
            </div>
          </template>
          <template #buttons>
            <button
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="modals.rules = false"
            >
              {{ t('accept') }}
            </button>
          </template>
        </Modal>
        <Modal :open="modals.inequal">
          <template #icon>
            <ExclamationIcon class="w-6 h-6 text-red-600" aria-hidden="true" />
          </template>
          <template #title>
            {{ t('beCarefull') }}
          </template>
          <template #content>
            {{ t('inequal') }}
            <br>
            <strong>{{ t('fairRule') }}</strong>
          </template>
          <template #buttons>
            <button
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-lavender-500 text-rose-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="modals.inequal = false"
            >
              {{ t('update') }} {{ t('team') }}
            </button>
            <router-link to="/theme" @click="modals.inequal = false">
              <button
                class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {{ t('go') }}
              </button>
            </router-link>
          </template>
        </Modal>
        <div class="flex overflow-x-scroll no_bar">
          <div
            v-for="(team, index) in game.teams"
            :key="team.uuid"
            class="flex-none w-10/12 md:w-5/12"
            :class="{
              'ml-8': index === 0,
            }"
          >
            <div
              class="relative flex flex-col items-center pt-10 pb-4 px-4 mx-3 my-5 border-2 border-rose-500 bg-lavender-500 rounded-xl shadow-md"
            >
              <p
                class="absolute top-0 left-0 p-3 text-rose-500 first-letter:uppercase"
              >
                {{ t('team') }} {{ index + 1 }}
              </p>
              <IonInput
                class="w-2/3 mx-auto mb-6 text-4xl text-center font-bold border-b-2 bg-lavender-500 border-rose-500 text-rose-500 focus:outline-none"
                :value="team.name"
              />
              <div class="mb-5 overflow-y-scroll no_bar h-28 xs:h-48 md:h-60">
                <div class="px-3">
                  <div
                    v-for="(player, idx) in team.players"
                    :key="player.uuid"
                    class="flex items-center"
                  >
                    <IonInput
                      v-model="player.name"
                      class="my-1 px-3 py-2 text-lg text-center border-2 rounded-lg text-rose-500 bg-lavender-500 border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      v-if="team.players.length > 2"
                      class="w-2/12 p-2 text-rose-500"
                      type="button"
                      @click="team.players.splice(idx, 1)"
                    >
                      <TrashIcon class="w-8 h-8" />
                    </button>
                  </div>
                </div>
                <div class="flex flex-col items-end pr-3">
                  <button
                    class="w-2/12 p-2 text-rose-500"
                    type="button"
                    @click="team.players.push(randomPlayer())"
                  >
                    <PlusCircleIcon class="w-8 h-8" />
                  </button>
                </div>
              </div>
              <button
                v-if="game.teams.length > 2"
                class="w-2/12 p-2 text-rose-500"
                type="button"
                @click="game.teams.splice(index, 1)"
              >
                <TrashIcon class="w-8 h-8" />
              </button>
            </div>
          </div>
          <div class="flex-none w-3/12 md:w-1/12">
            <div
              class="relative flex items-center justify-center w-full mx-3 my-5 border-2 h-60 xs:h-80 md:h-96 md:mx-5 border-rose-500 bg-lavender-500 rounded-xl shadow-md"
            >
              <button
                class="flex items-center justify-center w-14 h-14 rounded-full cursor-pointer bg-rose-500 hover:bg-rose-600 active:bg-pizazz-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                aria-label="Add team"
                @click="game.teams.push(randomTeam())"
              >
                <PlusIcon class="w-8 h-8 text-lavender-500" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-center mt-6">
          <button
            class="flex items-center justify-center gap-3 px-8 py-4 text-4xl font-bold border-2 xs:mt-2 md:w-1/3 bg-lavender-500 border-rose-500 text-rose-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400 first-letter:uppercase"
            @click="saveTeam()"
          >
            <PlayIcon class="w-10 h-10" />
            <span>{{ t('play') }}</span>
          </button>
        </div>
        <div class="flex justify-center gap-4 mt-8">
          <button
            v-if="lenghtLangs > 1"
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Change language"
            @click="modals.lang = true"
          >
            <FlagIcon class="w-8 h-8" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="View rules"
            @click="modals.rules = true"
          >
            <InformationCircleIcon class="w-8 h-8" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Open chat"
            @click="openChat()"
          >
            <ChatIcon class="w-8 h-8" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="More options"
            @click="presentActionSheet()"
          >
            <DotsVerticalIcon class="w-8 h-8" />
          </button>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
