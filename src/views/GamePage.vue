<script setup lang="ts">
import type { CreateTypes } from 'canvas-confetti'
import { InAppReview } from '@capacitor-community/in-app-review'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { App } from '@capacitor/app'
import { Device } from '@capacitor/device'
import { create as createConfetti } from 'canvas-confetti'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import BottomSheet from '~/components/BottomSheet.vue'
import TimerRing from '~/components/TimerRing.vue'
import { saveGame } from '~/services/api'
import { demo, DEMO_COVER } from '~/services/demo'
import { success, tap, warning } from '~/services/haptics'
import { resetTo } from '~/services/navigation'
import { isNative } from '~/services/platform'
import { playSound } from '~/services/sound'
import { useCatalogStore } from '~/store/catalog'
import { TEAM_COLORS, useGameStore } from '~/store/game'
import { useSettingsStore } from '~/store/settings'

type Phase = 'handoff' | 'playing' | 'timeup' | 'winner'

const { t } = useI18n()
const game = useGameStore()
const catalog = useCatalogStore()
const settings = useSettingsStore()

const phase = ref<Phase>('handoff')
const paused = ref(false)
const remaining = ref(settings.roundSeconds * 1000)
const roundFound = ref(0)
const canvas = ref<HTMLCanvasElement | null>(null)
let deadline = 0
let frame = 0
let confetti: CreateTypes | null = null
const listeners: { remove: () => Promise<void> }[] = []

const pool = computed(() => catalog.guessesFor(game.theme))
function colorOf(uuid: string) {
  const index = game.teams.findIndex(team => team.uuid === uuid)
  return TEAM_COLORS[Math.max(index, 0) % TEAM_COLORS.length]
}
const teamColor = computed(() => colorOf(game.teamUUID))

function sound(name: 'horn' | 'tada') {
  if (settings.sound)
    void playSound(name)
}

function tick() {
  remaining.value = Math.max(0, deadline - Date.now())
  if (remaining.value === 0)
    return timeUp()
  frame = requestAnimationFrame(tick)
}

function startClock(ms: number) {
  deadline = Date.now() + ms
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(tick)
}

function stopClock() {
  cancelAnimationFrame(frame)
}

function startRound() {
  tap()
  roundFound.value = 0
  game.nextGuess(pool.value)
  remaining.value = settings.roundSeconds * 1000
  phase.value = 'playing'
  startClock(remaining.value)
}

function timeUp() {
  stopClock()
  warning()
  sound('horn')
  phase.value = 'timeup'
}

function nextTurn() {
  tap()
  game.nextTeam()
  phase.value = 'handoff'
}

function skip() {
  tap()
  game.nextGuess(pool.value)
}

function found() {
  success()
  roundFound.value++
  game.addScore(settings.targetScore)
  game.nextGuess(pool.value, true)
  if (game.winned)
    void finish()
}

async function finish() {
  stopClock()
  phase.value = 'winner'
  sound('tada')
  confetti?.({ angle: 90, spread: 70, particleCount: 260, origin: { y: 0.9 }, colors: ['#B5244F', '#E67F3C', '#FFFAF5', '#3B0A1F'] })
  if (import.meta.env.VITE_DEMO)
    return
  settings.gamesPlayed++
  const { identifier } = await Device.getId()
  void saveGame({
    deviceId: identifier,
    lang: settings.locale,
    mode: game.theme,
    teams: game.teams,
    foundGuess: game.foundGuess,
    skipGuess: game.skipGuess,
  })
  if (isNative && settings.gamesPlayed > 2)
    void InAppReview.requestReview()
}

function pause() {
  if (phase.value !== 'playing' || paused.value)
    return
  tap()
  stopClock()
  paused.value = true
}

function resume() {
  tap()
  paused.value = false
  startClock(remaining.value)
}

function playAgain() {
  tap()
  game.reset()
  game.nextTeam()
  phase.value = 'handoff'
}

function quit() {
  stopClock()
  paused.value = false
  game.reset()
  resetTo('/teams', 'back')
}

// Freeze a representative frame for store screenshots.
function stageScene() {
  if (demo.scene === 'playing') {
    startRound()
    const showcase = pool.value.find(g => g.cover?.endsWith(DEMO_COVER)) ?? pool.value.find(g => g.cover)
    if (showcase)
      game.guess = showcase
    stopClock()
    remaining.value = 42_000
  }
  else if (demo.scene === 'winner') {
    game.teams[0].score = settings.targetScore
    void finish()
  }
}

function onHardwareBack() {
  if (phase.value === 'playing')
    pause()
  else if (!paused.value)
    quit()
}

onMounted(async () => {
  if (!pool.value.length || game.teamUUID === '-1')
    return resetTo('/teams', 'none')
  if (canvas.value)
    confetti = createConfetti(canvas.value, { resize: true, useWorker: true })
  window.addEventListener('mimesis:hardware-back', onHardwareBack)
  if (import.meta.env.VITE_DEMO)
    stageScene()
  if (isNative) {
    void KeepAwake.keepAwake()
    listeners.push(await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive)
        pause()
    }))
  }
})

onBeforeUnmount(() => {
  stopClock()
  confetti?.reset()
  window.removeEventListener('mimesis:hardware-back', onHardwareBack)
  listeners.forEach(listener => void listener.remove())
  if (isNative)
    void KeepAwake.allowSleep()
})
</script>

<template>
  <AppPage>
    <!-- Handoff: pass the phone to the next mime. -->
    <section v-if="phase === 'handoff'" class="flex flex-1 flex-col pt-4">
      <div class="flex items-center justify-between">
        <button type="button" class="btn-ghost -ml-3 text-plum-900" @click="quit()">
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          <span class="sr-only">{{ t('quitGame') }}</span>
        </button>
        <ul class="flex gap-2" :aria-label="t('score')">
          <li
            v-for="team in game.teams" :key="team.uuid"
            class="flex min-w-10 items-center justify-center rounded-full px-3 py-1 text-sm font-extrabold tabular-nums text-white transition"
            :class="team.uuid === game.teamUUID ? 'scale-110 ring-4 ring-white/70' : 'opacity-60'"
            :style="{ backgroundColor: colorOf(team.uuid) }"
          >
            {{ team.score }}
          </li>
        </ul>
      </div>
      <div class="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <p class="text-lg font-bold uppercase tracking-widest text-plum-700/70">
          {{ t('handoffTitle') }}
        </p>
        <h1 class="mt-2 text-5xl font-extrabold capitalize leading-none text-plum-900 sm:text-6xl">
          {{ game.teamName }}
        </h1>
        <div class="card mt-10 flex w-full max-w-sm flex-col items-center gap-3 px-6 py-8">
          <span class="flex size-20 items-center justify-center rounded-full font-display text-4xl font-extrabold text-white" :style="{ backgroundColor: teamColor }" aria-hidden="true">
            {{ game.playerName.charAt(0).toUpperCase() }}
          </span>
          <p class="font-display text-3xl font-extrabold text-plum-900">
            {{ t('handoffMimer', { name: game.playerName }) }}
          </p>
          <p class="text-base font-semibold text-plum-500">
            {{ t('handoffHint', { name: game.playerName }) }}
          </p>
        </div>
      </div>
      <button type="button" class="btn-primary mb-4 w-full text-xl" @click="startRound()">
        {{ t('readyCta') }}
      </button>
    </section>

    <!-- Playing: the mime reads the card, the team guesses. -->
    <section v-else-if="phase === 'playing' && game.guess" class="flex flex-1 flex-col gap-4 pt-3">
      <div class="flex items-center justify-between">
        <button type="button" class="flex size-12 items-center justify-center rounded-full bg-cream/90 text-plum-900 shadow-pop-soft active:translate-y-0.5" :aria-label="t('pause')" @click="pause()">
          <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
        </button>
        <TimerRing :remaining="remaining" :total="settings.roundSeconds" />
        <div class="flex min-w-12 flex-col items-center rounded-2xl bg-cream/90 px-3 py-1.5 shadow-pop-soft">
          <span class="font-display text-2xl font-extrabold tabular-nums text-plum-900">{{ game.teamScore }}</span>
          <span class="text-[0.65rem] font-extrabold uppercase text-plum-500">/ {{ settings.targetScore }}</span>
        </div>
      </div>
      <Transition mode="out-in" enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 translate-x-8 rotate-2" leave-active-class="duration-150 ease-in" leave-to-class="opacity-0 -translate-x-8 -rotate-2">
        <article :key="game.guess.id" class="card flex flex-1 flex-col items-center justify-center overflow-hidden text-center" aria-live="polite">
          <img v-if="game.guess.cover" :src="game.guess.cover" alt="" class="max-h-[34vh] w-full object-cover" aria-hidden="true">
          <div class="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-6">
            <p v-if="game.guess.type" class="rounded-full bg-pizazz-100 px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-pizazz-600">
              {{ game.guess.type }}
            </p>
            <h2 class="text-4xl font-extrabold leading-tight text-plum-900 sm:text-5xl">
              {{ game.guess.title }}
            </h2>
            <p v-if="game.guess.author" class="text-xl font-semibold text-plum-500">
              {{ game.guess.author }}
            </p>
          </div>
        </article>
      </Transition>
      <div class="grid grid-cols-2 gap-3 pb-4">
        <button type="button" class="btn-secondary min-h-20 text-2xl" @click="skip()">
          {{ t('pass') }}
        </button>
        <button type="button" class="btn-primary min-h-20 text-2xl" @click="found()">
          {{ t('found') }}
        </button>
      </div>
    </section>

    <!-- Time is up: show the round result. -->
    <section v-else-if="phase === 'timeup'" class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <p class="text-7xl" aria-hidden="true">
        ⏰
      </p>
      <h1 class="text-5xl font-extrabold text-plum-900">
        {{ t('timeUp') }}
      </h1>
      <p class="text-xl font-bold text-plum-700">
        {{ t('roundFound', roundFound) }}
      </p>
      <button type="button" class="btn-primary mt-6 w-full max-w-sm text-xl" @click="nextTurn()">
        {{ t('nextTeam') }}
      </button>
    </section>

    <!-- Winner: leaderboard. -->
    <section v-else-if="phase === 'winner'" class="flex flex-1 flex-col pt-10">
      <div class="text-center">
        <p class="text-7xl" aria-hidden="true">
          🏆
        </p>
        <h1 class="mt-4 text-5xl font-extrabold leading-none text-plum-900">
          {{ t('winnerTitle', { team: game.ladder[0]?.name }) }}
        </h1>
      </div>
      <ol class="card mt-8 divide-y divide-plum-900/10 px-5">
        <li v-for="(team, index) in game.ladder" :key="team.uuid" class="flex items-center gap-4 py-4">
          <span class="w-8 font-display text-2xl font-extrabold text-plum-500">{{ index + 1 }}</span>
          <span class="flex-1 font-display text-xl font-bold capitalize text-plum-900">{{ team.name }}</span>
          <span class="font-display text-xl font-extrabold tabular-nums text-rose-500">{{ t('points', team.score) }}</span>
        </li>
      </ol>
      <div class="mt-auto grid gap-3 pb-4 pt-8">
        <button type="button" class="btn-primary text-xl" @click="playAgain()">
          {{ t('playAgain') }}
        </button>
        <button type="button" class="btn-secondary" @click="quit()">
          {{ t('backHome') }}
        </button>
      </div>
    </section>

    <template #overlay>
      <canvas ref="canvas" class="pointer-events-none fixed inset-0 z-40 size-full" aria-hidden="true" />
      <BottomSheet :open="paused" @close="resume()">
        <h2 class="text-center text-3xl font-extrabold text-plum-900">
          {{ t('paused') }}
        </h2>
        <p class="mt-2 text-center font-semibold text-plum-500">
          {{ t('pausedHint') }}
        </p>
        <div class="mt-6 grid gap-3">
          <button type="button" class="btn-primary text-xl" @click="resume()">
            {{ t('resume') }}
          </button>
          <button type="button" class="btn-secondary" @click="quit()">
            {{ t('quitGame') }}
          </button>
        </div>
      </BottomSheet>
    </template>
  </AppPage>
</template>
