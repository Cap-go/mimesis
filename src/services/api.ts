import { TRANSLATE_URL } from './i18n'
import { getStorage, setStorage } from './storage'

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.mimesis.fun'

export interface Theme {
  id: number
  name: string
  icon: string | null
  order: number
  status: 'free' | 'paid' | 'locked'
}

export interface Guess {
  id: number
  mode: number
  title: string
  author: string | null
  type: string | null
  cover: string | null
}

export interface Catalog {
  lang: string
  themes: Theme[]
  guesses: Guess[]
  // False while the translation worker is still translating some cards (they stay in English).
  complete?: boolean
}

function catalogKey(lang: string): string {
  return `catalog_v3_${lang}`
}

export async function getCachedCatalog(lang: string): Promise<Catalog | null> {
  return getStorage<Catalog>(catalogKey(lang))
}

export async function fetchCatalog(lang: string): Promise<Catalog> {
  // English cards come straight from the API; other languages through the translation worker.
  const base = lang === 'en' ? API_URL : TRANSLATE_URL
  const res = await fetch(`${base}/v1/catalog?lang=${encodeURIComponent(lang)}`)
  if (!res.ok)
    throw new Error(`catalog ${res.status}`)
  const catalog = await res.json() as Catalog
  await setStorage(catalogKey(lang), catalog)
  return catalog
}

export interface GameRecord {
  deviceId: string
  lang: string
  mode: number
  teams: unknown[]
  foundGuess: number[]
  skipGuess: number[]
}

export async function saveGame(record: GameRecord): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/v1/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
    if (!res.ok)
      return null
    const { games } = await res.json() as { games: number }
    return games
  }
  catch {
    return null
  }
}
