import { createI18n } from 'vue-i18n'

const modules = import.meta.glob<{ default: Record<string, string> }>('../../locales/*.yml', { eager: true })

export const messages = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [path.split('/').pop()!.replace('.yml', ''), mod.default]),
)

export const availableLocales = Object.keys(messages).sort()

// Pick the first device language the app supports, e.g. "pt-BR" -> "pt", "zh-Hans-CN" -> "zh".
export function detectLocale(preferred: readonly string[] = navigator.languages ?? [navigator.language]): string {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split(/[-_]/)[0]
    if (availableLocales.includes(base))
      return base
  }
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: detectLocale(),
  fallbackLocale: ['en', 'fr'],
  messages,
})

export function setLocale(locale: string): void {
  if (availableLocales.includes(locale)) {
    i18n.global.locale.value = locale
    document.documentElement.lang = locale
  }
}
