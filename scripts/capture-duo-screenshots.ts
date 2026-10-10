// Captures raw iPhone Duo screenshots (outer 1398×2034, inner 2007×2853) for every listing locale
// from the demo web build, rendered at the Duo's point sizes at 3x. Xcode's iPhone Duo simulator
// can't switch poses from the command line, so the web build stands in for both displays.
//   VITE_DEMO=teams bunx vite --port 3334
//   bun scripts/capture-duo-screenshots.ts <raw-dir>
// Then frame them with: bun scripts/compose-screenshots.ts <raw-dir>
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const rawDir = resolve(process.argv[2] ?? 'store/raw')
const url = process.env.DEMO_URL ?? 'http://localhost:3334/'
const locales = await Bun.file(resolve(import.meta.dir, '../store/locales.json')).json() as Record<string, { app: string }>
const scenes = ['playing', 'teams', 'themes', 'handoff', 'winner', 'rules']
const displays = { 'duo-outer': { width: 466, height: 678 }, 'duo-inner': { width: 669, height: 951 } }

const browser = await chromium.launch()
for (const [locale, { app }] of Object.entries(locales)) {
  if (!app)
    throw new Error(`store/locales.json: ${locale} has no app language`)
  for (const [name, viewport] of Object.entries(displays)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: app })
    await mkdir(`${rawDir}/${locale}/${name}`, { recursive: true })
    for (const scene of scenes) {
      const page = await context.newPage()
      await page.addInitScript(value => localStorage.setItem('CapacitorStorage.demo', value), `${scene} ${app}`)
      await page.goto(url)
      // Wait for translations, fonts and covers, then let entrance animations settle.
      await page.waitForFunction(() => document.documentElement.lang !== '' && document.fonts.status === 'loaded' && [...document.images].every(img => img.complete))
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${rawDir}/${locale}/${name}/${scene}.png` })
      await page.close()
    }
    await context.close()
    console.log(locale, name)
  }
}
await browser.close()
