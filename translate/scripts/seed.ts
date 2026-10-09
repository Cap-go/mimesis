// One-off: turns the hand-made translations the app shipped before it went English-only into
// translation dictionaries, so those languages keep their curated text.
//   bun scripts/seed.ts            writes .seed/<lang>.json
//   bun scripts/seed.ts --upload   also uploads them to R2 as dict/<lang>.json
import type { Kind } from '../src/source'
import process from 'node:process'
import { $ } from 'bun'
import { cardKind, itemKey } from '../src/source'

// Last commit that still had every language in the repo.
const REF = '72dddfd'
const LANGS = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'zh']

interface Card { src: number, mode: number, title: string, type: string | null, cover: string | null }
interface Names { firstNames: string[], teamNames: string[] }

const show = (path: string) => $`git show ${REF}:${path}`.quiet().text()
const cards = async (lang: string) => (JSON.parse(await show(`backend/content/${lang}.json`)) as { guesses: Card[] }).guesses
const ui = async (lang: string) => Bun.YAML.parse(await show(`locales/${lang}.yml`)) as Record<string, string>
const names = async (lang: string) => JSON.parse(await show(`locales/names/${lang}.json`)) as Names

function groups(list: Card[]) {
  const map = new Map<string, Card[]>()
  for (const card of list) {
    const key = `${card.mode}|${card.src}|${card.cover}`
    map.set(key, [...map.get(key) ?? [], card])
  }
  return map
}

const enCards = await cards('en')
const enUi = await ui('en')
const enNames = await names('en')
const upload = process.argv.includes('--upload')

for (const lang of LANGS) {
  const dict: Record<string, string> = {}
  const add = (kind: Kind, source: string | null | undefined, target: string | null | undefined) => {
    if (source && target && !(itemKey(kind, source) in dict))
      dict[itemKey(kind, source)] = target
  }

  const langUi = await ui(lang)
  for (const [key, text] of Object.entries(enUi))
    add('ui', text, langUi[key])

  const langNames = await names(lang)
  enNames.firstNames.forEach((name, i) => add('first', name, langNames.firstNames[i]))
  enNames.teamNames.forEach((name, i) => add('team', name, langNames.teamNames[i]))

  // Only artworks were translated card by card (they share src + cover); the other themes
  // were written separately per language, so the worker adapts those from English.
  const theirs = groups(await cards(lang))
  for (const [key, mine] of groups(enCards.filter(card => card.cover))) {
    const match = theirs.get(key)
    if (match?.length !== mine.length)
      continue
    mine.forEach((card, i) => {
      add(cardKind(card.mode), card.title, match[i].title)
      add('category', card.type, match[i].type)
    })
  }

  const file = `${import.meta.dir}/../.seed/${lang}.json`
  await Bun.write(file, JSON.stringify(dict))
  console.log(lang, Object.keys(dict).length)
  if (upload)
    await $`bunx wrangler r2 object put mimesis-translations/dict/${lang}.json --file ${file} --content-type application/json --remote`.quiet()
}
