import type { Catalog, Guess, Theme } from '~/services/api'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchCatalog, getCachedCatalog } from '~/services/api'

export const useCatalogStore = defineStore('catalog', () => {
  const catalog = ref<Catalog | null>(null)
  const loading = ref(false)
  const error = ref(false)

  const byTheme = computed(() => {
    const map = new Map<number, Guess[]>()
    for (const guess of catalog.value?.guesses ?? []) {
      const list = map.get(guess.mode) ?? []
      list.push(guess)
      map.set(guess.mode, list)
    }
    return map
  })

  // Hide themes that have no cards in the current language.
  const themes = computed<Theme[]>(() => (catalog.value?.themes ?? []).filter(theme => byTheme.value.has(theme.id)))

  function guessesFor(themeId: number): Guess[] {
    return byTheme.value.get(themeId) ?? []
  }

  // Show the cached catalog instantly, then refresh it from the API.
  // Only the latest requested language may land, so a slow earlier load can't override a newer choice.
  let requested = ''
  async function load(lang: string): Promise<void> {
    requested = lang
    if (catalog.value?.lang !== lang) {
      const cached = await getCachedCatalog(lang)
      if (requested !== lang)
        return
      catalog.value = cached
    }
    loading.value = !catalog.value
    try {
      const fresh = await fetchCatalog(lang)
      if (requested !== lang)
        return
      catalog.value = fresh
      error.value = false
    }
    catch (err) {
      console.warn('catalog', err)
      if (requested === lang)
        error.value = !catalog.value
    }
    finally {
      if (requested === lang)
        loading.value = false
    }
  }

  return { catalog, loading, error, themes, guessesFor, load }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useCatalogStore, import.meta.hot))
