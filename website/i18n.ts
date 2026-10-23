// Routing and copy helpers for the marketing site. English is the default;
// /fr/ and any other language prefix are translated on demand, same as the app.
import { normalizeLocale, RTL_LOCALES } from '../src/services/locale'

export { RTL_LOCALES }

export const LANG_COOKIE = 'mimesis_lang'
export const SWITCHER_LOCALES = ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh', 'zh-hant'] as const

export const LOCALE_LABELS: Record<string, string> = {
  'en': 'English',
  'fr': 'Français',
  'es': 'Español',
  'pt': 'Português',
  'de': 'Deutsch',
  'it': 'Italiano',
  'ja': '日本語',
  'zh': '简体中文',
  'zh-hant': '繁體中文',
}

const LOCALE_PREFIX = /^\/([a-z]{2,3}(?:-hant)?)(?=\/|$)/i
const languages = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' })

const APPLE_COUNTRY: Record<string, string> = {
  'ar': 'sa',
  'de': 'de',
  'es': 'es',
  'fr': 'fr',
  'hi': 'in',
  'it': 'it',
  'ja': 'jp',
  'ko': 'kr',
  'nl': 'nl',
  'pl': 'pl',
  'pt': 'br',
  'ru': 'ru',
  'tr': 'tr',
  'zh': 'cn',
  'zh-hant': 'tw',
}

const PLAY_HL: Record<string, string> = {
  'pt': 'pt-BR',
  'zh': 'zh-CN',
  'zh-hant': 'zh-TW',
}

export function isLanguage(lang: string): boolean {
  try {
    return Boolean(languages.of(lang))
  }
  catch {
    return false
  }
}

export function isAssetPath(pathname: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(pathname)
}

export function isBot(userAgent: string | null): boolean {
  return /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|linkedinbot|pinterest|gptbot|claudebot|perplexity/i.test(userAgent ?? '')
}

export function splitLocalePath(pathname: string): { lang: string | null, path: string } {
  const match = LOCALE_PREFIX.exec(pathname)
  if (!match)
    return { lang: null, path: pathname || '/' }
  const lang = normalizeLocale(match[1])
  const rest = pathname.slice(match[0].length)
  return { lang, path: rest.startsWith('/') ? rest : `/${rest}` }
}

export function withLocale(path: string, lang: string): string {
  const bare = path.startsWith('/') ? path : `/${path}`
  if (!lang || lang === 'en')
    return bare
  return bare === '/' ? `/${lang}/` : `/${lang}${bare}`
}

export function localeFromAcceptLanguage(header: string | null): string {
  const first = header?.split(',')[0]?.split(';')[0]?.trim()
  return normalizeLocale(first)
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header)
    return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1)
      continue
    if (part.slice(0, eq).trim() === name)
      return decodeURIComponent(part.slice(eq + 1).trim())
  }
  return null
}

export function localeLabel(lang: string): string {
  const known = LOCALE_LABELS[lang]
  if (known)
    return known
  try {
    return new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang
  }
  catch {
    return lang
  }
}

export function videoFor(lang: string): { src: string, poster: string } {
  const spoken = lang === 'fr' ? 'fr' : 'en'
  return { src: `/video/mimesis-${spoken}.mp4`, poster: `/video/poster-${spoken}.webp` }
}

export function appleUrl(lang: string): string {
  const country = APPLE_COUNTRY[lang]
  return country
    ? `https://apps.apple.com/${country}/app/id1559423136`
    : 'https://apps.apple.com/app/id1559423136'
}

export function googleUrl(lang: string): string {
  const url = new URL('https://play.google.com/store/apps/details')
  url.searchParams.set('id', 'ee.forgr.mimesis')
  if (lang !== 'en')
    url.searchParams.set('hl', PLAY_HL[lang] ?? lang)
  return url.toString()
}

export function canonicalUrl(assetPath: string, lang: string): string {
  return `https://mimesis.fun${withLocale(assetPath, lang)}`
}

export function chooseHref(assetPath: string, lang: string): string {
  const path = assetPath === '/' ? `/${lang}/` : `/${lang}${assetPath}`
  return `${path}?choose=1`
}

export function localizeHref(href: string, lang: string): string {
  if (!href.startsWith('/'))
    return href
  const hashAt = href.indexOf('#')
  const before = hashAt === -1 ? href : href.slice(0, hashAt)
  const hash = hashAt === -1 ? '' : href.slice(hashAt)
  return `${withLocale(before || '/', lang)}${hash}`
}

export interface PageRequest {
  method: string
  pathname: string
  search: string
  acceptLanguage: string | null
  cookie: string | null
  bot: boolean
}

export type Route
  = | { type: 'asset' }
    | { type: 'redirect', location: string, cookie?: string }
    | { type: 'page', lang: string, assetPath: string }

function savedLanguage(cookie: string | null): string | null {
  const value = readCookie(cookie, LANG_COOKIE)
  if (!value || !/^[a-z]{2,3}(?:-hant)?$/i.test(value))
    return null
  const lang = normalizeLocale(value)
  return isLanguage(lang) ? lang : null
}

// English lives at / and /privacy/. Other languages use a prefix (/fr/, /ja/, …).
// A saved choice wins; otherwise the browser language does, the way the app follows the phone.
export function routeRequest(input: PageRequest): Route {
  if (input.method !== 'GET' && input.method !== 'HEAD')
    return { type: 'asset' }
  if (isAssetPath(input.pathname))
    return { type: 'asset' }

  const params = new URLSearchParams(input.search)
  const choose = params.get('choose') === '1'
  params.delete('choose')
  const rest = params.toString()
  const query = rest ? `?${rest}` : ''

  const parsed = splitLocalePath(input.pathname)
  const prefixed = parsed.lang !== null && isLanguage(parsed.lang)
  const lang = prefixed ? parsed.lang! : null
  const bare = prefixed ? parsed.path : (input.pathname || '/')
  const slashed = bare.endsWith('/') ? bare : `${bare}/`
  const cookie = choose && lang ? lang : undefined

  if (!lang) {
    const saved = savedLanguage(input.cookie)
    let target: string | null = null
    if (saved && saved !== 'en')
      target = saved
    else if (!saved && !input.bot) {
      const detected = localeFromAcceptLanguage(input.acceptLanguage)
      if (detected !== 'en' && isLanguage(detected))
        target = detected
    }
    const location = `${target ? withLocale(slashed, target) : slashed}${query}`
    if (location !== `${input.pathname}${input.search}`)
      return { type: 'redirect', location, cookie }
    return { type: 'page', lang: 'en', assetPath: slashed }
  }

  const location = `${lang === 'en' ? slashed : withLocale(slashed, lang)}${query}`
  if (location !== `${input.pathname}${input.search}` || cookie)
    return { type: 'redirect', location, cookie }
  return { type: 'page', lang, assetPath: slashed }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  apos: '\'',
  gt: '>',
  lt: '<',
  nbsp: '\u00A0',
  quot: '"',
}

export function decodeHtml(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const code = body[1]?.toLowerCase() === 'x' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity
    }
    return ENTITIES[body.toLowerCase()] ?? entity
  })
}

function attr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  if (!match)
    return null
  return match[1] ?? match[2] ?? ''
}

// Reads data-i18n / data-i18n-aria / data-i18n-alt out of the English HTML.
export function extractSiteMessages(html: string): Record<string, string> {
  const messages: Record<string, string> = {}
  const add = (key: string, value: string) => {
    const text = decodeHtml(value).replace(/\s+/g, ' ').trim()
    if (!text)
      throw new Error(`empty site string for ${key}`)
    const previous = messages[key]
    if (previous !== undefined && previous !== text)
      throw new Error(`conflicting site string for ${key}`)
    messages[key] = text
  }

  const tags = /<([a-z0-9]+)\b([^>]*)>/gi
  for (const match of html.matchAll(tags)) {
    const tag = match[1]!.toLowerCase()
    const attrs = match[2] ?? ''
    const key = attr(attrs, 'data-i18n')
    const aria = attr(attrs, 'data-i18n-aria')
    const altKey = attr(attrs, 'data-i18n-alt')
    if (key) {
      if (tag === 'meta') {
        add(key, attr(attrs, 'content') ?? '')
      }
      else {
        const from = (match.index ?? 0) + match[0].length
        const close = html.indexOf('<', from)
        add(key, close === -1 ? html.slice(from) : html.slice(from, close))
      }
    }
    if (aria)
      add(aria, attr(attrs, 'aria-label') ?? '')
    if (altKey)
      add(altKey, attr(attrs, 'alt') ?? '')
  }
  return messages
}
