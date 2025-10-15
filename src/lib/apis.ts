import { getBrowserClient, getServerClient, DatabaseService } from './supabase';
import { Category, Item, Order } from './supabase';

// API classes for different operations
export class CategoriesAPI {
  private db: DatabaseService;

  constructor(useServer = false) {
    const client = useServer ? getServerClient() : getBrowserClient();
    this.db = new DatabaseService(client);
  }

  async getAll() {
    return this.db.getCategories();
  }

  async getById(id: string) {
    return this.db.getCategory(id);
  }

  async create(category: Category) {
    return this.db.createCategory(category);
  }

  async update(id: string, updates: Partial<Category>) {
    return this.db.updateCategory(id, updates);
  }

  async delete(id: string) {
    return this.db.deleteCategory(id);
  }
}

export class ItemsAPI {
  private db: DatabaseService;

  constructor(useServer = false) {
    const client = useServer ? getServerClient() : getBrowserClient();
    this.db = new DatabaseService(client);
  }

  async getAll(categoryId?: string, includeArchived = false) {
    return this.db.getItems(categoryId, includeArchived);
  }

  async getById(id: string) {
    return this.db.getItem(id);
  }

  async create(item: Item) {
    return this.db.createItem(item);
  }

  async update(id: string, updates: Partial<Item>) {
    return this.db.updateItem(id, updates);
  }

  async delete(id: string) {
    return this.db.deleteItem(id);
  }

  async archive(id: string) {
    return this.db.archiveItem(id);
  }

  async getArchived() {
    return this.db.getItems(undefined, true);
  }

  async deleteArchived(id: string) {
    return this.db.deleteItem(id);
  }

  async deleteArchivedBulk(ids: string[]) {
    const results = [];
    for (const id of ids) {
      try {
        await this.db.deleteItem(id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }
}

export class OrdersAPI {
  private db: DatabaseService;

  constructor(useServer = false) {
    const client = useServer ? getServerClient() : getBrowserClient();
    this.db = new DatabaseService(client);
  }

  async getAll() {
    return this.db.getOrders();
  }

  async create(order: Order) {
    return this.db.createOrder(order);
  }

  async update(id: string, updates: Partial<Order>) {
    return this.db.updateOrder(id, updates);
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'cancelled') {
    return this.db.updateOrder(id, { status });
  }
}

export class AuthAPI {
  private client: ReturnType<typeof getBrowserClient>;

  constructor() {
    this.client = getBrowserClient();
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signInWithPassword(email: string, password: string) {
    return this.signIn(email, password);
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getSession() {
    const { data: { session }, error } = await this.client.auth.getSession();
    if (error) throw error;
    return { data: { session } };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

// Factory functions for browser-safe API creation
export function getCategoriesAPI() {
  return new CategoriesAPI();
}

export function getItemsAPI() {
  return new ItemsAPI();
}

export function getOrdersAPI() {
  return new OrdersAPI();
}

export function getAuthAPI() {
  return new AuthAPI();
}

// Legacy exports for backward compatibility (will be removed)
export const categoriesAPI = new Proxy({} as CategoriesAPI, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      throw new Error('categoriesAPI can only be used in the browser');
    }
    const api = getCategoriesAPI();
    return (api as any)[prop];
  }
});

export const itemsAPI = new Proxy({} as ItemsAPI, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      throw new Error('itemsAPI can only be used in the browser');
    }
    const api = getItemsAPI();
    return (api as any)[prop];
  }
});

export const ordersAPI = new Proxy({} as OrdersAPI, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      throw new Error('ordersAPI can only be used in the browser');
    }
    const api = getOrdersAPI();
    return (api as any)[prop];
  }
});

export const authAPI = new Proxy({} as AuthAPI, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      throw new Error('authAPI can only be used in the browser');
    }
    const api = getAuthAPI();
    return (api as any)[prop];
  }
});

// Server-side factory functions
export function getServerCategoriesAPI() {
  return new CategoriesAPI(true);
}

export function getServerItemsAPI() {
  return new ItemsAPI(true);
}

export function getServerOrdersAPI() {
  return new OrdersAPI(true);
}
