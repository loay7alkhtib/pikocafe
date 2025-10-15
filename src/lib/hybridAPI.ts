// Hybrid API - Tries Supabase first, falls back to local storage
import { categoriesAPI, itemsAPI, Category, Item } from './supabase';
import {
  getLocalCategories,
  createLocalCategory,
  updateLocalCategory,
  deleteLocalCategory,
  getLocalItems,
  createLocalItem,
  updateLocalItem,
  deleteLocalItem,
  LocalCategory,
  LocalItem,
} from './localStorage';

// Convert between local and API formats
const convertLocalCategoryToAPI = (local: LocalCategory): Category => ({
  id: local.id,
  names: {
    en: local.nameEn,
    tr: local.nameTr,
    ar: local.nameAr,
  },
  image: local.image || null,
  icon: local.icon,
  order: local.order,
  created_at: local.created_at,
});

const convertAPICategoryToLocal = (api: Category): LocalCategory => ({
  id: api.id,
  nameEn: api.names.en,
  nameTr: api.names.tr,
  nameAr: api.names.ar,
  image: api.image || undefined,
  icon: api.icon,
  order: api.order,
  created_at: api.created_at,
});

const convertLocalItemToAPI = (local: LocalItem): Item => ({
  id: local.id,
  names: local.names,
  prices: local.prices,
  descriptions: local.descriptions,
  category_id: local.categoryId || null,
  image: local.image || null,
  tags: local.tags,
  variants: local.variants || undefined,
  order: local.order,
  created_at: local.created_at,
});

const convertAPIItemToLocal = (api: Item): LocalItem => ({
  id: api.id,
  names: api.names,
  prices: api.prices,
  descriptions: api.descriptions,
  categoryId: api.category_id || undefined,
  image: api.image || undefined,
  tags: api.tags,
  variants: api.variants || undefined,
  order: api.order,
  created_at: api.created_at,
});

// Check if Supabase is available
let supabaseAvailable: boolean | null = null;

const checkSupabaseAvailability = async (): Promise<boolean> => {
  if (supabaseAvailable !== null) return supabaseAvailable;
  
  try {
    // Try to fetch categories with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    await fetch('/api/categories', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    supabaseAvailable = true;
    return true;
  } catch (error) {
    console.warn('Supabase not available, using local storage:', error);
    supabaseAvailable = false;
    return false;
  }
};

// Hybrid Categories API
export const hybridCategoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const isSupabaseAvailable = await checkSupabaseAvailability();
    
    if (isSupabaseAvailable) {
      try {
        return await categoriesAPI.getAll();
      } catch (error) {
        console.warn('Supabase categories failed, falling back to local storage:', error);
      }
    }
    
    // Fallback to local storage
    const localCategories = getLocalCategories();
    return localCategories.map(convertLocalCategoryToAPI);
  },
  
  create: async (data: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
    const isSupabaseAvailable = await checkSupabaseAvailability();
    
    if (isSupabaseAvailable) {
      try {
        return await categoriesAPI.create(data);
      } catch (error) {
        console.warn('Supabase category creation failed, falling back to local storage:', error);
      }
    }
    
    // Fallback to local storage
    const localData = convertAPICategoryToLocal({
      ...data,
      id: '',
      created_at: '',
    });
    const created = createLocalCategory(localData);
    return convertLocalCategoryToAPI(created);
  },
  
  update: async (id: string, data: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
    const isSupabaseAvailable = await checkSupabaseAvailability();
    
    if (isSupabaseAvailable) {
      try {
        return await categoriesAPI.update(id, data);
      } catch (error) {
        console.warn('Supabase category update failed, falling back to local storage:', error);
      }
    }
    
    // Fallback to local storage
    const localData = convertAPICategoryToLocal({
      ...data,
      id,
      created_at: '',
    });
    const updated = updateLocalCategory(id, localData);
    
    if (!updated) {
      throw new Error('Category not found');
    }
    
    return convertLocalCategoryToAPI(updated);
  },
  
  delete: async (id: string): Promise<void> => {
    const isSupabaseAvailable = await checkSupabaseAvailability();
    
    if (isSupabaseAvailable) {
      try {
        await categoriesAPI.delete(id);
        return;
      } catch (error) {
        console.warn('Supabase category deletion failed, falling back to local storage:', error);
      }
    }
    
    // Fallback to local storage
    const deleted = deleteLocalCategory(id);
    if (!deleted) {
      throw new Error('Category not found');
    }
  },
};

// Hybrid Items API
export const hybridItemsAPI = {
  getAll: (categoryId?: string) => {
    return new Promise<Item[]>(async (resolve, reject) => {
      const isSupabaseAvailable = await checkSupabaseAvailability();
      
      if (isSupabaseAvailable) {
        try {
          const result = await itemsAPI.getAll(categoryId);
          resolve(result);
          return;
        } catch (error) {
          console.warn('Supabase items failed, falling back to local storage:', error);
        }
      }
      
      // Fallback to local storage
      try {
        const localItems = getLocalItems(categoryId);
        const result = localItems.map(convertLocalItemToAPI);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  create: (data: Omit<Item, 'id' | 'created_at'>): Promise<Item> => {
    return new Promise<Item>(async (resolve, reject) => {
      const isSupabaseAvailable = await checkSupabaseAvailability();
      
      if (isSupabaseAvailable) {
        try {
          const result = await itemsAPI.create(data);
          resolve(result);
          return;
        } catch (error) {
          console.warn('Supabase item creation failed, falling back to local storage:', error);
        }
      }
      
      // Fallback to local storage
      try {
        const localData = convertAPIItemToLocal({
          ...data,
          id: '',
          created_at: '',
        });
        const created = createLocalItem(localData);
        resolve(convertLocalItemToAPI(created));
      } catch (error) {
        reject(error);
      }
    });
  },
  
  update: (id: string, data: Omit<Item, 'id' | 'created_at'>): Promise<Item> => {
    return new Promise<Item>(async (resolve, reject) => {
      const isSupabaseAvailable = await checkSupabaseAvailability();
      
      if (isSupabaseAvailable) {
        try {
          const result = await itemsAPI.update(id, data);
          resolve(result);
          return;
        } catch (error) {
          console.warn('Supabase item update failed, falling back to local storage:', error);
        }
      }
      
      // Fallback to local storage
      try {
        const localData = convertAPIItemToLocal({
          ...data,
          id,
          created_at: '',
        });
        const updated = updateLocalItem(id, localData);
        
        if (!updated) {
          reject(new Error('Item not found'));
          return;
        }
        
        resolve(convertLocalItemToAPI(updated));
      } catch (error) {
        reject(error);
      }
    });
  },
  
  delete: (id: string): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      const isSupabaseAvailable = await checkSupabaseAvailability();
      
      if (isSupabaseAvailable) {
        try {
          await itemsAPI.delete(id);
          resolve();
          return;
        } catch (error) {
          console.warn('Supabase item deletion failed, falling back to local storage:', error);
        }
      }
      
      // Fallback to local storage
      try {
        const deleted = deleteLocalItem(id);
        if (!deleted) {
          reject(new Error('Item not found'));
          return;
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  
  archive: (id: string): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      const isSupabaseAvailable = await checkSupabaseAvailability();
      
      if (isSupabaseAvailable) {
        try {
          await itemsAPI.archive(id);
          resolve();
          return;
        } catch (error) {
          console.warn('Supabase item archiving failed, falling back to local deletion:', error);
        }
      }
      
      // Fallback to local storage (just delete)
      try {
        const deleted = deleteLocalItem(id);
        if (!deleted) {
          reject(new Error('Item not found'));
          return;
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
};

// Reset availability check (useful for testing or when Supabase comes back online)
export const resetSupabaseAvailability = () => {
  supabaseAvailable = null;
};
