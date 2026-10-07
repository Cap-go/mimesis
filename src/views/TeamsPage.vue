<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import { tap } from '~/services/haptics'
import { push } from '~/services/navigation'
import { isNative } from '~/services/platform'
import { TEAM_COLORS, useGameStore } from '~/store/game'

const { t } = useI18n()
const game = useGameStore()

function color(index: number) {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}

function play() {
  tap()
  push('/themes')
}
</script>

<template>
  <AppPage :title="t('tabTeams')" :subtitle="t('teamsSubtitle')">
    <TransitionGroup
      tag="ul" class="flex flex-col gap-4"
      enter-active-class="duration-300 ease-out" enter-from-class="opacity-0 scale-95"
      leave-active-class="duration-200 ease-in absolute inset-x-0" leave-to-class="opacity-0 scale-95"
      move-class="duration-300"
    >
      <li v-for="(team, index) in game.teams" :key="team.uuid" class="card overflow-hidden">
        <div class="flex items-center gap-3 px-5 pb-2 pt-5">
          <span class="size-4 shrink-0 rounded-full ring-4 ring-white" :style="{ backgroundColor: color(index) }" aria-hidden="true" />
          <label class="sr-only" :for="`team-${team.uuid}`">{{ t('teamNameLabel', { n: index + 1 }) }}</label>
          <input
            :id="`team-${team.uuid}`"
            v-model.trim="team.name"
            class="min-w-0 flex-1 bg-transparent font-display text-2xl font-extrabold capitalize text-plum-900 outline-none placeholder:text-plum-500/50"
            :placeholder="t('teamLabel', { n: index + 1 })"
            enterkeyhint="done"
            autocomplete="off"
          >
          <button
            v-if="game.teams.length > 2"
            type="button"
            class="flex size-11 items-center justify-center rounded-full text-plum-500 active:bg-plum-900/5"
            :aria-label="t('removeTeam')"
            @click="tap(); game.removeTeam(team.uuid)"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
          </button>
        </div>
        <TransitionGroup
          tag="ul" class="px-3"
          enter-active-class="duration-200" enter-from-class="opacity-0 -translate-y-2"
          leave-active-class="duration-150" leave-to-class="opacity-0"
        >
          <li v-for="player in team.players" :key="player.uuid" class="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-white"
              :style="{ backgroundColor: color(index) }"
              aria-hidden="true"
            >{{ player.name.charAt(0).toUpperCase() || '?' }}</span>
            <input
              v-model.trim="player.name"
              class="min-h-11 min-w-0 flex-1 rounded-xl bg-pizazz-50 px-3 text-lg font-semibold text-plum-900 outline-none ring-rose-400 focus:ring-2"
              :aria-label="t('playerName')"
              enterkeyhint="done"
              autocomplete="off"
            >
            <button
              v-if="team.players.length > 2"
              type="button"
              class="flex size-11 shrink-0 items-center justify-center rounded-full text-plum-500 active:bg-plum-900/5"
              :aria-label="t('removePlayer', { name: player.name })"
              @click="tap(); game.removePlayer(team, player.uuid)"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </li>
        </TransitionGroup>
        <div class="px-3 pb-3 pt-1">
          <button type="button" class="btn-ghost w-full justify-start text-base" @click="tap(); game.addPlayer(team)">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            {{ t('addPlayer') }}
          </button>
        </div>
      </li>
    </TransitionGroup>

    <button
      type="button"
      class="mt-4 flex min-h-16 w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-plum-900/25 font-display text-lg font-bold text-plum-900/70 transition active:scale-[0.98] active:bg-white/10"
      @click="tap(); game.addTeam()"
    >
      <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      {{ t('addTeam') }}
    </button>

    <Transition enter-active-class="duration-200" enter-from-class="opacity-0" leave-active-class="duration-150" leave-to-class="opacity-0">
      <p v-if="game.mode === 1" class="mt-4 flex items-start gap-2 rounded-2xl bg-plum-900/10 px-4 py-3 text-sm font-semibold text-plum-900">
        <svg class="mt-0.5 size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        {{ t('unequalNotice') }}
      </p>
    </Transition>

    <div class="h-24" aria-hidden="true" />
    <div
      class="pointer-events-none sticky z-10 mt-auto"
      :style="{ bottom: isNative ? 'calc(var(--safe-bottom) + 1rem)' : 'calc(max(0.75rem, var(--inset-bottom)) + 5.5rem)' }"
    >
      <button type="button" class="btn-primary pointer-events-auto w-full text-xl" :disabled="!game.canStart" @click="play()">
        {{ t('chooseTheme') }}
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  </AppPage>
</template>
