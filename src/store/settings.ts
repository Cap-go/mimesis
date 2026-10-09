import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const ROUND_OPTIONS = [30, 45, 60, 90] as const
export const SCORE_OPTIONS = [5, 10, 15, 20] as const

export const useSettingsStore = defineStore('settings', () => {
  const roundSeconds = ref(60)
  const targetScore = ref(10)
  const sound = ref(true)
  const onboarded = ref(false)
  const gamesPlayed = ref(0)
  return { roundSeconds, targetScore, sound, gamesPlayed, onboarded }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
