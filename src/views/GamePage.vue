<script setup lang="ts">
import type { CreateTypes } from 'canvas-confetti'
import type { StyleValue } from 'vue'
import { KeepAwake } from '@capacitor-community/keep-awake'
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationCircleIcon as ExclamationIcon,
} from '@heroicons/vue/24/outline'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/vue'
import { create as createConfetti } from 'canvas-confetti'
import { RateApp } from 'capacitor-rate-app'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useTimer } from 'vue-timer-hook'
import Modal from '~/components/ModalComponent.vue'
import { playSound } from '~/services/sound'
import { useGameStore } from '~/store/game'
import { useMainStore } from '~/store/main'

const gameLenght = 60
const { t } = useI18n()

const modals = reactive({
  changePlayer: true,
  winner: false,
  pause: false,
})
const game = useGameStore()
const main = useMainStore()
const timer = useTimer(gameLenght, false)
let confetti: CreateTypes

function pause() {
  modals.pause = true
  timer.pause()
}
function resume() {
  modals.pause = false
  timer.resume()
}

const bgColor = computed<StyleValue[]>(
  () =>
    [
      {
        backgroundImage: main.guess.cover
          ? `url('${main.guess.cover}')`
          : 'none',
        // backgroundBlendMode: 'screen',
        backgroundBlendMode: 'multiply',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      },
    ] as StyleValue[],
)
function createTime() {
  const expiryTimestamp = new Date()
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + gameLenght)
  return expiryTimestamp.getTime()
}

function skipGuess() {
  main.nextGuess()
}

function nextRound() {
  skipGuess()
  timer.restart(createTime())
  modals.changePlayer = false
}

function playConfetti() {
  return confetti({
    angle: 90,
    spread: 60,
    particleCount: 350,
    ticks: 400,
  })
}

function validGuess() {
  main.nextGuess(true)
  game.addScore()
}

function setupCanvas() {
  const options = {
    useWorker: true,
    resize: !isPlatform('android'),
  }
  confetti = createConfetti(null as unknown as HTMLCanvasElement, options)
}

function initGameLoop() {
  setTimeout(() => {
    game.reset()
    main.nextGuess()
    game.nextTeam()
    modals.changePlayer = true
    modals.winner = false
  }, 10)
  return true
}

onBeforeUnmount(() => {
  modals.changePlayer = true
  if (timer.isRunning)
    timer.pause()
  if (isPlatform('capacitor'))
    KeepAwake.allowSleep()
})
onMounted(() => {
  if (isPlatform('capacitor'))
    KeepAwake.keepAwake()

  watchEffect(async () => {
    if (timer.isExpired.value) {
      await playSound('horn')
      await game.nextTeam()
      modals.changePlayer = true
    }
  })
  watchEffect(async () => {
    if (game.winned) {
      playConfetti()
      if (timer.isRunning)
        timer.pause()
      modals.winner = true
      await playSound('tada')
      await game.save(main.lang)
      if (isPlatform('capacitor') && game.games > 2)
        RateApp.requestReview()
    }
  })
  watchEffect(() => {
    if (!main.isActive && timer.isRunning)
      timer.pause()
  })
  setupCanvas()
})
</script>

<template>
  <IonPage>
    <IonHeader mode="ios">
      <IonToolbar color="secondary">
        <ArrowLeftIcon class="w-1/12 mr-3 text-rose-500" @click="pause()" />
        <IonTitle>
          <img class="h-10 mx-auto" src="/assets/icon/icon.png" alt="logo">
        </IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true" :scroll-y="false">
      <div
        class="relative flex flex-col justify-between h-full px-5 pb-10 xs:px-10 bg-pizazz-500"
        :style="bgColor"
      >
        <Modal :open="main.currentPath === '/game' && modals.changePlayer">
          <template #icon>
            <CheckIcon class="w-6 h-6 text-green-600" aria-hidden="true" />
          </template>
          <template #title>
            {{ t('ready') }} ?
          </template>
          <template #content>
            <p
              class="px-5 mt-4 mb-2 text-xl leading-relaxed text-center md:text-2xl"
            >
              {{ t('team') }} <strong>{{ game.teamName }}</strong>
            </p>
            <p class="mb-4 text-xl leading-relaxed xs:px-5 md:text-2xl">
              {{ t('turnOf') }} <strong>{{ game.playerName }}</strong>
            </p>
          </template>
          <template #buttons>
            <button
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="nextRound()"
            >
              {{ t('go') }}
            </button>
          </template>
        </Modal>
        <Modal :open="modals.pause">
          <template #icon>
            <ExclamationIcon class="w-6 h-6 text-red-600" aria-hidden="true" />
          </template>
          <template #title>
            {{ t('beCarefull') }}
          </template>
          <template #content>
            <p class="py-10 md:text-2xl">
              {{ t('leave') }}
            </p>
          </template>
          <template #buttons>
            <router-link
              to="/home"
              @click="initGameLoop() && (modals.pause = false)"
            >
              <button
                type="button"
                class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-lavender-500 text-rose-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {{ t('backHome') }}
              </button>
            </router-link>
            <button
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="resume()"
            >
              {{ t('resume') }}
            </button>
          </template>
        </Modal>
        <Modal :open="modals.winner">
          <template #icon>
            <CheckIcon class="w-6 h-6 text-red-600" aria-hidden="true" />
          </template>
          <template #title>
            {{ t('gameWin') }}
          </template>
          <template #content>
            <div
              v-for="(w, index) in game.ladder"
              :key="index"
              class="py-2 md:text-3xl first-letter:uppercase"
            >
              {{ t('team') }} {{ w.name }}
              <strong v-if="index === 0">{{ t('win') }}</strong>
              <strong v-else>{{ t('is') }} {{ index + 1 }} {{ t('rankWith') }}
                {{ w.score }} !</strong>
              !
            </div>
          </template>
          <template #buttons>
            <router-link to="/home" @click="initGameLoop()">
              <button
                type="button"
                class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-lavender-500 text-rose-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {{ t('backHome') }}
              </button>
            </router-link>
            <button
              type="button"
              class="px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              @click="initGameLoop()"
            >
              {{ t('restart') }}
            </button>
          </template>
        </Modal>
        <div class="flex items-center justify-between pt-3 md:pt-10 safe-pt">
          <div class="px-4 py-2 bg-pizazz-500 border-2 border-rose-500 rounded-xl shadow-sm">
            <p class="text-base md:text-lg text-rose-500 first-letter:uppercase">
              {{ t('team') }}:
            </p>
            <h2 class="text-xl font-bold md:text-2xl text-rose-500">
              {{ game.teamName }}
            </h2>
          </div>
          <div class="px-4 py-2 bg-pizazz-500 border-2 border-rose-500 rounded-xl shadow-sm">
            <p class="text-right text-base md:text-lg text-rose-500 first-letter:uppercase">
              {{ t('player') }}:
            </p>
            <h2 class="text-xl font-bold md:text-2xl text-rose-500">
              {{ game.playerName }}
            </h2>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <div
            class="px-8 py-4 my-10 text-5xl font-bold text-center text-rose-500 bg-pizazz-500 border-2 border-rose-500 rounded-xl shadow-md"
          >
            {{ timer.seconds }}
          </div>
        </div>
        <div class="h-48">
          <div
            class="flex flex-col items-center justify-center my-auto overflow-y-scroll text-3xl border-2 text-rose-500 border-rose-500 bg-lavender-500 rounded-xl shadow-md max-h-48"
          >
            <!-- <img v-if="main.guess.cover" :src="main.guess.cover"/> -->
            <div class="px-5 py-3 md:px-14 md:py-5 text-center">
              <p v-if="main.guess.type" class="text-xl md:text-2xl mb-2">
                {{ main.guess.type }}
              </p>
              <p class="text-2xl md:text-3xl font-bold">
                {{ main.guess.title }}
              </p>
              <p v-if="main.guess.author" class="text-xl md:text-2xl mt-2">
                de {{ main.guess.author }}
              </p>
            </div>
          </div>
        </div>
        <div class="w-full mb-5">
          <div class="flex flex-col items-end mb-6">
            <div
              class="px-6 py-3 text-2xl font-bold md:text-3xl text-rose-500 bg-pizazz-500 border-2 border-rose-500 rounded-xl shadow-sm"
            >
              {{ t('score') }}: {{ game.teamScore }}
            </div>
          </div>
          <div
            class="flex justify-between gap-4 mt-10 text-3xl md:justify-around md:text-4xl text-rose-500"
          >
            <button
              type="button"
              class="flex-1 px-6 py-3 text-3xl font-bold uppercase border-2 rounded-xl shadow-md transition-all duration-150 bg-lavender-500 border-rose-500 text-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 md:text-4xl md:px-8 md:py-4"
              @click="skipGuess()"
            >
              {{ t('pass') }}
            </button>
            <button
              type="button"
              class="flex-1 px-6 py-3 text-3xl font-bold uppercase border-2 rounded-xl shadow-md transition-all duration-150 bg-rose-500 border-rose-500 text-lavender-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 md:text-4xl md:px-8 md:py-4"
              @click="validGuess()"
            >
              {{ t('validate') }}
            </button>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
  ion-toolbar {
  --border-style: none;
}
</style>
