import { mockRandom, resetMockRandom } from 'jest-mock-random'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { randomPlayer, useGameStore } from '../../src/store/game'

describe('gameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mode', () => {
    const game = useGameStore()
    expect(game.mode).toBe(0)
    game.teams[0].players.push(randomPlayer())
    expect(game.mode).toBe(1)
  })

  it('score', () => {
    const game = useGameStore()
    game.nextTeam()
    expect(game.winned).toBe(false)
    expect(game.team?.score).toBe(0)
    game.addScore()
    expect(game.team?.score).toBe(1)
    game.addScore()
    for (let index = 0; index < 9; index++)
      game.addScore()

    expect(game.team?.score).toBe(10)
    expect(game.winned).toBe(true)
    expect(game.ladder[0].uuid).toBe(game.team?.uuid)
    game.resetScore()
    expect(game.winned).toBe(false)
    expect(game.team?.score).toBe(0)
  })

  it('team order', () => {
    const game = useGameStore()
    const uid1 = game.teams[1].uuid
    const uid0 = game.teams[0].uuid
    expect(game.mode).toBe(0)
    expect(game.teamUUID).toBe('-1')
    expect(game.pastTeams).toStrictEqual([])
    mockRandom(0.1)
    game.nextTeam()
    expect(game.teamUUID).toBe(uid1)
    expect(game.pastTeams).toStrictEqual([uid1])
    game.nextTeam()
    expect(game.teamUUID).toBe(uid0)
    expect(game.pastTeams).toStrictEqual([uid1, uid0])
    game.nextTeam()
    expect(game.teamUUID).toBe(uid1)
    expect(game.pastTeams).toStrictEqual([uid1])
    resetMockRandom()
  })
})
