export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      mimesis_games: {
        Row: {
          id: number
          created_at: string | null
          user_id: string | null
          lang: number
          team: Json
          mode: number | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          user_id?: string | null
          lang: number
          team?: Json
          mode?: number | null
        }
        Update: {
          id?: number
          created_at?: string | null
          user_id?: string | null
          lang?: number
          team?: Json
          mode?: number | null
        }
      }
      mimesis_guesses: {
        Row: {
          id: number
          created_at: string | null
          lang: number
          mode: number | null
          author: string | null
          cover: string | null
          title: string
          type: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          lang: number
          mode?: number | null
          author?: string | null
          cover?: string | null
          title: string
          type?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          lang?: number
          mode?: number | null
          author?: string | null
          cover?: string | null
          title?: string
          type?: string | null
        }
      }
      mimesis_lang: {
        Row: {
          id: number
          created_at: string | null
          name: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          name?: string | null
        }
      }
      mimesis_modes: {
        Row: {
          id: number
          created_at: string | null
          id_ios: string | null
          id_android: string | null
          active: boolean
          order: number
          status: Database['public']['Enums']['mode_status']
          name: string
          icon: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          id_ios?: string | null
          id_android?: string | null
          active: boolean
          order: number
          status: Database['public']['Enums']['mode_status']
          name: string
          icon?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          id_ios?: string | null
          id_android?: string | null
          active?: boolean
          order?: number
          status?: Database['public']['Enums']['mode_status']
          name?: string
          icon?: string | null
        }
      }
      mimesis_users: {
        Row: {
          created_at: string | null
          games: number
          id: string
        }
        Insert: {
          created_at?: string | null
          games?: number
          id: string
        }
        Update: {
          created_at?: string | null
          games?: number
          id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      mode_status: 'paid' | 'free' | 'purchased'
    }
  }
}
