<script setup lang="ts">
import { InAppReview } from '@capacitor-community/in-app-review'
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
            InAppReview.requestReview()
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
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true" :scroll-y="true">
      <div
        class="flex min-h-screen flex-col justify-center overflow-hidden bg-pizazz-500 px-4 py-6 items-stretch"
      >
        <img
          class="object-contain h-20 mx-auto mb-4 xsheight:h-28 md:h-32"
          src="/assets/icon/icon.png"
          alt="Mimesis"
        >
        <h1
          class="mx-auto px-4 text-4xl font-bold leading-tight text-center text-rose-900 first-letter:uppercase xs:text-5xl"
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
                type="button"
                class="min-h-11 px-4 py-2 my-1 font-medium rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                :class="main.lang === l ? 'bg-rose-500 text-lavender-500 border-rose-500' : 'bg-lavender-500 text-rose-500 border-rose-500'"
                :aria-pressed="main.lang === l"
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
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-lavender-500 text-rose-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="modals.inequal = false"
            >
              {{ t('update') }} {{ t('team') }}
            </button>
            <router-link
              to="/theme"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="modals.inequal = false"
            >
              {{ t('go') }}
            </router-link>
          </template>
        </Modal>
        <div class="flex w-full overflow-x-auto no_bar pb-2">
          <div
            v-for="(team, index) in game.teams"
            :key="team.uuid"
            class="flex-none w-11/12 max-w-md sm:w-8/12 md:w-5/12"
            :class="{
              'ml-2': index === 0,
            }"
          >
            <div
              class="relative flex flex-col items-center pt-12 pb-4 px-4 mx-2 my-4 border-2 border-rose-500 bg-lavender-500 rounded-xl shadow-md"
            >
              <p
                class="absolute top-0 left-0 p-3 text-base font-medium text-rose-500 first-letter:uppercase"
              >
                {{ t('team') }} {{ index + 1 }}
              </p>
              <IonInput
                class="w-3/4 min-h-11 mx-auto mb-6 text-3xl text-center font-bold border-b-2 bg-lavender-500 border-rose-500 text-rose-500 focus:outline-none xs:text-4xl"
                :value="team.name"
                :aria-label="`${t('team')} ${index + 1}`"
              />
              <div class="w-full mb-5 overflow-y-auto no_bar max-h-44 xs:max-h-56 md:max-h-64">
                <div class="px-3">
                  <div
                    v-for="(player, idx) in team.players"
                    :key="player.uuid"
                    class="flex items-center gap-2"
                  >
                    <IonInput
                      v-model="player.name"
                      class="flex-1 min-h-11 my-1 px-3 py-2 text-lg text-center border-2 rounded-lg text-rose-500 bg-lavender-500 border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      :aria-label="`${t('player')} ${idx + 1}`"
                    />
                    <button
                      v-if="team.players.length > 2"
                      class="flex h-11 w-11 flex-none items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      type="button"
                      aria-label="Remove player"
                      @click="team.players.splice(idx, 1)"
                    >
                      <TrashIcon class="w-8 h-8" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div class="flex flex-col items-end pr-3">
                  <button
                    class="flex h-11 w-11 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    type="button"
                    aria-label="Add player"
                    @click="team.players.push(randomPlayer())"
                  >
                    <PlusCircleIcon class="w-8 h-8" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button
                v-if="game.teams.length > 2"
                class="flex h-11 w-11 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-rose-400"
                type="button"
                aria-label="Remove team"
                @click="game.teams.splice(index, 1)"
              >
                <TrashIcon class="w-8 h-8" aria-hidden="true" />
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
                type="button"
                @click="game.teams.push(randomTeam())"
              >
                <PlusIcon class="w-8 h-8 text-lavender-500" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-center mt-4">
          <button
            type="button"
            class="flex min-h-14 items-center justify-center gap-3 px-8 py-4 text-3xl font-bold border-2 xs:mt-2 xs:text-4xl md:w-1/3 bg-lavender-500 border-rose-500 text-rose-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400 first-letter:uppercase"
            @click="saveTeam()"
          >
            <PlayIcon class="w-10 h-10" aria-hidden="true" />
            <span>{{ t('play') }}</span>
          </button>
        </div>
        <div class="flex justify-center gap-4 mt-6 safe-pb">
          <button
            v-if="lenghtLangs > 1"
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Change language"
            type="button"
            @click="modals.lang = true"
          >
            <FlagIcon class="w-8 h-8" aria-hidden="true" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="View rules"
            type="button"
            @click="modals.rules = true"
          >
            <InformationCircleIcon class="w-8 h-8" aria-hidden="true" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Open chat"
            type="button"
            @click="openChat()"
          >
            <ChatIcon class="w-8 h-8" aria-hidden="true" />
          </button>
          <button
            class="flex items-center justify-center w-14 h-14 rounded-full bg-lavender-500 text-rose-500 shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="More options"
            type="button"
            @click="presentActionSheet()"
          >
            <DotsVerticalIcon class="w-8 h-8" aria-hidden="true" />
          </button>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
