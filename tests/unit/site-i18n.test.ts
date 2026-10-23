// website/i18n.js is the public browser script, so the .ts suffix selects the worker helpers.
import type { PageRequest } from '../../website/i18n.ts'
import { describe, expect, it } from 'vitest'
import site from '../../locales/site.json'
import { appleUrl, extractSiteMessages, googleUrl, isBot, localizeHref, routeRequest, SWITCHER_LOCALES, videoFor } from '../../website/i18n.ts'
import home from '../../website/index.html?raw'
import privacy from '../../website/privacy/index.html?raw'

function request(pathname: string, extra: Partial<PageRequest> = {}): PageRequest {
  return {
    method: 'GET',
    pathname,
    search: '',
    acceptLanguage: null,
    cookie: null,
    bot: false,
    ...extra,
  }
}

describe('website language routing', () => {
  it('keeps English at the unprefixed url', () => {
    expect(routeRequest(request('/'))).toEqual({ type: 'page', lang: 'en', assetPath: '/' })
    expect(routeRequest(request('/privacy/'))).toEqual({ type: 'page', lang: 'en', assetPath: '/privacy/' })
  })

  it('follows the browser language when nobody has chosen', () => {
    expect(routeRequest(request('/', { acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' }))).toEqual({
      type: 'redirect',
      location: '/fr/',
      cookie: undefined,
    })
    expect(routeRequest(request('/privacy', { acceptLanguage: 'zh-TW' }))).toEqual({
      type: 'redirect',
      location: '/zh-hant/privacy/',
      cookie: undefined,
    })
    expect(routeRequest(request('/', { acceptLanguage: 'fr', search: '?utm=newsletter' }))).toEqual({
      type: 'redirect',
      location: '/fr/?utm=newsletter',
      cookie: undefined,
    })
  })

  it('does not redirect crawlers or asset files', () => {
    expect(routeRequest(request('/', { acceptLanguage: 'fr', bot: true }))).toEqual({
      type: 'page',
      lang: 'en',
      assetPath: '/',
    })
    expect(routeRequest(request('/img/icon.webp', { acceptLanguage: 'fr' }))).toEqual({ type: 'asset' })
    expect(routeRequest(request('/styles.css'))).toEqual({ type: 'asset' })
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(false)
  })

  it('remembers an explicit choice and lets a shared language url win', () => {
    expect(routeRequest(request('/', { cookie: 'mimesis_lang=en', acceptLanguage: 'de' }))).toEqual({
      type: 'page',
      lang: 'en',
      assetPath: '/',
    })
    expect(routeRequest(request('/', { cookie: 'mimesis_lang=de', acceptLanguage: 'en' }))).toEqual({
      type: 'redirect',
      location: '/de/',
      cookie: undefined,
    })
    expect(routeRequest(request('/fr/'))).toEqual({ type: 'page', lang: 'fr', assetPath: '/' })
    expect(routeRequest(request('/fr/', { cookie: 'mimesis_lang=en' }))).toEqual({
      type: 'page',
      lang: 'fr',
      assetPath: '/',
    })
  })

  it('canonicalizes the language prefix and the saved choice', () => {
    expect(routeRequest(request('/FR'))).toEqual({ type: 'redirect', location: '/fr/', cookie: undefined })
    expect(routeRequest(request('/en/privacy/'))).toEqual({ type: 'redirect', location: '/privacy/', cookie: undefined })
    expect(routeRequest(request('/fr/', { search: '?choose=1' }))).toEqual({
      type: 'redirect',
      location: '/fr/',
      cookie: 'fr',
    })
    expect(routeRequest(request('/en/', { search: '?choose=1' }))).toEqual({
      type: 'redirect',
      location: '/',
      cookie: 'en',
    })
    expect(routeRequest(request('/ko/privacy/'))).toEqual({ type: 'page', lang: 'ko', assetPath: '/privacy/' })
  })

  it('keeps in-page links inside the language and points videos and stores at it', () => {
    expect(localizeHref('/#how-to-play', 'ja')).toBe('/ja/#how-to-play')
    expect(localizeHref('/privacy/', 'fr')).toBe('/fr/privacy/')
    expect(localizeHref('https://github.com/Cap-go/mimesis', 'fr')).toBe('https://github.com/Cap-go/mimesis')
    expect(videoFor('fr')).toEqual({ src: '/video/mimesis-fr.mp4', poster: '/video/poster-fr.webp' })
    expect(videoFor('ja').src).toBe('/video/mimesis-en.mp4')
    expect(appleUrl('en')).toBe('https://apps.apple.com/app/id1559423136')
    expect(appleUrl('fr')).toBe('https://apps.apple.com/fr/app/id1559423136')
    expect(googleUrl('en')).toBe('https://play.google.com/store/apps/details?id=ee.forgr.mimesis')
    expect(googleUrl('pt')).toBe('https://play.google.com/store/apps/details?id=ee.forgr.mimesis&hl=pt-BR')
  })
})

describe('website copy', () => {
  it('matches the english catalog shipped to the translator', () => {
    expect(extractSiteMessages(`${home}\n${privacy}`)).toEqual(site)
  })

  it('is english by default and links every switcher language', () => {
    expect(home).toContain('<html lang="en"')
    expect(home).toContain('src="/video/mimesis-en.mp4"')
    expect(home).not.toContain('mimesis-fr.mp4')
    for (const lang of SWITCHER_LOCALES) {
      expect(home).toContain(`data-lang="${lang}"`)
      expect(privacy).toContain(`data-lang="${lang}"`)
    }
  })
})
