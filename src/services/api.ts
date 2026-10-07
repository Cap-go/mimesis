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
}

const CATALOG_KEY = 'catalog_v2'

export async function getCachedCatalog(): Promise<Catalog | null> {
  return getStorage<Catalog>(CATALOG_KEY)
}

export async function fetchCatalog(lang: string): Promise<Catalog> {
  const res = await fetch(`${API_URL}/v1/catalog?lang=${encodeURIComponent(lang)}`)
  if (!res.ok)
    throw new Error(`catalog ${res.status}`)
  const catalog = await res.json() as Catalog
  await setStorage(CATALOG_KEY, catalog)
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
