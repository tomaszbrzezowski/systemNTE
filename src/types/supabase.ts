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
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          voivodeship: string
          population?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          voivodeship?: string
          population?: number | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
      }
      halls: {
        Row: {
          id: string
          name: string
          address: string
          city_id: string
          seats: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city_id: string
          seats?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city_id?: string
          seats?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      hall_layouts: {
        Row: {
          id: string
          hall_id: string
          layout_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hall_id: string
          layout_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hall_id?: string
          layout_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          address: string
          contact_person: string
          contact_email: string
          contact_phone: string
          notes: string | null
          city_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          contact_person: string
          contact_email: string
          contact_phone: string
          notes?: string | null
          city_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          contact_person?: string
          contact_email?: string
          contact_phone?: string
          notes?: string | null
          city_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          contract_number: string
          season: string
          contract_date: string
          client_id: string
          hall_id: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_number?: string
          season: string
          contract_date: string
          client_id: string
          hall_id: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_number?: string
          season?: string
          contract_date?: string
          client_id?: string
          hall_id?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_performances: {
        Row: {
          id: string
          contract_id: string
          performance_date: string
          performance_time: string
          show_title_id: string
          paid_tickets: number
          unpaid_tickets: number
          teacher_tickets: number
          cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          performance_date: string
          performance_time: string
          show_title_id: string
          paid_tickets: number
          unpaid_tickets: number
          teacher_tickets: number
          cost: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          performance_date?: string
          performance_time?: string
          show_title_id?: string
          paid_tickets?: number
          unpaid_tickets?: number
          teacher_tickets?: number
          cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      show_titles: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
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