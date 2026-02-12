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
      profiles: {
        Row: {
          id: string
          role: 'trainer' | 'client'
          full_name: string
          payment_status: boolean
          payment_due_date: string | null
          trainer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'trainer' | 'client'
          full_name: string
          payment_status?: boolean
          payment_due_date?: string | null
          trainer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'trainer' | 'client'
          full_name?: string
          payment_status?: boolean
          payment_due_date?: string | null
          trainer_id?: string | null
          created_at?: string
        }
      }
      diet_plans: {
        Row: {
          id: string
          client_id: string
          created_by: string
          meal_name: string
          meal_description: string
          recommended_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          created_by: string
          meal_name: string
          meal_description: string
          recommended_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          created_by?: string
          meal_name?: string
          meal_description?: string
          recommended_time?: string | null
          created_at?: string
        }
      }
      meal_logs: {
        Row: {
          id: string
          client_id: string
          meal_time: string
          meal_description: string
          diet_plan_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          meal_time: string
          meal_description: string
          diet_plan_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          meal_time?: string
          meal_description?: string
          diet_plan_id?: string | null
          created_at?: string
        }
      }
      exercise_logs: {
        Row: {
          id: string
          client_id: string
          exercise_name: string
          duration_minutes: number
          exercise_time: string
          calories_burned: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          exercise_name: string
          duration_minutes: number
          exercise_time: string
          calories_burned?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          exercise_name?: string
          duration_minutes?: number
          exercise_time?: string
          calories_burned?: number
          notes?: string | null
          created_at?: string
        }
      }
      weight_logs: {
        Row: {
          id: string
          client_id: string
          weight_kg: number
          measured_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          weight_kg: number
          measured_at: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          weight_kg?: number
          measured_at?: string
          created_at?: string
        }
      }
      training_plans: {
        Row: {
          id: string
          client_id: string
          created_by: string
          exercise_name: string
          sets: number
          reps: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          created_by: string
          exercise_name: string
          sets: number
          reps: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          created_by?: string
          exercise_name?: string
          sets?: number
          reps?: number
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
