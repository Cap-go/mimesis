<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import TimerRing from '~/components/TimerRing.vue'
import { DEMO_COVER } from '~/services/demo'
import { tap } from '~/services/haptics'
import { names } from '~/services/names'
import { resetTo } from '~/services/navigation'
import { useCatalogStore } from '~/store/catalog'
import { TEAM_COLORS } from '~/store/game'
import { useSettingsStore } from '~/store/settings'

const { t } = useI18n()
const settings = useSettingsStore()
const catalog = useCatalogStore()

const steps = ['welcome', 'teams', 'mime', 'score'] as const
const track = ref<HTMLElement | null>(null)
const index = ref(0)
const last = computed(() => index.value === steps.length - 1)

// Real names and a real card in the current language make the steps feel like the game.
const sample = computed(() => {
  const { firstNames, teamNames } = names()
  return [
    { name: teamNames[0], players: firstNames.slice(0, 3) },
    { name: teamNames[1], players: firstNames.slice(3, 6) },
  ]
})
const card = computed(() => {
  const art = catalog.guessesFor(1)
  return art.find(g => g.cover?.endsWith(DEMO_COVER)) ?? art.find(g => g.cover) ?? null
})

function onScroll() {
  if (track.value)
    index.value = Math.round(track.value.scrollLeft / track.value.clientWidth)
}

function goTo(step: number) {
  track.value?.scrollTo({ left: step * track.value.clientWidth, behavior: 'smooth' })
}

function finish() {
  tap()
  settings.onboarded = true
  resetTo('/teams', 'forward')
}

function next() {
  if (last.value)
    return finish()
  tap()
  goTo(index.value + 1)
}

// Android back: step back, or leave from the first step.
function onHardwareBack() {
  if (index.value > 0)
    goTo(index.value - 1)
  else
    finish()
}

onMounted(() => window.addEventListener('mimesis:hardware-back', onHardwareBack))
onBeforeUnmount(() => window.removeEventListener('mimesis:hardware-back', onHardwareBack))
</script>

<template>
  <AppPage>
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 justify-end pt-2 short:pt-0">
        <button v-if="!last" type="button" class="btn-ghost -mr-3 text-plum-700" @click="finish()">
          {{ t('onbSkip') }}
        </button>
        <span v-else class="min-h-11" aria-hidden="true" />
      </div>

      <div ref="track" class="no-scrollbar -mx-5 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto" @scroll.passive="onScroll">
        <section
          v-for="(step, i) in steps" :key="step"
          class="flex w-full shrink-0 snap-center flex-col items-center justify-center px-5 pb-6 text-center short:flex-row short:gap-10 short:pb-2 short:text-left"
          :aria-hidden="i !== index"
        >
          <div class="flex h-72 w-full max-w-sm shrink-0 items-center justify-center short:h-48 short:w-72 short:scale-75" aria-hidden="true">
            <img v-if="step === 'welcome'" src="/assets/icon/icon.png" alt="" class="size-44 -rotate-6 rounded-[2.75rem] shadow-card">

            <div v-else-if="step === 'teams'" class="flex w-full flex-col gap-3">
              <div v-for="(team, n) in sample" :key="team.name" class="card flex items-center gap-3 p-4" :class="n ? 'translate-x-4 rotate-1' : '-translate-x-2 -rotate-1'">
                <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: TEAM_COLORS[n] }" />
                <span class="flex-1 truncate text-left font-display text-lg font-extrabold text-plum-900">{{ team.name }}</span>
                <span class="flex -space-x-2">
                  <span
                    v-for="player in team.players" :key="player"
                    class="flex size-9 items-center justify-center rounded-full border-2 border-cream font-display text-sm font-extrabold text-white"
                    :style="{ backgroundColor: TEAM_COLORS[n] }"
                  >{{ player.charAt(0) }}</span>
                </span>
              </div>
            </div>

            <div v-else-if="step === 'mime'" class="card w-56 rotate-3 overflow-hidden">
              <img v-if="card?.cover" :src="card.cover" alt="" class="h-36 w-full object-cover">
              <div class="flex flex-col items-center gap-1 px-4 py-4">
                <span v-if="card?.type" class="rounded-full bg-pizazz-100 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-pizazz-600">{{ card.type }}</span>
                <span class="font-display text-2xl font-extrabold leading-tight text-plum-900">{{ card?.title ?? '🤫' }}</span>
              </div>
            </div>

            <div v-else class="flex w-full flex-col items-center gap-5">
              <TimerRing :remaining="42_000" :total="60" />
              <div class="grid w-full grid-cols-2 gap-3">
                <span class="btn-secondary pointer-events-none text-xl">{{ t('pass') }}</span>
                <span class="btn-primary pointer-events-none text-xl">{{ t('found') }}</span>
              </div>
            </div>
          </div>

          <div>
            <h1 class="mt-6 text-4xl font-extrabold leading-tight text-plum-900 short:mt-0 short:text-3xl">
              {{ t(`onb${i + 1}Title`) }}
            </h1>
            <p class="mt-3 max-w-sm text-lg font-semibold leading-relaxed text-plum-700 short:text-base">
              {{ t(`onb${i + 1}Body`, { found: t('found'), pass: t('pass'), score: settings.targetScore }) }}
            </p>
          </div>
        </section>
      </div>

      <div class="flex shrink-0 justify-center gap-2 py-4 short:py-2" role="tablist">
        <button
          v-for="(step, i) in steps" :key="step"
          type="button" role="tab" :aria-selected="i === index" :aria-label="t(`onb${i + 1}Title`)"
          class="h-2.5 rounded-full transition-all duration-300"
          :class="i === index ? 'w-8 bg-rose-500' : 'w-2.5 bg-plum-900/25'"
          @click="goTo(i)"
        />
      </div>
      <button type="button" class="btn-primary mb-4 w-full shrink-0 text-xl short:mb-2" @click="next()">
        {{ last ? t('onbStart') : t('onbNext') }}
      </button>
    </div>
  </AppPage>
</template>
