export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'administrator' | 'supervisor' | 'organizator'
          active: boolean
          created_at: string
          assigned_city_ids: string[]
          supervisor_id: string | null
          organizer_ids: string[]
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'administrator' | 'supervisor' | 'organizator'
          active?: boolean
          created_at?: string
          assigned_city_ids?: string[]
          supervisor_id?: string | null
          organizer_ids?: string[]
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'administrator' | 'supervisor' | 'organizator'
          active?: boolean
          created_at?: string
          assigned_city_ids?: string[]
          supervisor_id?: string | null
          organizer_ids?: string[]
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          voivodeship: string
          population: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          voivodeship: string
          population?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          voivodeship?: string
          population?: number | null
          created_at?: string
        }
      }
      calendars: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string
          order: number
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by: string
          order?: number
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string
          order?: number
        }
      }
      calendar_events: {
        Row: {
          id: string
          calendar_id: string
          date: string
          user_id: string | null
          city_id: string | null
          status: string
          previous_user_id: string | null
          to_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          calendar_id: string
          date: string
          user_id?: string | null
          city_id?: string | null
          status: string
          previous_user_id?: string | null
          to_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          calendar_id?: string
          date?: string
          user_id?: string | null
          city_id?: string | null
          status?: string
          previous_user_id?: string | null
          to_user_id?: string | null
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
  }
}