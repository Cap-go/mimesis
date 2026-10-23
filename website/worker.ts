// English pages are the static files. /{lang}/ serves the same HTML with copy from the
// translation worker (i18n.mimesis.fun), filled in the background like the app.
import { RTL_LOCALES } from '../src/services/locale'
import { appleUrl, canonicalUrl, chooseHref, googleUrl, isBot, LANG_COOKIE, localeLabel, localizeHref, routeRequest, SWITCHER_LOCALES, videoFor } from './i18n.ts'

interface Env {
  ASSETS: { fetch: (input: RequestInfo | URL) => Promise<Response> }
  TRANSLATE: { fetch: (input: RequestInfo | URL) => Promise<Response> }
}

interface SiteBody {
  complete?: boolean
  messages?: Record<string, string>
}

function redirect(location: string, cookie?: string): Response {
  const headers = new Headers({
    'Location': location,
    'Cache-Control': 'no-store',
  })
  if (cookie)
    headers.set('Set-Cookie', `${LANG_COOKIE}=${encodeURIComponent(cookie)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`)
  return new Response(null, { status: 302, headers })
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function loadSite(env: Env, lang: string): Promise<SiteBody | null> {
  try {
    const res = await env.TRANSLATE.fetch(`https://i18n.mimesis.fun/v1/site?lang=${encodeURIComponent(lang)}`)
    if (!res.ok)
      return null
    const body = await res.json() as SiteBody
    if (!body.messages || typeof body.messages !== 'object')
      return null
    return body
  }
  catch (err) {
    console.warn('site translation', err)
    return null
  }
}

function translatedPage(response: Response, lang: string, assetPath: string, site: SiteBody | null): Response {
  const messages = site?.messages ?? {}
  const complete = site?.complete === true
  const video = videoFor(lang)
  const canonical = canonicalUrl(assetPath, lang)
  const text = (key: string | null) => (key ? messages[key] : undefined) || null

  let html = new HTMLRewriter()
    .on('html', {
      element(el) {
        el.setAttribute('lang', lang)
        el.setAttribute('dir', RTL_LOCALES.has(lang) ? 'rtl' : 'ltr')
        el.setAttribute('data-locale', lang)
        el.setAttribute('data-complete', complete ? 'true' : 'false')
      },
    })
    .on('[data-i18n]', {
      element(el) {
        const value = text(el.getAttribute('data-i18n'))
        if (!value)
          return
        if (el.tagName.toLowerCase() === 'meta')
          el.setAttribute('content', value)
        else
          el.setInnerContent(value)
      },
    })
    .on('[data-i18n-aria]', {
      element(el) {
        const value = text(el.getAttribute('data-i18n-aria'))
        if (value)
          el.setAttribute('aria-label', value)
      },
    })
    .on('[data-i18n-alt]', {
      element(el) {
        const value = text(el.getAttribute('data-i18n-alt'))
        if (value)
          el.setAttribute('alt', value)
      },
    })
    .on('[data-localize]', {
      element(el) {
        const href = el.getAttribute('href')
        if (href)
          el.setAttribute('href', localizeHref(href, lang))
      },
    })
    .on('[data-video]', {
      element(el) {
        el.setAttribute('src', video.src)
        el.setAttribute('poster', video.poster)
      },
    })
    .on('[data-store]', {
      element(el) {
        const store = el.getAttribute('data-store')
        if (store === 'apple')
          el.setAttribute('href', appleUrl(lang))
        else if (store === 'google')
          el.setAttribute('href', googleUrl(lang))
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonical)
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonical)
      },
    })
    .on('.lang-current', {
      element(el) {
        el.setAttribute('lang', lang)
        el.setInnerContent(localeLabel(lang))
      },
    })
    .on('a[data-lang]', {
      element(el) {
        if (el.getAttribute('data-lang') === lang)
          el.setAttribute('aria-current', 'true')
        else
          el.removeAttribute('aria-current')
      },
    })
    .on('.lang-menu', {
      element(el) {
        if ((SWITCHER_LOCALES as readonly string[]).includes(lang))
          return
        const href = escapeHtml(chooseHref(assetPath, lang))
        const code = escapeHtml(lang)
        const label = escapeHtml(localeLabel(lang))
        el.append(`<a href="${href}" hreflang="${code}" lang="${code}" data-lang="${code}" aria-current="true">${label}</a>`, { html: true })
      },
    })
    .transform(response)

  const headers = new Headers(html.headers)
  headers.set('Content-Language', lang)
  headers.set('Cache-Control', complete ? 'public, max-age=3600' : 'no-store')
  headers.delete('Content-Length')
  headers.delete('ETag')
  html = new Response(html.body, { status: html.status, statusText: html.statusText, headers })
  return html
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    const decision = routeRequest({
      method: request.method,
      pathname: url.pathname,
      search: url.search,
      acceptLanguage: request.headers.get('Accept-Language'),
      cookie: request.headers.get('Cookie'),
      bot: isBot(request.headers.get('User-Agent')),
    })
    if (decision.type === 'redirect')
      return redirect(decision.location, decision.cookie)
    if (decision.type === 'asset')
      return env.ASSETS.fetch(request)

    const assetUrl = new URL(request.url)
    assetUrl.pathname = decision.assetPath
    assetUrl.search = ''
    const response = await env.ASSETS.fetch(new Request(assetUrl, request))
    const type = response.headers.get('Content-Type') ?? ''
    if (decision.lang === 'en' || !response.ok || !type.includes('text/html'))
      return response
    return translatedPage(response, decision.lang, decision.assetPath, await loadSite(env, decision.lang))
  },
}
