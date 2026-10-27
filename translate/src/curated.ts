// Hand-checked translations that always win over the model: theme names in every store language,
// and for the main languages the idioms players actually use there (never a word-for-word copy).
import de from '../curated/idioms/de.json'
import es from '../curated/idioms/es.json'
import fr from '../curated/idioms/fr.json'
import it from '../curated/idioms/it.json'
import ja from '../curated/idioms/ja.json'
import ko from '../curated/idioms/ko.json'
import nl from '../curated/idioms/nl.json'
import pl from '../curated/idioms/pl.json'
import pt from '../curated/idioms/pt.json'
import ru from '../curated/idioms/ru.json'
import tr from '../curated/idioms/tr.json'
import zhHant from '../curated/idioms/zh-hant.json'
import zh from '../curated/idioms/zh.json'
import themes from '../curated/themes.json'
import { itemKey, messages } from './source'

export const CURATED_IDIOMS: Record<string, Record<string, string>> = { 'de': de, 'es': es, 'fr': fr, 'it': it, 'ja': ja, 'ko': ko, 'nl': nl, 'pl': pl, 'pt': pt, 'ru': ru, 'tr': tr, 'zh': zh, 'zh-hant': zhHant }
export const CURATED_THEMES: Record<string, Record<string, string>> = themes
// Devices report Norwegian Bokmål as either code.
const ALIASES: Record<string, string> = { nb: 'no' }

// `english` is the app's English UI strings (theme names are keyed by their English text).
export function curatedDict(lang: string, english: Record<string, string> = messages): Record<string, string> {
  const code = CURATED_THEMES[lang] || CURATED_IDIOMS[lang] ? lang : ALIASES[lang] ?? lang
  const dict: Record<string, string> = {}
  for (const [key, name] of Object.entries(CURATED_THEMES[code] ?? {})) {
    if (english[key])
      dict[itemKey('ui', english[key])] = name
  }
  for (const [text, idiom] of Object.entries(CURATED_IDIOMS[code] ?? {}))
    dict[itemKey('idiom', text)] = idiom
  return dict
}
