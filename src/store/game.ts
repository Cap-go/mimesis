import type { Guess } from '~/services/api'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import { randomFirstName, randomTeamName } from '~/services/names'
import { randomSelect } from '~/services/random'

export interface Player {
  uuid: string
  score: number
  name: string
}

export interface Team {
  uuid: string
  score: number
  name: string
  players: Player[]
  pastPlayers: string[]
}

export const TEAM_COLORS = ['#B5244F', '#2563EB', '#059669', '#7C3AED', '#D97706', '#0891B2', '#DB2777', '#4D7C0F']

export function randomPlayer(): Player {
  return { score: 0, name: randomFirstName(), uuid: uuidv4() }
}

export function randomTeam(taken: string[] = []): Team {
  return {
    uuid: uuidv4(),
    name: randomTeamName(taken),
    players: [randomPlayer(), randomPlayer()],
    pastPlayers: [],
    score: 0,
  }
}

function notIn<T extends { uuid: string }>(list: T[], past: string[]): T[] {
  return list.filter(item => !past.includes(item.uuid))
}

export const useGameStore = defineStore('game', () => {
  const first = randomTeam()
  const teams = ref<Team[]>([first, randomTeam([first.name])])
  const theme = ref(0)
  const teamUUID = ref('-1')
  const playerUUID = ref('-1')
  const pastTeams = ref<string[]>([])
  const skipGuess = ref<number[]>([])
  const foundGuess = ref<number[]>([])
  const guess = ref<Guess | null>(null)
  const winned = ref(false)

  // Unequal teams make the turn order random to stay fair.
  const mode = computed(() => {
    const size = teams.value[0]?.players.length ?? 0
    return teams.value.some(t => t.players.length !== size) ? 1 : 0
  })
  const team = computed(() => teams.value.find(t => t.uuid === teamUUID.value))
  const player = computed(() => team.value?.players.find(p => p.uuid === playerUUID.value))
  const teamName = computed(() => team.value?.name ?? '')
  const playerName = computed(() => player.value?.name ?? '')
  const teamScore = computed(() => team.value?.score ?? 0)
  const pastGuess = computed(() => [...skipGuess.value, ...foundGuess.value])
  const ladder = computed(() => [...teams.value].sort((a, b) => b.score - a.score))
  const canStart = computed(() => teams.value.length >= 2 && teams.value.every(t => t.players.length >= 2))

  const nextTeams = computed(() => {
    if (teams.value.length === pastTeams.value.length)
      return notIn(teams.value, [teamUUID.value])
    return notIn(teams.value, pastTeams.value)
  })
  const nextPlayers = computed(() => {
    if (!team.value)
      return []
    if (team.value.players.length === team.value.pastPlayers.length)
      return notIn(team.value.players, [playerUUID.value])
    return notIn(team.value.players, team.value.pastPlayers)
  })

  function addTeam() {
    teams.value.push(randomTeam(teams.value.map(t => t.name)))
  }
  function removeTeam(uuid: string) {
    if (teams.value.length > 2)
      teams.value = teams.value.filter(t => t.uuid !== uuid)
  }
  function addPlayer(t: Team) {
    t.players.push(randomPlayer())
  }
  function removePlayer(t: Team, uuid: string) {
    if (t.players.length > 2)
      t.players = t.players.filter(p => p.uuid !== uuid)
  }

  function nextPlayer() {
    if (!team.value)
      return
    const candidates = nextPlayers.value
    const next = mode.value === 1 ? randomSelect(candidates) : candidates[candidates.length - 1]
    playerUUID.value = next.uuid
    if (team.value.players.length === team.value.pastPlayers.length)
      team.value.pastPlayers.length = 0
    team.value.pastPlayers.push(next.uuid)
  }

  function nextTeam() {
    const candidates = nextTeams.value
    const next = mode.value === 1 ? randomSelect(candidates) : candidates[candidates.length - 1]
    teamUUID.value = next.uuid
    if (pastTeams.value.length === teams.value.length)
      pastTeams.value.length = 0
    pastTeams.value.push(next.uuid)
    nextPlayer()
  }

  function nextGuess(pool: Guess[], found = false) {
    if (guess.value)
      (found ? foundGuess : skipGuess).value.push(guess.value.id)
    // Once every card was seen, recycle skipped cards but never repeat the last one.
    if (pastGuess.value.length >= pool.length)
      skipGuess.value = skipGuess.value.slice(-1)
    const remaining = pool.filter(g => !pastGuess.value.includes(g.id))
    guess.value = randomSelect(remaining.length ? remaining : pool) ?? null
  }

  function addScore(target: number) {
    if (!team.value || !player.value || team.value.score >= target)
      return
    team.value.score++
    player.value.score++
    if (team.value.score >= target)
      winned.value = true
  }

  function resetScore() {
    for (const t of teams.value) {
      t.score = 0
      for (const p of t.players)
        p.score = 0
    }
    winned.value = false
  }

  function reset() {
    resetScore()
    for (const t of teams.value)
      t.pastPlayers = []
    pastTeams.value = []
    skipGuess.value = []
    foundGuess.value = []
    guess.value = null
    playerUUID.value = '-1'
    teamUUID.value = '-1'
  }

  return {
    teams,
    theme,
    teamUUID,
    playerUUID,
    pastTeams,
    skipGuess,
    foundGuess,
    guess,
    winned,
    mode,
    team,
    player,
    teamName,
    playerName,
    teamScore,
    pastGuess,
    ladder,
    canStart,
    addTeam,
    removeTeam,
    addPlayer,
    removePlayer,
    nextTeam,
    nextPlayer,
    nextGuess,
    addScore,
    resetScore,
    reset,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot))
