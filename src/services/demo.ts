// Screenshot staging. Only active when built with VITE_DEMO=<scene>; tree-shaken otherwise.
// A demo build also restages from mimesis://demo?scene=<scene>&lang=<locale> (Android) or from the
// "demo" preference ("<scene> <locale>") read at launch (iOS simulators prompt before opening links).
import type { Router } from 'vue-router'
import { App } from '@capacitor/app'
import { useCatalogStore } from '~/store/catalog'
import { useGameStore } from '~/store/game'
import { useSettingsStore } from '~/store/settings'
import { setLocale } from './i18n'
import { names } from './names'
import { push, refreshChrome, resetTo } from './navigation'
import { getStorage } from './storage'

export const demo = { scene: import.meta.env.VITE_DEMO as string | undefined }

// Public-domain artwork shown on the "playing" screenshot.
export const DEMO_COVER = 'art/6kbee6t0bag'

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
  settings.locale = lang
  setLocale(lang)
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
