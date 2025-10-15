import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, publicAnonKey } from '../utils/supabase/info'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, publicAnonKey)

// Database types (you'll need to generate these from your Supabase schema)
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          names: Record<string, string>
          descriptions: Record<string, string>
          image: string
          order: number
          created_at: string
          archived_at?: string | null
        }
        Insert: {
          id?: string
          names: Record<string, string>
          descriptions: Record<string, string>
          image: string
          order?: number
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          names?: Record<string, string>
          descriptions?: Record<string, string>
          image?: string
          order?: number
          created_at?: string
          archived_at?: string | null
        }
      }
      items: {
        Row: {
          id: string
          names: Record<string, string>
          descriptions: Record<string, string>
          prices: Record<string, number>
          image: string
          category_id: string
          variants?: any
          tags?: string[]
          order?: number
          created_at: string
          archived_at?: string | null
        }
        Insert: {
          id?: string
          names: Record<string, string>
          descriptions: Record<string, string>
          prices: Record<string, number>
          image: string
          category_id: string
          variants?: any
          tags?: string[]
          order?: number
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          names?: Record<string, string>
          descriptions?: Record<string, string>
          prices?: Record<string, number>
          image?: string
          category_id?: string
          variants?: any
          tags?: string[]
          order?: number
          created_at?: string
          archived_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          items: any[]
          total: number
          status: 'pending' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          items: any[]
          total: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          items?: any[]
          total?: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
      }
    }
  }
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project-id.supabase.co' && 
         publicAnonKey !== 'your-anon-key-here'
}

// Test connection
export const testSupabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured. Please set up your environment variables.')
    }
    
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    
    if (error) {
      throw error
    }
    
    return { success: true, message: 'Connected to Supabase successfully' }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
