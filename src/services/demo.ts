// Screenshot staging. Only active when built with VITE_DEMO=<scene>; tree-shaken otherwise.
import type { Router } from 'vue-router'
import { useCatalogStore } from '~/store/catalog'
import { useGameStore } from '~/store/game'
import { useSettingsStore } from '~/store/settings'
import { push, resetTo } from './navigation'

export const demoScene = import.meta.env.VITE_DEMO as string | undefined

function team(name: string, players: string[], score = 0) {
  return {
    uuid: name,
    name,
    score,
    pastPlayers: [],
    players: players.map(p => ({ uuid: `${name}-${p}`, name: p, score: 0 })),
  }
}

async function waitForCatalog() {
  const catalog = useCatalogStore()
  for (let i = 0; i < 100 && !catalog.themes.length; i++)
    await new Promise(resolve => setTimeout(resolve, 100))
}

export async function stageDemo(router: Router): Promise<void> {
  if (!demoScene)
    return
  const game = useGameStore()
  const settings = useSettingsStore()
  settings.locale = 'fr'
  settings.roundSeconds = 60
  settings.targetScore = 10
  game.teams = [
    team('Les Pingouins', ['Léa', 'Hugo', 'Chloé'], 7),
    team('Les Licornes', ['Jules', 'Manon', 'Arthur'], 5),
  ]
  await router.isReady()
  if (demoScene === 'rules' || demoScene === 'settings')
    return resetTo(`/${demoScene}`, 'none')
  if (demoScene === 'themes')
    return push('/themes')
  if (['handoff', 'playing', 'winner'].includes(demoScene)) {
    await waitForCatalog()
    const catalog = useCatalogStore()
    const theme = demoScene === 'playing' ? 1 : 3
    game.theme = catalog.themes.find(t => t.id === theme)?.id ?? catalog.themes[0].id
    const scores = game.teams.map(t => t.score)
    game.reset()
    game.teams.forEach((t, i) => (t.score = scores[i]))
    game.nextTeam()
    push('/game')
  }
}
