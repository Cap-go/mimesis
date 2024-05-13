import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mockRandom, resetMockRandom } from 'jest-mock-random'
import { useGameStore } from '../../src/store/game'
import { useMainStore } from '../../src/store/main'
import type { GuessDb, LangMessage, LangMessages, Mode } from '../../src/services/database'
import type { definitions } from './../../src/types/supabase'

const langs: LangMessages = {
  fr: {
    id: 'fr',
    active: true,
    hello: 'bonjour',
  } as unknown as LangMessage,
  en: {
    id: 'en',
    active: true,
    hello: 'hello',
  } as unknown as LangMessage,
}

const gGuess = (title: string) => {
  return { lang: 1, id: Number(title), title }
}

const themes: (definitions['mimesis_modes'] & Mode)[] = [
  {
    active: true,
    name: '',
    icon: 'data',
    id: 1,
    id_ios: 't1.ios',
    id_android: 't1.android',
    order: 1,
    status: 'paid',
  },
]

const guessDb: GuessDb = {
  '1_fr': [gGuess('1'), gGuess('2'), gGuess('3')],
  '2_fr': [gGuess('10'), gGuess('20'), gGuess('30')],
}

describe('MainStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('need update', () => {
    const main = useMainStore()
    main.lastUpdate = new Date().toISOString()
    expect(main.needUpdate).toBe(false)
    const yesterday = new Date(new Date().valueOf() - 1000 * 60 * 60 * 24)
    main.lastUpdate = yesterday.toISOString()
    expect(main.needUpdate).toBe(true)
  })

  test('guess order', () => {
    const main = useMainStore()
    main.themes = themes
    main.guessDb = guessDb
    main.langsMessages = langs
    const game = useGameStore()
    game.theme = 2
    expect(main.guess).toStrictEqual({ title: '' })
    expect(game.skipGuess).toStrictEqual([])
    expect(game.foundGuess).toStrictEqual([])
    expect(game.pastGuess).toStrictEqual([])
    mockRandom(0.4)
    main.nextGuess()
    expect(main.guess).toStrictEqual(guessDb['2_fr'][1])
    expect(game.skipGuess).toStrictEqual([])
    expect(game.foundGuess).toStrictEqual([])
    expect(game.pastGuess).toStrictEqual([])
    mockRandom(0.9)
    main.nextGuess(true)
    expect(main.guess).toStrictEqual(guessDb['2_fr'][2])
    expect(game.skipGuess).toStrictEqual([])
    expect(game.foundGuess).toStrictEqual([20])
    expect(game.pastGuess).toStrictEqual([20])
    mockRandom(0.9)
    main.nextGuess()
    expect(main.guess).toStrictEqual(guessDb['2_fr'][0])
    expect(game.skipGuess).toStrictEqual([30])
    expect(game.foundGuess).toStrictEqual([20])
    expect(game.pastGuess).toStrictEqual([30, 20])
    mockRandom(0.9)
    main.nextGuess()
    expect(main.guess).toStrictEqual(guessDb['2_fr'][2])
    expect(game.skipGuess).toStrictEqual([10])
    expect(game.foundGuess).toStrictEqual([20])
    expect(game.pastGuess).toStrictEqual([10, 20])
    mockRandom(0.9)
    main.nextGuess()
    expect(main.guess).toStrictEqual(guessDb['2_fr'][0])
    expect(game.skipGuess).toStrictEqual([30])
    expect(game.foundGuess).toStrictEqual([20])
    expect(game.pastGuess).toStrictEqual([30, 20])
    mockRandom(0.9)
    main.nextGuess(true)
    expect(game.skipGuess).toStrictEqual([])
    expect(main.guess).toStrictEqual(guessDb['2_fr'][2])
    expect(game.foundGuess).toStrictEqual([20, 10])
    expect(game.pastGuess).toStrictEqual([20, 10])
    mockRandom(0.1)
    main.nextGuess(true)
    expect(main.guess).toStrictEqual({ title: 'Error' })
    expect(game.skipGuess).toStrictEqual([])
    expect(game.foundGuess).toStrictEqual([20, 10, 30])
    expect(game.pastGuess).toStrictEqual([20, 10, 30])
    resetMockRandom()
  })
})
