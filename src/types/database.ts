export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      households: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }
      household_memberships: {
        Row: {
          id: string
          user_id: string
          household_id: string
          role: 'owner' | 'member'
          color: string
          display_name: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          role?: 'owner' | 'member'
          color: string
          display_name: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          role?: 'owner' | 'member'
          color?: string
          display_name?: string
          joined_at?: string
        }
        Relationships: []
      }
      chores: {
        Row: {
          id: string
          household_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          assignee_id: string | null
          due_date: string
          due_time: string | null
          recurrence_rule: string | null
          completed: boolean
          completed_date: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          assignee_id?: string | null
          due_date: string
          due_time?: string | null
          recurrence_rule?: string | null
          completed?: boolean
          completed_date?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          assignee_id?: string | null
          due_date?: string
          due_time?: string | null
          recurrence_rule?: string | null
          completed?: boolean
          completed_date?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      chore_completions: {
        Row: {
          id: string
          chore_id: string
          instance_date: string
          completed_by: string
          completed_at: string
        }
        Insert: {
          id?: string
          chore_id: string
          instance_date: string
          completed_by: string
          completed_at?: string
        }
        Update: {
          id?: string
          chore_id?: string
          instance_date?: string
          completed_by?: string
          completed_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Household = Database['public']['Tables']['households']['Row']
export type HouseholdMembership = Database['public']['Tables']['household_memberships']['Row']
export type DbChore = Database['public']['Tables']['chores']['Row']
export type ChoreCompletion = Database['public']['Tables']['chore_completions']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type HouseholdInsert = Database['public']['Tables']['households']['Insert']
export type HouseholdMembershipInsert = Database['public']['Tables']['household_memberships']['Insert']
export type DbChoreInsert = Database['public']['Tables']['chores']['Insert']
export type ChoreCompletionInsert = Database['public']['Tables']['chore_completions']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type HouseholdUpdate = Database['public']['Tables']['households']['Update']
export type HouseholdMembershipUpdate = Database['public']['Tables']['household_memberships']['Update']
export type DbChoreUpdate = Database['public']['Tables']['chores']['Update']
export type ChoreCompletionUpdate = Database['public']['Tables']['chore_completions']['Update']
