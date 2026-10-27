// The English source the worker translates: UI strings and names ship with the app,
// cards come from the API.
import messages from '../../locales/en.json'
import names from '../../locales/names.json'
import site from '../../locales/site.json'

export { messages, names, site }

export type Kind = 'ui' | 'site' | 'first' | 'team' | 'category' | 'work' | 'idiom' | 'scene' | 'rebus' | 'word'

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

// Theme ids from the API: 1 art, 3/4 idioms, 5/6 crazy scenes, 7/8 word puzzles,
// then the easy single-word themes.
const KIND_BY_MODE: Record<number, Kind> = { 1: 'work', 3: 'idiom', 4: 'idiom', 5: 'scene', 6: 'scene', 7: 'rebus', 8: 'rebus', 9: 'word', 10: 'word', 11: 'word', 12: 'word', 13: 'word' }
const WORD_HINTS: Record<number, string> = { 9: 'animal', 10: 'job', 11: 'sport', 12: 'everyday action', 13: 'food or drink' }

export function cardKind(mode: number): Kind {
  return KIND_BY_MODE[mode] ?? 'scene'
}

// Bumping a kind's version makes every language translate that kind again with the new instructions.
// Idioms v2: the first pass copied English idioms word for word.
const KEY_PREFIX: Partial<Record<Kind, string>> = { idiom: 'idiom@2' }

export function itemKey(kind: Kind, text: string): string {
  return `${KEY_PREFIX[kind] ?? kind}:${text}`
}

// Theme names are message keys like fun.mimesis.animals; tell the model what each one holds.
const THEME_HINTS: Record<string, string> = {
  'fun.mimesis.animals': 'animals to mime',
  'fun.mimesis.actions': 'everyday actions to mime',
  'fun.mimesis.jobs': 'jobs to mime',
  'fun.mimesis.sports': 'sports to mime',
  'fun.mimesis.food': 'foods and drinks to mime',
  'fun.mimesis.expression': 'well-known idioms and sayings',
  'fun.mimesis.expression_plus': 'harder idioms and sayings',
  'fun.mimesis.improbable': 'short absurd funny situations',
  'fun.mimesis.improbable_plus': 'longer absurd funny mini stories',
  'fun.mimesis.art': 'titles of famous movies, books and songs',
  'fun.mimesis.art_plus': 'harder titles of famous movies, books and songs',
  'fun.mimesis.rebus': 'word puzzles: a word split into syllables that sound like other words, each part mimed',
  'fun.mimesis.rebus_plus': 'longer word puzzles with 3 or 4 parts',
}

function uiHint(key: string): string {
  const theme = THEME_HINTS[key]
  return theme ? `${key}: name of a game theme (card category) holding ${theme}. Give the short, catchy name a party game sold in that country would use, not a word-for-word translation.` : key
}

export function uiItems(): Item[] {
  return [
    ...Object.entries(messages).map(([key, text]): Item => ({ kind: 'ui', text, hint: uiHint(key) })),
    ...names.firstNames.map((text): Item => ({ kind: 'first', text })),
    ...names.teamNames.map((text): Item => ({ kind: 'team', text })),
  ]
}

export function siteItems(): Item[] {
  return Object.entries(site).map(([key, text]): Item => ({ kind: 'site', text, hint: key }))
}

export function catalogItems(catalog: Catalog): Item[] {
  const items: Item[] = []
  for (const guess of catalog.guesses) {
    const kind = cardKind(guess.mode)
    const hint = kind === 'work' ? [guess.type, guess.author && `by ${guess.author}`].filter(Boolean).join(' ') : WORD_HINTS[guess.mode]
    items.push({ kind, text: guess.title, hint })
    if (guess.type)
      items.push({ kind: 'category', text: guess.type })
  }
  return items
}
