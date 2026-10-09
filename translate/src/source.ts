// The English source the worker translates: UI strings and names ship with the app,
// cards come from the API.
import messages from '../../locales/en.json'
import names from '../../locales/names.json'

export { messages, names }

export type Kind = 'ui' | 'first' | 'team' | 'category' | 'work' | 'idiom' | 'scene' | 'rebus'

export interface Item {
  kind: Kind
  text: string
  hint?: string
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
  themes: unknown[]
  guesses: Guess[]
}

// Theme ids from the API: 1 art, 3/4 expressions, 5/6 improbable, 7/8 rebus.
const KIND_BY_MODE: Record<number, Kind> = { 1: 'work', 3: 'idiom', 4: 'idiom', 5: 'scene', 6: 'scene', 7: 'rebus', 8: 'rebus' }

export function cardKind(mode: number): Kind {
  return KIND_BY_MODE[mode] ?? 'scene'
}

export function itemKey(kind: Kind, text: string): string {
  return `${kind}:${text}`
}

export function uiItems(): Item[] {
  return [
    ...Object.entries(messages).map(([key, text]): Item => ({ kind: 'ui', text, hint: key })),
    ...names.firstNames.map((text): Item => ({ kind: 'first', text })),
    ...names.teamNames.map((text): Item => ({ kind: 'team', text })),
  ]
}

export function catalogItems(catalog: Catalog): Item[] {
  const items: Item[] = []
  for (const guess of catalog.guesses) {
    const kind = cardKind(guess.mode)
    const hint = kind === 'work' ? [guess.type, guess.author && `by ${guess.author}`].filter(Boolean).join(' ') : undefined
    items.push({ kind, text: guess.title, hint })
    if (guess.type)
      items.push({ kind: 'category', text: guess.type })
  }
  return items
}
