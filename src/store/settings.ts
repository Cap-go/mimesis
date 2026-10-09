import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { detectLocale } from '~/services/i18n'

export const ROUND_OPTIONS = [30, 45, 60, 90] as const
export const SCORE_OPTIONS = [5, 10, 15, 20] as const

export const useSettingsStore = defineStore('settings', () => {
  // Follows the device language until the player picks one in Settings.
  const locale = ref(detectLocale())
  const localeChosen = ref(false)
  const roundSeconds = ref(60)
  const targetScore = ref(10)
  const sound = ref(true)
  const onboarded = ref(false)
  const gamesPlayed = ref(0)
  return { locale, localeChosen, roundSeconds, targetScore, sound, gamesPlayed, onboarded }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
