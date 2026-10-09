import { ref, shallowRef } from 'vue'
import { createI18n } from 'vue-i18n'
import en from '../../locales/en.json'
import enNames from '../../locales/names.json'
import { normalizeLocale } from './locale'
import { getStorage, setStorage } from './storage'

// Only English ships with the app. Every other language comes from the translation worker,
// which translates on demand and caches; the last copy is kept on the device for offline play.
export const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL ?? 'https://i18n.mimesis.fun'
const RETRY_MS = 20_000
const MAX_RETRIES = 15

export interface NameList {
  firstNames: string[]
  teamNames: string[]
}

interface Translation {
  lang: string
  complete: boolean
  messages: Record<string, string>
  names: NameList
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: 'en' as string,
  fallbackLocale: 'en',
  messages: { en } as Record<string, Record<string, string>>,
})

export const names = shallowRef<NameList>(enNames)
// Bumped whenever strings change, so native chrome (tab bar, titles) can follow.
export const messagesVersion = ref(0)

export function deviceLocale(): string {
  return normalizeLocale(navigator.languages?.[0] ?? navigator.language)
}

function apply(translation: Translation): void {
  i18n.global.setLocaleMessage(translation.lang, translation.messages)
  i18n.global.locale.value = translation.lang
  document.documentElement.lang = translation.lang
  names.value = translation.names
  messagesVersion.value++
}

let requested = 'en'
let retry: ReturnType<typeof setTimeout> | undefined

// The language the app is switching to, even while its strings still load.
export function currentLocale(): string {
  return requested
}

// Switches to `lang` right away with the copy saved on the device, then refreshes it in the background.
export async function setLocale(lang: string): Promise<void> {
  requested = lang
  clearTimeout(retry)
  if (lang === 'en') {
    apply({ lang, complete: true, messages: en, names: enNames })
    return
  }
  const cached = await getStorage<Translation>(`i18n_${lang}`)
  if (requested !== lang)
    return
  if (cached)
    apply(cached)
  else
    document.documentElement.lang = lang
  void refresh(lang, 0)
}

async function refresh(lang: string, attempt: number): Promise<void> {
  try {
    const res = await fetch(`${TRANSLATE_URL}/v1/messages?lang=${encodeURIComponent(lang)}`)
    if (!res.ok)
      throw new Error(`messages ${res.status}`)
    const translation = await res.json() as Translation
    if (requested !== lang)
      return
    apply(translation)
    await setStorage(`i18n_${lang}`, translation)
    // A new language is translated while we wait; check back until it is done.
    if (!translation.complete && attempt < MAX_RETRIES)
      retry = setTimeout(() => void refresh(lang, attempt + 1), RETRY_MS)
  }
  catch (err) {
    console.warn('i18n', err)
  }
}
