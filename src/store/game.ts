import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { faker } from '@faker-js/faker'
import { randomSelect } from '../services/random'
import type { Entity, Player, Team } from '../services/database'
import { useDb } from '../services/database'

faker.setLocale('fr')

export const randomPlayer = (): Player => ({
  score: 0,
  name: faker.name.firstName(),
  uuid: uuidv4(),
})

export const randomTeamName = (): string => faker.color.human()

export const randomTeam = (): Team => ({
  uuid: uuidv4(),
  name: randomTeamName(),
  players: [randomPlayer(), randomPlayer()],
  pastPlayers: [],
  score: 0,
})

// function find by uuid in array
const findByUUID = <Type extends Entity>(
  list: Type[] | undefined,
  uuid: string,
): Type | undefined => {
  if (!list)
    return undefined
  return list.find(item => item.uuid === uuid)
}

const filterListByUUID = (
  list: Player[] | Team[],
  past: string[],
): Player[] | Team[] => {
  const filtered = list.filter((n) => {
    const index
      = past.findIndex((b) => {
        return b === n.uuid
      }) === -1
    return index
  })
  return filtered
}
export const useGameStore = defineStore('game', () => {
  const winned = ref(false)
  const games = ref(0)
  const loading = ref(true)
  const uuid = ref(uuidv4())
  const createdAt = ref(new Date().toISOString())
  const theme = ref(0)
  const teams = ref([randomTeam(), randomTeam()] as Team[])
  const teamUUID = ref('-1')
  const playerUUID = ref('-1')
  const pastTeams = ref([] as string[])
  const skipGuess = ref([] as number[])
  const foundGuess = ref([] as number[])

  const ready = computed((): boolean => {
    return teamUUID.value !== '-1'
  })
  const nextTeams = computed(() => {
    if (teams.value.length === pastTeams.value.length)
      return filterListByUUID(teams.value, [teamUUID.value]) as Team[]
    return filterListByUUID(teams.value, pastTeams.value) as Team[]
  })
  const ladder = computed(() => {
    const sorted = teams.value.sort((a: Team, b: Team) => {
      return a.score > b.score ? -1 : 1
    })
    return sorted
  })
  const team = computed(() => {
    return findByUUID(teams.value, teamUUID.value)
  })
  const nextPlayers = computed(() => {
    if (!team.value)
      return []
    if (team.value.players.length === team.value.pastPlayers.length) {
      return filterListByUUID(team.value.players, [
        playerUUID.value,
      ]) as Player[]
    }
    return filterListByUUID(
      team.value.players,
      team.value.pastPlayers,
    ) as Player[]
  })
  const player = computed(() => {
    return findByUUID(team.value?.players, playerUUID.value)
  })
  const pastGuess = computed(() => {
    return [...skipGuess.value, ...foundGuess.value]
  })
  const teamScore = computed(() => {
    return team.value ? team.value.score : 0
  })
  const teamName = computed(() => {
    return team.value ? team.value.name : ''
  })
  const mode = computed(() => {
    const teamLength = teams.value[0].players.length
    let inequal = false
    teams.value.forEach((t: Team) => {
      inequal = !!(inequal || teamLength !== t.players.length)
    })
    return inequal ? 1 : 0
  })
  const playerName = computed(() => {
    return player.value ? player.value.name : ''
  })
  const nextPlayer = (setLoading = true) => {
    if (!team.value)
      return
    loading.value = setLoading ? true : loading.value
    let plr
    if (mode.value === 1)
      plr = randomSelect<Player>(nextPlayers.value)
    else
      plr = nextPlayers.value.pop() as Player
    playerUUID.value = plr.uuid
    if (team.value.players.length === team.value.pastPlayers.length)
      team.value.pastPlayers.length = 0
    team.value.pastPlayers.push(plr.uuid)
    loading.value = setLoading ? false : loading.value
  }
  const addScore = () => {
    if (team.value && player.value && team.value.score < 10) {
      team.value.score += 1
      player.value.score++
      if (team.value.score >= 10)
        winned.value = true
    }
  }
  const nextTeam = () => {
    loading.value = true
    let newTeam: Team
    if (mode.value === 1)
      newTeam = randomSelect<Team>(nextTeams.value)
    else
      newTeam = nextTeams.value.pop() as Team
    teamUUID.value = newTeam.uuid
    if (pastTeams.value.length === teams.value.length)
      pastTeams.value.length = 0
    pastTeams.value.push(teamUUID.value)
    nextPlayer(false)
    loading.value = false
  }
  const resetScore = () => {
    teams.value.forEach((t: Team) => {
      t.score = 0
    })
    winned.value = false
  }
  const resetHistory = () => {
    teams.value.forEach((t: Team) => {
      t.pastPlayers = []
    })
    pastTeams.value = []
    skipGuess.value = []
    foundGuess.value = []
  }
  const resetIndex = () => {
    playerUUID.value = '-1'
    teamUUID.value = '-1'
  }
  const reset = () => {
    resetScore()
    resetHistory()
    resetIndex()
  }
  const save = async (lang: string) => {
    try {
      const { addGame } = useDb()
      games.value = await addGame(
        lang,
        foundGuess.value,
        skipGuess.value,
        teams.value,
        theme.value,
      )
    }
    catch (e) {
      console.error('Error adding document: ', e)
    }
  }

  return {
    loading,
    uuid,
    createdAt,
    theme,
    teams,
    teamUUID,
    playerUUID,
    pastTeams,
    skipGuess,
    foundGuess,
    winned,
    games,
    ready,
    nextTeams,
    nextTeam,
    ladder,
    nextPlayers,
    team,
    player,
    pastGuess,
    teamScore,
    teamName,
    mode,
    playerName,
    nextPlayer,
    addScore,
    resetScore,
    resetHistory,
    resetIndex,
    reset,
    save,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot))
