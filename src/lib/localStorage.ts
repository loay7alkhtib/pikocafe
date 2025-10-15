// Local Storage Fallback for Admin Panel
// This provides a working admin panel even when Supabase is not accessible

export interface LocalCategory {
  id: string;
  nameEn: string;
  nameTr: string;
  nameAr: string;
  image?: string;
  icon: string;
  order: number;
  created_at: string;
}

export interface LocalItem {
  id: string;
  names: {
    en: string;
    tr: string;
    ar: string;
  };
  prices: {
    en: string;
    tr: string;
    ar: string;
  };
  descriptions: {
    en: string;
    tr: string;
    ar: string;
  };
  categoryId?: string;
  image?: string;
  tags: string[];
  variants?: Array<{
    size: string;
    price: number;
  }>;
  order: number;
  created_at: string;
}

// Local Storage Keys
const CATEGORIES_KEY = 'piko_local_categories';
const ITEMS_KEY = 'piko_local_items';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize with default data if empty
const initializeLocalData = () => {
  if (!isBrowser) return;
  
  const categories = getLocalCategories();
  const items = getLocalItems();
  
  if (categories.length === 0) {
    const defaultCategories: LocalCategory[] = [
      {
        id: 'cat-hot-drinks',
        nameEn: 'Hot Drinks',
        nameTr: 'Sıcak İçecekler',
        nameAr: 'مشروبات ساخنة',
        icon: '☕',
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-cold-drinks',
        nameEn: 'Cold Drinks',
        nameTr: 'Soğuk İçecekler',
        nameAr: 'مشروبات باردة',
        icon: '🧊',
        order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-desserts',
        nameEn: 'Desserts',
        nameTr: 'Tatlılar',
        nameAr: 'حلويات',
        icon: '🍰',
        order: 3,
        created_at: new Date().toISOString(),
      },
      {
        id: 'cat-other',
        nameEn: 'Other',
        nameTr: 'Diğer',
        nameAr: 'أخرى',
        icon: '🍽️',
        order: 999,
        created_at: new Date().toISOString(),
      },
    ];
    
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  }
  
  if (items.length === 0) {
    const defaultItems: LocalItem[] = [
      {
        id: 'item-coffee-1',
        names: {
          en: 'Espresso',
          tr: 'Espresso',
          ar: 'إسبريسو',
        },
        prices: {
          en: '12.00',
          tr: '12.00',
          ar: '12.00',
        },
        descriptions: {
          en: 'Strong coffee shot',
          tr: 'Güçlü kahve',
          ar: 'قهوة قوية',
        },
        categoryId: 'cat-hot-drinks',
        tags: ['coffee', 'strong'],
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-coffee-2',
        names: {
          en: 'Cappuccino',
          tr: 'Kapuçino',
          ar: 'كابتشينو',
        },
        prices: {
          en: '18.00',
          tr: '18.00',
          ar: '18.00',
        },
        descriptions: {
          en: 'Coffee with milk foam',
          tr: 'Süt köpüklü kahve',
          ar: 'قهوة مع رغوة الحليب',
        },
        categoryId: 'cat-hot-drinks',
        tags: ['coffee', 'milk'],
        order: 2,
        created_at: new Date().toISOString(),
      },
    ];
    
    localStorage.setItem(ITEMS_KEY, JSON.stringify(defaultItems));
  }
};

// Categories
export const getLocalCategories = (): LocalCategory[] => {
  if (!isBrowser) return [];
  
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const createLocalCategory = (category: Omit<LocalCategory, 'id' | 'created_at'>): LocalCategory => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const newCategory: LocalCategory = {
    ...category,
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  
  const categories = getLocalCategories();
  categories.push(newCategory);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return newCategory;
};

export const updateLocalCategory = (id: string, updates: Partial<LocalCategory>): LocalCategory | null => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const categories = getLocalCategories();
  const index = categories.findIndex(cat => cat.id === id);
  
  if (index === -1) return null;
  
  categories[index] = { ...categories[index], ...updates };
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  return categories[index];
};

export const deleteLocalCategory = (id: string): boolean => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const categories = getLocalCategories();
  const filtered = categories.filter(cat => cat.id !== id);
  
  if (filtered.length === categories.length) return false;
  
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
  return true;
};

// Items
export const getLocalItems = (categoryId?: string): LocalItem[] => {
  if (!isBrowser) return [];
  
  try {
    const data = localStorage.getItem(ITEMS_KEY);
    const items: LocalItem[] = data ? JSON.parse(data) : [];
    
    if (categoryId) {
      return items.filter(item => item.categoryId === categoryId);
    }
    
    return items;
  } catch {
    return [];
  }
};

export const createLocalItem = (item: Omit<LocalItem, 'id' | 'created_at'>): LocalItem => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const newItem: LocalItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  
  const items = getLocalItems();
  items.push(newItem);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  return newItem;
};

export const updateLocalItem = (id: string, updates: Partial<LocalItem>): LocalItem | null => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const items = getLocalItems();
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  return items[index];
};

export const deleteLocalItem = (id: string): boolean => {
  if (!isBrowser) {
    throw new Error('localStorage not available');
  }
  
  const items = getLocalItems();
  const filtered = items.filter(item => item.id !== id);
  
  if (filtered.length === items.length) return false;
  
  localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  return true;
};

// Initialize data on import
initializeLocalData();
