// Translates Mimesis into any language on demand.
//   GET /v1/messages?lang=ko  UI strings + random names
//   GET /v1/catalog?lang=ko   themes and cards
//   GET /v1/site?lang=ko      marketing site copy
// Each language has one dictionary in R2 (dict/<lang>.json) mapping "<kind>:<english>" to the
// translation. Requests only read it: anything missing falls back to English, is reported with
// `complete: false`, and is filled by the queue consumer so the next request gets it.
import type { Catalog, Item, Kind } from './source'
import { normalizeLocale } from '../../src/services/locale'
import { curatedDict } from './curated'
import { cardKind, catalogItems, itemKey, messages, names, site, siteItems, uiItems } from './source'

interface Env {
  AI: Ai
  CACHE: R2Bucket
  QUEUE: Queue<Job>
  API: Fetcher
  MODEL: string
}

interface Job {
  lang: string
  // 'quick' covers the UI, names and artwork titles; 'full' then does every card.
  phase?: 'quick' | 'full'
}

type Dict = Record<string, string>

const API_URL = 'https://api.mimesis.fun'
const PENDING_MS = 30 * 60 * 1000
const MODEL_TIMEOUT_MS = 120_000
const FULL_DELAY_SECONDS = 15 * 60
const COMPLETE_TTL = 60 * 60
const BATCH_SIZE = 20
// Names are generated as one list so they don't repeat.
const LIST_KINDS = new Set<Kind>(['first', 'team'])
const UNIQUE_KINDS = new Set<Kind>(['first', 'team', 'rebus', 'idiom'])
// Batches translated at once; the model thinks for a while on puns.
const PARALLEL = 4

const languages = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' })

function languageName(lang: string): string | null {
  try {
    return languages.of(lang) ?? null
  }
  catch {
    return null
  }
}

// ── Reading ─────────────────────────────────────────────────────────────────────────────

// Hand-checked entries (translate/curated) always override what the model produced.
async function readDict(env: Env, lang: string): Promise<Dict> {
  const object = await env.CACHE.get(`dict/${lang}.json`)
  return { ...(object ? await object.json<Dict>() : {}), ...curatedDict(lang) }
}

async function englishCatalog(env: Env): Promise<Catalog> {
  const res = await env.API.fetch(`${API_URL}/v1/catalog?lang=en`)
  if (!res.ok)
    throw new Error(`catalog ${res.status}`)
  return res.json() as Promise<Catalog>
}

function lookup(dict: Dict, kind: Kind, text: string, missing: { count: number }): string {
  const value = dict[itemKey(kind, text)]
  if (value === undefined)
    missing.count++
  return value ?? text
}

function localizedMessages(dict: Dict) {
  const missing = { count: 0 }
  return {
    complete: () => missing.count === 0,
    messages: Object.fromEntries(Object.entries(messages).map(([key, text]) => [key, lookup(dict, 'ui', text, missing)])),
    names: {
      firstNames: names.firstNames.map(text => lookup(dict, 'first', text, missing)),
      teamNames: names.teamNames.map(text => lookup(dict, 'team', text, missing)),
    },
  }
}

function localizedSite(dict: Dict) {
  const missing = { count: 0 }
  return {
    complete: () => missing.count === 0,
    messages: Object.fromEntries(Object.entries(site).map(([key, text]) => [key, lookup(dict, 'site', text, missing)])),
  }
}

function localizedCatalog(catalog: Catalog, dict: Dict) {
  const missing = { count: 0 }
  const guesses = catalog.guesses.map(guess => ({
    ...guess,
    title: lookup(dict, cardKind(guess.mode), guess.title, missing),
    type: guess.type && lookup(dict, 'category', guess.type, missing),
  }))
  return { complete: () => missing.count === 0, catalog: { ...catalog, guesses } }
}

async function requestTranslation(env: Env, lang: string): Promise<void> {
  const marker = `pending/${lang}`
  const pending = await env.CACHE.head(marker)
  if (pending && Date.now() - pending.uploaded.getTime() < PENDING_MS)
    return
  await env.CACHE.put(marker, '')
  await env.QUEUE.send({ lang, phase: 'quick' })
}

function json(body: unknown, complete: boolean, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': complete ? `public, max-age=${COMPLETE_TTL}` : 'no-store',
    },
  })
}

async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  if (request.method === 'OPTIONS')
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } })
  if (url.pathname === '/')
    return json({ name: 'mimesis-translate', ok: true }, false)
  if (request.method !== 'GET' || !['/v1/messages', '/v1/catalog', '/v1/site'].includes(url.pathname))
    return json({ error: 'not_found' }, false, 404)

  const lang = normalizeLocale(url.searchParams.get('lang') ?? 'en')
  if (!languageName(lang))
    return json({ error: 'unknown_language' }, false, 400)

  const dict = lang === 'en' ? null : await readDict(env, lang)
  let body: unknown
  let complete = true
  if (url.pathname === '/v1/messages') {
    const result = localizedMessages(dict ?? {})
    complete = !dict || result.complete()
    body = { lang, complete, messages: dict ? result.messages : messages, names: dict ? result.names : names }
  }
  else if (url.pathname === '/v1/site') {
    const result = localizedSite(dict ?? {})
    complete = !dict || result.complete()
    body = { lang, complete, messages: dict ? result.messages : site }
  }
  else {
    const catalog = await englishCatalog(env)
    if (dict) {
      const result = localizedCatalog(catalog, dict)
      complete = result.complete()
      body = { ...result.catalog, lang, complete }
    }
    else {
      body = { ...catalog, lang, complete }
    }
  }
  if (!complete)
    ctx.waitUntil(requestTranslation(env, lang))
  return json(body, complete)
}

// ── Translating ─────────────────────────────────────────────────────────────────────────

const INSTRUCTIONS: Record<Kind, string> = {
  ui: 'These are interface strings of Mimesis, a charades party game app; the hint is the string id, sometimes with what the string names. Translate each into LANGUAGE naturally and concisely, like a native app would say it. Keep every {placeholder} exactly as written. Keep the same number of "|" separators, they split plural forms (none | one | many). Keep Mimesis, Capgo, Capacitor and GitHub as is.',
  site: 'These are sentences from the Mimesis website, a charades party game; the hint is the string id. Translate each into LANGUAGE naturally, the way a friendly game website would say it. Keep every {placeholder} exactly as written. Keep Mimesis, Capgo, Capacitor, Vue, GitHub, iOS, Android, Liquid Glass, Material, App Store and Google Play as is. For the App Store and Google Play badge lines, use the official badge wording in LANGUAGE.',
  first: 'These are common first names. Replace each with a popular first name for LANGUAGE speakers, same gender, written in the usual script of LANGUAGE. All names must be different from each other.',
  team: 'These are playful team names for a party game. Replace each with a short, fun team name in LANGUAGE with the same spirit (usually a funny animal or group). All names must be different from each other.',
  category: 'These are short category labels of cards (Book, Movie, Song, Painting...). Translate each as a short LANGUAGE noun, capitalized like a label.',
  work: 'These are titles of famous works and monuments that players mime; the hint gives the category and creator. Give the official or best-known LANGUAGE title. Keep the original title when LANGUAGE speakers usually use it untranslated (many songs).',
  idiom: 'These are English idioms that players mime. Replace each with a real, established LANGUAGE idiom or saying that native speakers use every day and would recognize instantly, written in its usual dictionary form. Use the LANGUAGE equivalent with the same meaning when one exists. If none exists, pick a different famous LANGUAGE idiom that is easy to mime. Never translate word for word and never invent a phrase: a literal translation is only allowed when it is itself a common LANGUAGE idiom. Every card must be a different idiom.',
  word: 'These are simple things players mime; the hint says what it is (animal, job, sport, everyday action, food or drink). Give the everyday LANGUAGE word or short phrase a child would use, capitalized like a card title. For actions, use the usual LANGUAGE way to name the action.',
  scene: 'These are funny absurd situations that players mime. Translate each naturally into LANGUAGE, keeping it short, visual and funny.',
  rebus: 'Each English card is a rebus: a word, then in parentheses the syllable parts that sound like it, each part being a real word that is easy to mime (car + pet = carpet). English puns do not work in LANGUAGE. For each card, invent a NEW rebus in LANGUAGE: pick a common LANGUAGE word whose sound splits into 2 or 3 parts that are each real, easy-to-mime LANGUAGE words. Write it as "word (part / part)" entirely in LANGUAGE script. Examples from other languages: German "Nachtisch (Nacht / Tisch)", Japanese "かかし (蚊 / 菓子)", French "baleine (bas / lait / noeud)". Never reuse the English word, never use English letters unless LANGUAGE uses them, and use a different word for every card.',
}

// Second opinion on idioms: the first pass still slips in literal copies of English idioms.
const IDIOM_REVIEW = 'You are a native LANGUAGE speaker checking cards of a charades party game. Each item is a card that must be a real, established LANGUAGE idiom or saying; the hint is the English idiom it replaces. Return the card unchanged when it is an idiom LANGUAGE speakers commonly use. When it is a word-for-word translation, invented, or unknown to most native speakers, return instead a real, well-known LANGUAGE idiom that is easy to mime, preferably with the same meaning as the hint, and not already used by another card.'

const SCHEMA = {
  type: 'object',
  properties: { translations: { type: 'array', items: { type: 'string' } } },
  required: ['translations'],
}

interface ModelResult {
  response?: unknown
  choices?: { message?: { content?: unknown } }[]
}

const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(m => m[0]).sort().join()
const pipes = (text: string) => text.split('|').length

function valid(item: Item, output: unknown): output is string {
  if (typeof output !== 'string' || !output.trim() || output.length > item.text.length * 4 + 40)
    return false
  if (item.kind === 'ui')
    return placeholders(output) === placeholders(item.text) && pipes(output) === pipes(item.text)
  if (item.kind === 'rebus')
    return /\(.[^\n\r/\u2028\u2029]*\/.+\)/.test(output)
  return true
}

async function runModel(env: Env, language: string, kind: Kind, items: Item[], instructions = INSTRUCTIONS[kind]): Promise<unknown[]> {
  const system = `Target language: ${language}.\n${instructions.replaceAll('LANGUAGE', language)}\nAnswer with JSON {"translations": [...]}: exactly one string per input item, in the same order.`
  const input = items.map(item => (item.hint ? { text: item.text, hint: item.hint } : { text: item.text }))
  const ai = env.AI as unknown as { run: (model: string, inputs: object) => Promise<ModelResult> }
  // A stuck model call must not hold the job until the queue's wall-clock limit.
  const result = await Promise.race([
    ai.run(env.MODEL, {
      messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ items: input }) }],
      response_format: { type: 'json_schema', json_schema: SCHEMA },
      max_tokens: 16_384,
      temperature: 0.3,
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('model timeout')), MODEL_TIMEOUT_MS)),
  ])
  // Chat models answer in `response`, OpenAI-style ones in `choices`.
  let response = result.response ?? result.choices?.[0]?.message?.content
  if (typeof response === 'string')
    response = JSON.parse(response.slice(response.indexOf('{'), response.lastIndexOf('}') + 1))
  const translations = (response as { translations?: unknown } | undefined)?.translations
  return Array.isArray(translations) && translations.length === items.length ? translations : []
}

async function reviewIdioms(env: Env, language: string, items: Item[], outputs: unknown[]): Promise<unknown[]> {
  if (!outputs.every(output => typeof output === 'string'))
    return outputs
  const cards = items.map((item, i): Item => ({ kind: 'idiom', text: outputs[i] as string, hint: item.text }))
  const reviewed = await runModel(env, language, 'idiom', cards, IDIOM_REVIEW).catch(() => [])
  const distinct = new Set(reviewed.map(card => typeof card === 'string' ? card.trim().toLowerCase() : card))
  return reviewed.length === outputs.length && distinct.size === reviewed.length ? reviewed : outputs
}

// Returns false when the model could not be reached, so the job retries later.
async function translateBatch(env: Env, language: string, kind: Kind, items: Item[], dict: Dict): Promise<boolean> {
  let outputs: unknown[]
  try {
    outputs = await runModel(env, language, kind, items)
  }
  catch (err) {
    console.warn('batch failed', kind, err)
    return false
  }
  if (UNIQUE_KINDS.has(kind) && new Set(outputs).size < outputs.length)
    outputs = await runModel(env, language, kind, items).catch(() => outputs)
  if (kind === 'idiom')
    outputs = await reviewIdioms(env, language, items, outputs)
  for (const [i, item] of items.entries()) {
    let output = outputs[i]
    // Retry alone once; if the model still breaks it, keep English so the language completes.
    if (!valid(item, output))
      output = (await runModel(env, language, kind, [item]).catch(() => []))[0]
    dict[itemKey(item.kind, item.text)] = valid(item, output) ? output.trim() : item.text
  }
  return true
}

const QUICK_KINDS: Kind[] = ['ui', 'site', 'first', 'team', 'category', 'word', 'work']
const FULL_KINDS: Kind[] = [...QUICK_KINDS, 'idiom', 'scene', 'rebus']

async function translateLanguage(env: Env, lang: string, phase: 'quick' | 'full'): Promise<void> {
  const language = languageName(lang)
  if (!language || lang === 'en')
    return
  const items = [...uiItems(), ...siteItems(), ...catalogItems(await englishCatalog(env))]
  const dict = await readDict(env, lang)
  const save = () => env.CACHE.put(`dict/${lang}.json`, JSON.stringify(dict), { httpMetadata: { contentType: 'application/json' } })

  // UI first so the app is usable quickly, then cards theme by theme.
  const seen = new Set(Object.keys(dict))
  const todo = new Map<Kind, Item[]>()
  for (const item of items) {
    const key = itemKey(item.kind, item.text)
    if (seen.has(key))
      continue
    seen.add(key)
    todo.set(item.kind, [...todo.get(item.kind) ?? [], item])
  }
  const batches: [Kind, Item[]][] = []
  for (const kind of phase === 'quick' ? QUICK_KINDS : FULL_KINDS) {
    const list = todo.get(kind) ?? []
    const size = LIST_KINDS.has(kind) ? list.length : BATCH_SIZE
    for (let i = 0; i < list.length; i += size)
      batches.push([kind, list.slice(i, i + size)])
  }
  let failed = false
  for (let i = 0; i < batches.length; i += PARALLEL) {
    const results = await Promise.all(batches.slice(i, i + PARALLEL).map(([kind, list]) => translateBatch(env, language, kind, list, dict)))
    failed ||= results.includes(false)
    await save()
  }
  if (failed)
    throw new Error(`translation of ${lang} incomplete`)
  // Every language gets its quick pass before any full pass starts.
  if (phase === 'quick')
    await env.QUEUE.send({ lang, phase: 'full' }, { delaySeconds: FULL_DELAY_SECONDS })
  else
    await env.CACHE.delete(`pending/${lang}`)
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env, ctx)
    }
    catch (err) {
      console.error('request failed', err)
      return json({ error: 'upstream' }, false, 502)
    }
  },
  async queue(batch: MessageBatch<Job>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await translateLanguage(env, message.body.lang, message.body.phase ?? 'full')
      message.ack()
    }
  },
} satisfies ExportedHandler<Env, Job>
