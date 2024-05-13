import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { randomSelect } from '../services/random'

import type {
  GuessDb,
  LangMessages,
  Mode,
} from '../services/database'
import {
  useDb,
} from '../services/database'
import type { Database } from './../types/database.types'
import { useGameStore } from './game'

const filterListById = (list: Database['public']['Tables']['mimesis_guesses']['Row'][], past: number[]) => {
  const filtered = list.filter(n => !past.includes(n.id))
  return filtered
}

export const useMainStore = defineStore('main', () => {
  const error = ref(false)
  const isActive = ref(true)
  const loading = ref(false)
  const lastUpdate = ref('')
  const initialized = ref(false)
  const currentPath = ref('/home')
  const themes = ref([] as (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)[])
  const offline = ref(false)
  const langsMessages = ref({} as LangMessages)
  const lang = ref('fr')
  const guessDb = ref({} as GuessDb)
  const guess = ref({ title: '' } as Database['public']['Tables']['mimesis_guesses']['Row'])
  const langs = computed((): string[] => {
    return Object.keys(langsMessages.value).map((key) => {
      const lang = langsMessages.value[key]
      return lang.id
    })
  })
  const guesses = computed((): Database['public']['Tables']['mimesis_guesses']['Row'][] => {
    const game = useGameStore()
    return guessDb.value[`${game.theme}_${lang.value}`] || []
  })
  const needUpdate = computed((): boolean => {
    const lastUpdateDate = new Date(lastUpdate.value)
    const today = new Date()
    return (
      lastUpdateDate.getDate() !== today.getDate()
      || lastUpdateDate.getMonth() !== today.getMonth()
      || lastUpdateDate.getFullYear() !== today.getFullYear()
    )
  })
  const nextGuesses = computed((): Database['public']['Tables']['mimesis_guesses']['Row'][] => {
    const game = useGameStore()
    return filterListById(guesses.value, game.pastGuess)
  })
  const initGuessTheme = async () => {
    guessDb.value = await useDb().getGuessesDb(themes.value, lang.value)
  }
  const initThemes = async () => {
    themes.value = await useDb().getThemes()
  }
  const initialize = async (force = true) => {
    console.log('initialize', force)
    offline.value = !window.navigator.onLine
    if (!force && (offline.value || initialized.value || !needUpdate.value))
      return
    loading.value = true
    try {
      await initThemes().then(initGuessTheme)
      initialized.value = true
    }
    catch (err) {
      error.value = !!err
      console.log('err initialise', err)
    }
    lastUpdate.value = new Date().toISOString()
    loading.value = false
  }
  const nextGuess = (found = false) => {
    const game = useGameStore()
    if (guess.value && guess.value.title !== '') {
      if (found)
        game.foundGuess.push(guess.value.id)
      else
        game.skipGuess.push(guess.value.id)
    }
    if (game.pastGuess.length === guesses.value.length) {
      game.skipGuess
        = game.skipGuess.length > 1
          ? [game.skipGuess[game.skipGuess.length - 1]]
          : []
    }
    const result = randomSelect<Database['public']['Tables']['mimesis_guesses']['Row']>(nextGuesses.value)
    guess.value = result || { title: 'Error' }
  }
  return {
    error,
    isActive,
    loading,
    lastUpdate,
    initialized,
    currentPath,
    themes,
    offline,
    langsMessages,
    lang,
    guessDb,
    guess,
    langs,
    guesses,
    needUpdate,
    nextGuesses,
    initGuessTheme,
    initThemes,
    initialize,
    nextGuess,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot))
