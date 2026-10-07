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

function catalogKey(lang: string): string {
  // French kept the original key so existing installs reuse their offline copy.
  return lang === 'fr' ? 'catalog_v2' : `catalog_v2_${lang}`
}

export async function getCachedCatalog(lang: string): Promise<Catalog | null> {
  return getStorage<Catalog>(catalogKey(lang))
}

export async function fetchCatalog(lang: string): Promise<Catalog> {
  const res = await fetch(`${API_URL}/v1/catalog?lang=${encodeURIComponent(lang)}`)
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
