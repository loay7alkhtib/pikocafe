// Generated Supabase types
// This file should be regenerated when the database schema changes
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts

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
      categories: {
        Row: {
          id: string
          names: Json // { en: string, tr: string, ar: string }
          icon: string
          image: string | null
          order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          names: Json
          icon: string
          image?: string | null
          order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          names?: Json
          icon?: string
          image?: string | null
          order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          names: Json // { en: string, tr: string, ar: string }
          descriptions: Json // { en: string, tr: string, ar: string }
          prices: Json // { en: string, tr: string, ar: string }
          category_id: string | null
          image: string | null
          media_key: string | null
          tags: string[]
          variants: Json | null // Array<{ size: string, price: number }>
          order: number
          archived_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          names: Json
          descriptions?: Json
          prices?: Json
          category_id?: string | null
          image?: string | null
          media_key?: string | null
          tags?: string[]
          variants?: Json | null
          order?: number
          archived_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          names?: Json
          descriptions?: Json
          prices?: Json
          category_id?: string | null
          image?: string | null
          media_key?: string | null
          tags?: string[]
          variants?: Json | null
          order?: number
          archived_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          items: Json // Array<{ id: string, quantity: number, name: string, price: number, size?: string }>
          total: number
          status: 'pending' | 'completed' | 'cancelled'
          customer_info: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          items: Json
          total: number
          status?: 'pending' | 'completed' | 'cancelled'
          customer_info?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          items?: Json
          total?: number
          status?: 'pending' | 'completed' | 'cancelled'
          customer_info?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          id: string
          key: string
          bucket: string
          content_type: string
          size: number
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          bucket: string
          content_type: string
          size: number
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          bucket: string
          content_type?: string
          size?: number
          uploaded_by?: string | null
          created_at?: string
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
      order_status: 'pending' | 'completed' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types with proper typing for JSON fields
export type Category = Omit<Tables<'categories'>, 'names'> & {
  names: LocalizedText
}

export type Item = Omit<Tables<'items'>, 'names' | 'descriptions' | 'prices' | 'variants'> & {
  names: LocalizedText
  descriptions: LocalizedText
  prices: LocalizedText
  variants: ItemVariant[] | null
  price: number // Computed field for backward compatibility
}

export type Order = Omit<Tables<'orders'>, 'items' | 'customer_info'> & {
  items: OrderItem[]
  customer_info: CustomerInfo | null
}

export type Media = Tables<'media'>

// Insert types
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type MediaInsert = Database['public']['Tables']['media']['Insert']

// Update types
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type ItemUpdate = Database['public']['Tables']['items']['Update']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type MediaUpdate = Database['public']['Tables']['media']['Update']

// Typed JSON helpers
export interface LocalizedText {
  en: string
  tr: string
  ar: string
}

export interface ItemVariant {
  size: string
  price: number
}

export interface OrderItem {
  id: string
  quantity: number
  name: string
  price: number
  size?: string
}

export interface CustomerInfo {
  name?: string
  email?: string
  phone?: string
  address?: string
}
