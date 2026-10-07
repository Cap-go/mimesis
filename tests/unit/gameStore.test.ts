import type { Guess } from '../../src/services/api'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomPlayer, useGameStore } from '../../src/store/game'

function guesses(count: number): Guess[] {
  return Array.from({ length: count }, (_, id) => ({ id, mode: 1, title: `g${id}`, author: null, type: null, cover: null }))
}

describe('game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('detects unequal teams', () => {
    const game = useGameStore()
    expect(game.mode).toBe(0)
    game.teams[0].players.push(randomPlayer())
    expect(game.mode).toBe(1)
  })

  it('wins at the target score', () => {
    const game = useGameStore()
    game.nextTeam()
    for (let i = 0; i < 4; i++)
      game.addScore(5)
    expect(game.winned).toBe(false)
    game.addScore(5)
    expect(game.teamScore).toBe(5)
    expect(game.winned).toBe(true)
    game.addScore(5)
    expect(game.teamScore).toBe(5)
    expect(game.ladder[0].uuid).toBe(game.teamUUID)
    game.resetScore()
    expect(game.winned).toBe(false)
    expect(game.teamScore).toBe(0)
  })

  it('alternates teams in order', () => {
    const game = useGameStore()
    const [first, second] = game.teams.map(t => t.uuid)
    game.nextTeam()
    expect(game.teamUUID).toBe(second)
    game.nextTeam()
    expect(game.teamUUID).toBe(first)
    game.nextTeam()
    expect(game.teamUUID).toBe(second)
    expect(game.pastTeams).toStrictEqual([second])
  })

  it('alternates players inside a team', () => {
    const game = useGameStore()
    game.nextTeam()
    const firstPlayer = game.playerUUID
    game.nextTeam()
    game.nextTeam()
    expect(game.playerUUID).not.toBe(firstPlayer)
  })

  it('never repeats a card until the deck is exhausted', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = useGameStore()
    const pool = guesses(3)
    const seen = new Set<number>()
    for (let i = 0; i < 3; i++) {
      game.nextGuess(pool, i % 2 === 0)
      seen.add(game.guess!.id)
    }
    expect(seen.size).toBe(3)
    game.nextGuess(pool)
    expect(game.guess).not.toBeNull()
    expect(game.foundGuess.length + game.skipGuess.length).toBeLessThanOrEqual(3)
  })

  it('keeps at least two teams and two players', () => {
    const game = useGameStore()
    game.removeTeam(game.teams[0].uuid)
    expect(game.teams).toHaveLength(2)
    game.removePlayer(game.teams[0], game.teams[0].players[0].uuid)
    expect(game.teams[0].players).toHaveLength(2)
    expect(game.canStart).toBe(true)
  })
})
