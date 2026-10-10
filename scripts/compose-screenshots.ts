// Frames raw device captures into store-ready marketing screenshots.
// Raw captures come from the simulators/emulator with a VITE_DEMO build (see scripts/capture-screenshots.ts):
//   bun scripts/compose-screenshots.ts <raw-dir>
// where <raw-dir> holds <store-locale>/{iphone,ipad,android}/<scene>.png files.
// Captions come from store/listing/<store-locale>.json. Also renders the Play feature graphic
// (store/play/<store-locale>/feature-graphic.png) from the iPhone hand-off capture.
import { Buffer } from 'node:buffer'
import { mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const rawDir = resolve(process.argv[2] ?? 'store/raw')
const outDir = resolve(import.meta.dir, '../store/screenshots')
const listingDir = resolve(import.meta.dir, '../store/listing')

interface Scene { id: string, title: string, subtitle: string }
interface Listing { screenshots: Scene[], featureTagline: string }

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Nunito:wght@700&display=block');`
const CJK = `'Hiragino Sans', 'PingFang SC'`
const dataUrl = async (path: string) => `data:image/png;base64,${Buffer.from(await Bun.file(path).arrayBuffer()).toString('base64')}`
const icon = await dataUrl(resolve(import.meta.dir, '../assets/icon-only.png'))

function featureHtml(tagline: string, image: string) {
  return `<!doctype html><html><head><style>
    ${FONTS}
    * { margin: 0; box-sizing: border-box; }
    body {
      width: 1024px; height: 500px; overflow: hidden; font-family: Nunito, ${CJK}, sans-serif; color: #3b0a1f;
      background: radial-gradient(90% 90% at 15% 0%, #fbb079 0%, transparent 60%), linear-gradient(135deg, #f39a55 0%, #e67f3c 55%, #c2452f 100%);
      display: flex; align-items: center; padding: 0 56px; gap: 40px; position: relative;
    }
    .icon { width: 132px; height: 132px; border-radius: 30px; box-shadow: 0 18px 40px rgb(59 10 31 / .35); }
    h1 { font-family: 'Bricolage Grotesque', ${CJK}; font-weight: 800; font-size: 82px; line-height: .95; letter-spacing: -.02em; }
    p { font-size: 28px; font-weight: 700; margin-top: 14px; opacity: .85; max-width: 420px; }
    .phone { position: absolute; right: 48px; top: 46px; width: 236px; border-radius: 34px; border: 8px solid #3b0a1f; box-shadow: 0 24px 60px rgb(59 10 31 / .45); transform: rotate(6deg); }
  </style></head><body>
    <img class="icon" src="${icon}">
    <div><h1>Mimesis</h1><p>${tagline}</p></div>
    <img class="phone" src="${image}">
  </body></html>`
}

const targets = [
  { id: 'ios-6.9', raw: 'iphone', width: 1320, height: 2868, radius: 90, deviceWidth: 0.86 },
  { id: 'ipad-13', raw: 'ipad', width: 2064, height: 2752, radius: 50, deviceWidth: 0.86 },
  { id: 'android-phone', raw: 'android', width: 1080, height: 1920, radius: 44, deviceWidth: 0.86 },
  // iPhone Duo: outer (closed) and inner (open) displays, from scripts/capture-duo-screenshots.ts.
  { id: 'iphone-duo-outer', raw: 'duo-outer', width: 1398, height: 2034, radius: 70, deviceWidth: 0.82 },
  { id: 'iphone-duo-inner', raw: 'duo-inner', width: 2007, height: 2853, radius: 80, deviceWidth: 0.84 },
]

function html(scene: Scene, target: typeof targets[number], image: string) {
  const unit = target.width / 100
  return `<!doctype html><html><head><style>
    ${FONTS}
    * { margin: 0; box-sizing: border-box; }
    body {
      width: ${target.width}px; height: ${target.height}px; overflow: hidden;
      background: radial-gradient(120% 55% at 50% 0%, #fbb079 0%, transparent 65%), linear-gradient(180deg, #f39a55 0%, #e67f3c 50%, #b5244f 140%);
      display: flex; flex-direction: column; align-items: center;
      font-family: 'Nunito', ${CJK}, sans-serif; color: #3b0a1f;
    }
    header { padding: ${unit * 9}px ${unit * 7}px ${unit * 5}px; text-align: center; }
    h1 { font-family: 'Bricolage Grotesque', ${CJK}, sans-serif; font-weight: 800; font-size: ${unit * 8.6}px; line-height: 1.02; letter-spacing: -0.02em; }
    p { margin-top: ${unit * 2.2}px; font-size: ${unit * 3.9}px; font-weight: 700; opacity: 0.8; }
    .stage { flex: 1; min-height: 0; width: 100%; display: flex; justify-content: center; align-items: flex-start; padding-bottom: ${unit * 6}px; }
    img {
      max-width: ${target.deviceWidth * 100}%; max-height: 100%;
      border-radius: ${target.radius}px; border: ${unit * 1.2}px solid #3b0a1f;
      box-shadow: 0 ${unit * 3}px ${unit * 8}px rgb(59 10 31 / 0.45);
    }
  </style></head><body>
    <header><h1>${scene.title}</h1><p>${scene.subtitle}</p></header>
    <div class="stage"><img src="${image}"></div>
  </body></html>`
}

const browser = await chromium.launch()
const rawLocales = (await readdir(rawDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name).sort()
for (const locale of rawLocales) {
  const { screenshots: scenes, featureTagline } = await Bun.file(`${listingDir}/${locale}.json`).json() as Listing
  for (const target of targets) {
    const page = await browser.newPage({ viewport: { width: target.width, height: target.height } })
    const dir = `${outDir}/${locale}/${target.id}`
    await mkdir(dir, { recursive: true })
    let index = 0
    for (const scene of scenes) {
      const file = Bun.file(`${rawDir}/${locale}/${target.raw}/${scene.id}.png`)
      if (!(await file.exists()))
        continue
      const image = await dataUrl(file.name!)
      await page.setContent(html(scene, target, image), { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      index++
      const path = `${dir}/${String(index).padStart(2, '0')}-${scene.id}.jpg`
      await page.screenshot({ path, type: 'jpeg', quality: 88 })
      console.log(path)
    }
    await page.close()
  }
  const handoff = `${rawDir}/${locale}/iphone/handoff.png`
  if (featureTagline && await Bun.file(handoff).exists()) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 500 } })
    await page.setContent(featureHtml(featureTagline, await dataUrl(handoff)), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const path = resolve(import.meta.dir, `../store/play/${locale}/feature-graphic.png`)
    await mkdir(resolve(path, '..'), { recursive: true })
    await page.screenshot({ path })
    console.log(path)
    await page.close()
  }
}
await browser.close()
