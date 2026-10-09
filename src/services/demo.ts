// Screenshot staging. Only active when built with VITE_DEMO=<scene>; tree-shaken otherwise.
// A demo build also restages from mimesis://demo?scene=<scene>&lang=<locale> (Android) or from the
// "demo" preference ("<scene> <locale>") read at launch (iOS simulators prompt before opening links).
import type { Router } from 'vue-router'
import { App } from '@capacitor/app'
import { useCatalogStore } from '~/store/catalog'
import { useGameStore } from '~/store/game'
import { useSettingsStore } from '~/store/settings'
import { i18n, setLocale } from './i18n'
import { names } from './names'
import { push, refreshChrome, resetTo } from './navigation'
import { getStorage } from './storage'

export const demo = { scene: import.meta.env.VITE_DEMO as string | undefined }

// Public-domain artwork shown on the "playing" screenshot.
export const DEMO_COVER = 'art/6kbee6t0bag'
// Public-domain artworks for the reel: Mona Lisa, Sunflowers, Statue of Liberty, Luncheon on the Grass,
// The Cheat with the Ace of Diamonds.
const REEL_COVERS = [DEMO_COVER, 'art/8kg6v1vrcf4', 'art/g0ngk3yo2g', 'art/d7d3bnjmax', 'art/ln9tb54ihy']

function team(name: string, players: string[], score = 0) {
  return {
    uuid: name,
    name,
    score,
    pastPlayers: [],
    players: players.map(p => ({ uuid: `${name}-${p}`, name: p, score: 0 })),
  }
}

async function stage(router: Router, scene: string, lang: string): Promise<void> {
  demo.scene = scene
  const game = useGameStore()
  const settings = useSettingsStore()
  const catalog = useCatalogStore()
  await setLocale(lang)
  refreshChrome()
  settings.roundSeconds = 60
  settings.targetScore = 10
  // The winner sound makes the iOS simulator show the Dynamic Island in captures.
  settings.sound = false
  settings.onboarded = true
  const { firstNames, teamNames } = names()
  game.teams = [
    team(teamNames[0], firstNames.slice(0, 3), 7),
    team(teamNames[1], firstNames.slice(3, 6), 5),
  ]
  await catalog.load(lang)
  await router.isReady()
  if (scene === 'rules' || scene === 'settings' || scene === 'welcome')
    return resetTo(`/${scene}`, 'none')
  resetTo('/teams', 'none')
  if (scene === 'teams')
    return
  if (scene === 'reel') {
    for (const t of game.teams) {
      t.score = 0
      t.players.pop()
    }
    return void playReel()
  }
  await new Promise(resolve => setTimeout(resolve, 50))
  if (scene === 'themes')
    return push('/themes')
  const theme = scene === 'playing' ? 1 : 3
  game.theme = catalog.themes.find(t => t.id === theme)?.id ?? catalog.themes[0].id
  const scores = game.teams.map(t => t.score)
  game.reset()
  game.teams.forEach((t, i) => (t.score = scores[i]))
  game.nextTeam()
  push('/game')
}

export async function stageDemo(router: Router): Promise<void> {
  if (!demo.scene)
    return
  void App.addListener('appUrlOpen', ({ url }) => {
    const { host, searchParams } = new URL(url)
    if (host === 'demo')
      void stage(router, searchParams.get('scene') ?? 'teams', searchParams.get('lang') ?? 'fr')
  })
  const [scene, lang] = (await getStorage<string>('demo'))?.split(' ') ?? [demo.scene, 'fr']
  await stage(router, scene, lang)
}

// ── Reel: a scripted game played through the real buttons, recorded for the promo videos ──

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function button(label: string, last = false): HTMLButtonElement | undefined {
  const all = [...document.querySelectorAll<HTMLButtonElement>('button')]
    .filter(b => b.textContent?.trim().includes(label) && b.offsetParent)
  return last ? all.at(-1) : all[0]
}

async function press(label: string, last = false): Promise<void> {
  const target = button(label, last)
  target?.classList.add('demo-press')
  await wait(140)
  target?.classList.remove('demo-press')
  target?.click()
}

async function type(input: HTMLInputElement, text: string): Promise<void> {
  input.focus()
  for (const char of text) {
    input.value += char
    input.dispatchEvent(new Event('input'))
    await wait(110)
  }
  input.blur()
}

async function playReel(): Promise<void> {
  const t = i18n.global.t
  const game = useGameStore()
  const settings = useSettingsStore()
  const catalog = useCatalogStore()
  let card = 0
  const nextCard = () => {
    const cover = REEL_COVERS[card++ % REEL_COVERS.length]
    const showcase = catalog.guessesFor(1).find(g => g.cover?.endsWith(cover))
    if (showcase)
      game.guess = showcase
  }

  // Preload the showcase covers so no card flashes empty on camera.
  await Promise.all(catalog.guessesFor(1).filter(g => REEL_COVERS.some(c => g.cover?.endsWith(c))).map(g => new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = resolve
    img.src = g.cover!
  })))
  await wait(1200)
  // Add a third player to the first team.
  await press(t('addPlayer'))
  await wait(250)
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[enterkeyhint="done"]')]
  const empty = inputs.find(input => !input.value)
  if (empty)
    await type(empty, names().firstNames[6])
  await wait(800)
  await press(t('chooseTheme'))
  await wait(1600)
  await press(t('fun.mimesis.art'))
  await wait(1800)
  await press(t('readyCta'))
  // Start close to the goal so four cards win the game.
  const current = game.teams.find(team => team.uuid === game.teamUUID)
  if (current)
    current.score = settings.targetScore - 4
  nextCard()
  await wait(2200)
  for (const action of ['found', 'found', 'pass', 'found'] as const) {
    await press(t(action))
    nextCard()
    await wait(1500)
  }
  await press(t('found'))
}
