// Frames raw device captures into store-ready marketing screenshots.
// Raw captures come from the simulators/emulator with a VITE_DEMO=<scene> build:
//   bun scripts/compose-screenshots.ts <raw-dir>
// where <raw-dir> holds iphone/, ipad/ and android/ folders of <scene>.png files.
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const rawDir = resolve(process.argv[2] ?? 'store/raw')
const outDir = resolve(import.meta.dir, '../store/screenshots')

const scenes = [
  { id: 'playing', title: 'Mime, ils devinent !', subtitle: 'Des centaines de cartes à mimer.' },
  { id: 'teams', title: 'Tes équipes en 10 secondes', subtitle: 'Ajoute tes amis, on s\'occupe du reste.' },
  { id: 'themes', title: 'Choisis ton thème', subtitle: 'Expressions, rébus, films, chansons…' },
  { id: 'handoff', title: 'À qui le tour ?', subtitle: 'Le jeu désigne le prochain mimeur.' },
  { id: 'winner', title: 'Que la meilleure équipe gagne', subtitle: 'Scores, chrono et fous rires garantis.' },
  { id: 'rules', title: 'Des règles simples', subtitle: 'Un téléphone, des amis, zéro parole.' },
]

const targets = [
  { id: 'ios-6.9', raw: 'iphone', width: 1320, height: 2868, radius: 90, deviceWidth: 0.86 },
  { id: 'ipad-13', raw: 'ipad', width: 2064, height: 2752, radius: 50, deviceWidth: 0.86 },
  { id: 'android-phone', raw: 'android', width: 1080, height: 1920, radius: 44, deviceWidth: 0.86 },
]

function html(scene: typeof scenes[number], target: typeof targets[number], image: string) {
  const unit = target.width / 100
  return `<!doctype html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Nunito:wght@700&display=block');
    * { margin: 0; box-sizing: border-box; }
    body {
      width: ${target.width}px; height: ${target.height}px; overflow: hidden;
      background: radial-gradient(120% 55% at 50% 0%, #fbb079 0%, transparent 65%), linear-gradient(180deg, #f39a55 0%, #e67f3c 50%, #b5244f 140%);
      display: flex; flex-direction: column; align-items: center;
      font-family: 'Nunito', sans-serif; color: #3b0a1f;
    }
    header { padding: ${unit * 9}px ${unit * 7}px ${unit * 5}px; text-align: center; }
    h1 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${unit * 8.6}px; line-height: 1.02; letter-spacing: -0.02em; }
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
for (const target of targets) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } })
  await mkdir(`${outDir}/${target.id}`, { recursive: true })
  let index = 0
  for (const scene of scenes) {
    const file = Bun.file(`${rawDir}/${target.raw}/${scene.id}.png`)
    if (!(await file.exists()))
      continue
    const image = `data:image/png;base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`
    await page.setContent(html(scene, target, image), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    index++
    const path = `${outDir}/${target.id}/${String(index).padStart(2, '0')}-${scene.id}.jpg`
    await page.screenshot({ path, type: 'jpeg', quality: 88 })
    console.log(path)
  }
  await page.close()
}
await browser.close()
