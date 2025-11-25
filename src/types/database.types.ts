export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      mimesis_games: {
        Row: {
          created_at: string | null
          found_guess: number[] | null
          id: number
          lang: number
          mode: number | null
          skip_guess: number[] | null
          team: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          found_guess?: number[] | null
          id?: number
          lang: number
          mode?: number | null
          skip_guess?: number[] | null
          team?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          found_guess?: number[] | null
          id?: number
          lang?: number
          mode?: number | null
          skip_guess?: number[] | null
          team?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mimesis_games_lang_fkey'
            columns: ['lang']
            isOneToOne: false
            referencedRelation: 'mimesis_lang'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mimesis_games_mode_fkey'
            columns: ['mode']
            isOneToOne: false
            referencedRelation: 'mimesis_modes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mimesis_games_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'mimesis_users'
            referencedColumns: ['id']
          },
        ]
      }
      mimesis_guesses: {
        Row: {
          author: string | null
          cover: string | null
          created_at: string | null
          id: number
          lang: number
          mode: number | null
          title: string
          type: string | null
        }
        Insert: {
          author?: string | null
          cover?: string | null
          created_at?: string | null
          id?: number
          lang: number
          mode?: number | null
          title: string
          type?: string | null
        }
        Update: {
          author?: string | null
          cover?: string | null
          created_at?: string | null
          id?: number
          lang?: number
          mode?: number | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mimesis_guesses_lang_fkey'
            columns: ['lang']
            isOneToOne: false
            referencedRelation: 'mimesis_lang'
            referencedColumns: ['id']
          },
        ]
      }
      mimesis_lang: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      mimesis_modes: {
        Row: {
          active: boolean
          created_at: string | null
          icon: string | null
          id: number
          id_android: string | null
          id_ios: string | null
          name: string
          order: number
          status: Database['public']['Enums']['mode_status']
        }
        Insert: {
          active: boolean
          created_at?: string | null
          icon?: string | null
          id?: number
          id_android?: string | null
          id_ios?: string | null
          name: string
          order: number
          status: Database['public']['Enums']['mode_status']
        }
        Update: {
          active?: boolean
          created_at?: string | null
          icon?: string | null
          id?: number
          id_android?: string | null
          id_ios?: string | null
          name?: string
          order?: number
          status?: Database['public']['Enums']['mode_status']
        }
        Relationships: []
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
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mode_status: ['paid', 'free', 'purchased'],
    },
  },
} as const
