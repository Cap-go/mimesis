// import { IAPProductCustom, registerProduct, restore } from './iap'
import { createClient } from '@supabase/supabase-js'
// import { isPlatform } from '@ionic/vue'
import type { Package } from '@capgo/capacitor-purchases'
import type { Database } from '../types/database.types'
// import { findPackage, isPurchased, restore } from './iap'
import { GetDeviceId } from './capacitor'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const useSupabase = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export interface Player {
  uuid: string
  score: number
  name: string
}

export interface Entity {
  uuid: string
}
export interface Mode {
  package?: Package | null
}
export interface Team extends Entity {
  score: number
  name: string
  players: Player[]
  pastPlayers: string[]
}

export interface GuessDb {
  [key: string]: Database['public']['Tables']['mimesis_guesses']['Row'][]
}

export interface Config {
  version: string
  versionPath: string
}

interface Message {
  [key: string]: string
}

export type LangMessage = Message & {
  id: string
  active: boolean
}

export interface LangMessages {
  [key: string]: LangMessage
}

interface UseDatabase {
  getGuessesDb: (themes: Database['public']['Tables']['mimesis_modes']['Row'][], lang: string) => Promise<GuessDb>
  getThemes: () => Promise<Database['public']['Tables']['mimesis_modes']['Row'][]>
  addGame: (
    lang: string,
    foundGuess: number[],
    skipGuess: number[],
    teams: Team[],
    mode: number,
  ) => Promise<number>
}

const getFakeGuesses = (category: number, lang: number) => {
  return [
    { title: `${lang}_${category}_1`, lang: 1, id: 0 },
    { title: `${lang}_${category}_2`, lang: 1, id: 1 },
    { title: `${lang}_${category}_3`, lang: 1, id: 2 },
  ] as Database['public']['Tables']['mimesis_guesses']['Row'][]
}
const fakeThemes: Database['public']['Tables']['mimesis_modes']['Row'][] = [
  {
    active: true,
    created_at: '',
    name: 'fake',
    icon: 'data',
    id_ios: 't1.ios',
    id_android: 't1.android',
    id: 1,
    order: 1,
    status: 'paid',
  },
]

export const useDb = (): UseDatabase => {
  const db = useSupabase()
  const getGuesses = async (mode: number, lang: number) => {
    if (!import.meta.env.VITE_SUPABASE_URL)
      return getFakeGuesses(mode, lang)
    let value: Database['public']['Tables']['mimesis_guesses']['Row'][] = []
    try {
      const snapshot = await db
        .from('mimesis_guesses')
        .select()
        .eq('mode', mode)
        .eq('lang', lang)
      if (snapshot.error)
        throw new Error(snapshot.error.message)
      value = snapshot.data
    }
    catch (err) {
      console.error('initThemes', err)
    }
    return value
  }
  const getGuessesDb = async (
    themes: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)[],
    lang: string,
  ): Promise<GuessDb> => {
    const guessDb = {} as GuessDb
    try {
      for (let index = 0; index < themes.length; index++) {
        const theme = themes[index]
        const guessList = await getGuesses(theme.id, 1)
        guessDb[`${theme.id}_${lang}`] = guessList
      }
    }
    catch (err) {
      console.error('getGuessesDb', err)
      throw new Error(err as never)
    }
    return guessDb
  }
  const getThemes = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL)
      return fakeThemes
    let values: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)[] = []
    try {
      const snapshot = await db
        .from('mimesis_modes')
        .select()
        .eq('active', true)
        .order('order', { ascending: true })
      let pList: Promise<Database['public']['Tables']['mimesis_modes']['Row'] & Mode>[] = []
      // const pInfo: PurchaserInfo | null = null
      // if (isPlatform('capacitor')) {
      //   try {
      //     pInfo = await restore()
      //   }
      //   catch (err) {
      //     console.log('cannot get restore', err)
      //   }
      // }
      if (snapshot.error)
        throw new Error(snapshot.error.message)
      console.log('getThemes')
      pList = await snapshot.data.map(async (theme: (Database['public']['Tables']['mimesis_modes']['Row'] & Mode)) => {
        // if (isPlatform('capacitor')) {
        //   const productId = isPlatform('ios') ? theme.id_ios : theme.id_android
        //   if (!productId)
        //     return theme
        //   Promise.resolve(theme)
        //   const product = await findPackage(productId)
        //   if (!product)
        //     return theme
        //   theme.package = product
        //   const owned = isPurchased(product.identifier, pInfo)
        //   if (product && owned)
        //     theme.status = 'purchased'
        // }
        return theme
      })
      values = await Promise.all(pList)
      // console.log('getThemes', values)
    }
    catch (err) {
      console.error('initThemes', err)
    }
    return values
  }
  const addGame = async (
    lang: string,
    foundGuess: number[],
    skipGuess: number[],
    teams: Team[],
    mode: number,
  ): Promise<number> => {
    const deviceId = await GetDeviceId()
    // find user
    const { data: user, error } = await db
      .from('mimesis_users')
      .select()
      .eq('id', deviceId)
      .single()
    if (!user || error)
      await db.from('mimesis_users').insert({ id: deviceId, games: 1 })
    else
      await db.from('mimesis_users').update({ id: deviceId, games: user.games + 1 }).eq('id', deviceId)
    await db.from('mimesis_games').insert({
      lang: 1,
      mode,
      found_guess: foundGuess,
      skip_guess: skipGuess,
      team: teams as any,
      user_id: deviceId,
    })
    return !user ? 1 : user.games + 1
  }
  return {
    getGuessesDb,
    getThemes,
    addGame,
  }
}
