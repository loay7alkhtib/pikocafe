import { projectId, publicAnonKey } from '../utils/supabase/info';
import { saveSession, loadSession, clearSession, hasSession } from './sessionManager';
import { supabase as supabaseClient, isSupabaseConfigured } from './supabaseClient';

// Simple auth state management
let currentSession: { 
  access_token: string; 
  user: { email: string; name?: string; isAdmin?: boolean } 
} | null = null;

// Database types
export interface Category {
  id: string;
  names: { en: string; tr: string; ar: string };
  icon: string;
  image?: string;
  order: number;
  created_at: string;
}

export interface ItemVariant {
  size: string; // e.g., "Small", "Medium", "Large"
  price: number;
}

export interface Item {
  id: string;
  names: { en: string; tr: string; ar: string };
  category_id: string | null;
  price: number; // Base price (used if no variants)
  image: string | null;
  tags: string[];
  variants?: ItemVariant[]; // Optional size variants
  order?: number; // Display order within category
  created_at: string;
  archived_at?: string | null; // When item was archived (null = active)
}

export interface Order {
  id: string;
  items: { 
    id: string; 
    quantity: number; 
    name: string; 
    price: number;
    size?: string; // Optional size variant
  }[];
  total: number;
  status: 'pending' | 'completed';
  created_at: string;
}

// API base URL - use local API routes for better reliability
const API_BASE = '/api';

// Simple cache for categories (5 minutes TTL)
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    // Check cache first
    if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_TTL) {
      return categoriesCache.data;
    }
    
    try {
      let data;
      
      // Use local API route for better reliability
      data = await apiCall('/api/categories');
      
      // Update cache
      categoriesCache = {
        data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },
  
  create: async (data: Omit<Category, 'id' | 'created_at'>) => {
    return apiCall('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: Omit<Category, 'id' | 'created_at'>) => {
    return apiCall(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: string) => {
    return apiCall(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Items API
export const itemsAPI = {
  getAll: (categoryId?: string) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    return apiCall(`/api/items${query}`);
  },
  
  create: (data: Omit<Item, 'id' | 'created_at'>) => {
    return apiCall('/api/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update: (id: string, data: Omit<Item, 'id' | 'created_at'>) => {
    return apiCall(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: (id: string) => {
    return apiCall(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },
  
  archive: async (id: string) => {
    return apiCall(`/items/${id}`, {
      method: 'DELETE',
    });
  },
  
  restore: async (id: string) => {
    return apiCall(`/archive/restore/item/${id}`, {
      method: 'POST',
    });
  },
  
  getArchived: () => {
    return apiCall('/archive/items');
  },
  
  // Permanently delete a single archived item
  deleteArchived: (id: string) => {
    return apiCall(`/archive/item/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Fast server-side bulk deletion of archived items
  deleteArchivedBulk: (ids?: string[]) => {
    return apiCall('/archive/delete-bulk', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
  
  deleteAll: () => {
    throw new Error('Delete all operation not available - this is a read-only demo');
  },
  
  bulkCreate: (items: Omit<Item, 'id' | 'created_at'>[]) => {
    throw new Error('Bulk create operation not available - this is a read-only demo');
  },
};

// Orders API
export const ordersAPI = {
  getAll: () => apiCall('/orders'),
  
  create: (data: { items: any[], total: number }) =>
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, status: 'pending' | 'completed') =>
    apiCall(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Auth API (custom implementation)
export const authAPI = {
  signUp: async (credentials: { email: string; password: string; name: string }) => {
    try {
      console.log('🚀 Calling signup API with:', { email: credentials.email, name: credentials.name });
      console.log('📡 API endpoint:', `${API_BASE}/auth/signup`);
      
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(credentials),
      });

      console.log('📥 Signup response status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('📄 Signup response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed response:', data);
      } catch (e) {
        console.error('❌ Failed to parse response:', e);
        console.error('Raw response was:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        console.error('❌ Signup failed with status:', response.status);
        console.error('❌ Error from server:', data.error);
        console.error('❌ Full error response:', data);
        throw new Error(data.error || `Signup failed (${response.status})`);
      }

      console.log('🎉 Signup successful! Setting session...');
      currentSession = data.session;
      
      // Store session using session manager
      saveSession(data.session);
      
      console.log('✅ Signup complete!');
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Signup exception:', error);
      console.error('💥 Error message:', error.message);
      throw error;
    }
  },

  signInWithPassword: async (credentials: { email: string; password: string }) => {
    console.log('🔐 Attempting login for:', credentials.email);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(credentials),
    });

    console.log('📥 Login response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      console.error('❌ Login failed:', error);
      throw new Error(error.error || 'Invalid credentials');
    }

    const data = await response.json();
    console.log('✅ Login successful!');
    currentSession = data.session;
    
    // Store session using session manager
    saveSession(data.session);
    
    return { data, error: null };
  },

  getSession: async () => {
    // Try to get from memory first
    if (currentSession) {
      console.log('✅ Session found in memory');
      return { data: { session: currentSession }, error: null };
    }

    // Try to load from storage using session manager
    const storedSession = loadSession();
    
    if (storedSession) {
      currentSession = storedSession;
      
      // Try to verify session is still valid (but don't fail if it can't verify)
      try {
        const response = await fetch(`${API_BASE}/auth/session`, {
          headers: {
            'Authorization': `Bearer ${storedSession.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            console.log('✅ Session verified on server');
            currentSession = data.session;
            // Update storage with verified session
            saveSession(data.session);
            return { data: { session: data.session }, error: null };
          } else {
            // Server says session is invalid - clear it
            console.log('❌ Session invalid on server');
            currentSession = null;
            clearSession();
            return { data: { session: null }, error: null };
          }
        } else {
          // Server error - but keep the local session
          console.log('⚠️ Server error during verification, using local session');
          return { data: { session: storedSession }, error: null };
        }
      } catch (verifyError) {
        // If verification request fails, keep using stored session
        console.log('⚠️ Session verification failed (network error), using local session');
        return { data: { session: storedSession }, error: null };
      }
    }

    console.log('❌ No session found');
    return { data: { session: null }, error: null };
  },

  signOut: async () => {
    if (currentSession) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
          },
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }

    currentSession = null;
    clearSession();

    return { error: null };
  },
};

// Export a compatible auth object for backward compatibility
export const supabase = {
  auth: authAPI,
};
