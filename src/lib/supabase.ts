import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Category, Item, Order, Media, ItemVariant, OrderItem, CustomerInfo } from '../types/supabase';
import { env } from './env';

// Type-safe Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

// Client factory for browser (anonymous access)
export function createBrowserClient(): TypedSupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserClient can only be used in the browser');
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'piko-cafe-browser',
      },
    },
  });
}

// Client factory for server (service role - full access)
export function createServerClient(): TypedSupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServerClient can only be used on the server');
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'piko-cafe-server',
      },
    },
  });
}

// Client factory for server with user session (RPC calls)
export function createServerClientWithAuth(accessToken: string): TypedSupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServerClientWithAuth can only be used on the server');
  }

  const client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'piko-cafe-server-auth',
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  });

  return client;
}

// Singleton instances (created lazily)
let browserClient: TypedSupabaseClient | null = null;
let serverClient: TypedSupabaseClient | null = null;

// Get browser client (singleton)
export function getBrowserClient(): TypedSupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be used in the browser');
  }

  if (!browserClient) {
    browserClient = createBrowserClient();
  }

  return browserClient;
}

// Get server client (singleton)
export function getServerClient(): TypedSupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient can only be used on the server');
  }

  if (!serverClient) {
    serverClient = createServerClient();
  }

  return serverClient;
}

// Legacy compatibility - will be removed
export const supabase = typeof window !== 'undefined' ? getBrowserClient() : null;

// Database operation helpers with proper typing
export class DatabaseService {
  private client: TypedSupabaseClient;

  constructor(client: TypedSupabaseClient) {
    this.client = client;
  }

  // Categories
  async getCategories() {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getCategory(id: string) {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCategory(category: Database['public']['Tables']['categories']['Insert']) {
    const { data, error } = await this.client
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, updates: Database['public']['Tables']['categories']['Update']) {
    const { data, error } = await this.client
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string) {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Items
  async getItems(categoryId?: string, includeArchived = false) {
    let query = this.client
      .from('items')
      .select('*')
      .order('order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getItem(id: string) {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createItem(item: Database['public']['Tables']['items']['Insert']) {
    const { data, error } = await this.client
      .from('items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(id: string, updates: Database['public']['Tables']['items']['Update']) {
    const { data, error } = await this.client
      .from('items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteItem(id: string) {
    const { error } = await this.client
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async archiveItem(id: string) {
    const { data, error } = await this.client
      .from('items')
      .update({ 
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Orders
  async getOrders() {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createOrder(order: Database['public']['Tables']['orders']['Insert']) {
    const { data, error } = await this.client
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOrder(id: string, updates: Database['public']['Tables']['orders']['Update']) {
    const { data, error } = await this.client
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Media
  async createMedia(media: Database['public']['Tables']['media']['Insert']) {
    const { data, error } = await this.client
      .from('media')
      .insert(media)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMediaByKey(key: string) {
    const { data, error } = await this.client
      .from('media')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  }
}

// Convenience functions
export function getBrowserDatabaseService(): DatabaseService {
  return new DatabaseService(getBrowserClient());
}

export function getServerDatabaseService(): DatabaseService {
  return new DatabaseService(getServerClient());
}

// Export types for use in other modules
export type { Category, Item, Order, Media, ItemVariant, OrderItem, CustomerInfo };

// Export API instances
export { categoriesAPI, itemsAPI, ordersAPI, authAPI } from './apis';