'use client';

import { useEffect, useState, memo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t } from '../lib/i18n';
import { authAPI, ordersAPI, Order } from '../lib/supabase';
import { toast } from 'sonner';
import { LogOut, Home, RefreshCw } from 'lucide-react';

// Lazy load admin components
const AdminCategories = lazy(() => import('../components/admin/AdminCategories'));
const AdminItems = lazy(() => import('../components/admin/AdminItems'));
const AdminOrders = lazy(() => import('../components/admin/AdminOrders'));

const Admin = memo(function Admin() {
  const router = useRouter();
  const { lang } = useLang();
  const { categories, items, refetch } = useData(); // Use cached data!
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      console.log('🔍 Checking admin session...');
      const { data: { session } } = await authAPI.getSession();
      
      if (!session) {
        console.log('❌ No session found, redirecting to login');
        toast.error('Not authorized');
        onNavigate('admin-login');
        return;
      }

      console.log('✅ Session valid:', session.user?.email);
      setAuthorized(true);
      loadOrders();
    } catch (error) {
      console.error('❌ Auth check error:', error);
      toast.error('Authentication error');
      router.push('/admin-login');
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const ordersData = await ordersAPI.getAll();
      setOrders(ordersData || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    }
  }

  const handleRefresh = async () => {
    await refetch(); // Refetch categories and items
    await loadOrders(); // Refetch orders
    toast.success('Data refreshed successfully');
  };

  const handleLogout = async () => {
    await authAPI.signOut();
    toast.success(t('logout', lang));
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin">🥐</div>
          <p className="text-muted-foreground text-sm">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>{categories.length} categories</span>
                <span>•</span>
                <span>{items.length} items</span>
                <span>•</span>
                <span>{orders.length} orders</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="categories" className="w-full">
          {/* Simplified Tab Navigation */}
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="categories" className="text-sm">
                Categories
              </TabsTrigger>
              <TabsTrigger value="items" className="text-sm">
                Menu Items
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-sm">
                Orders
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="categories" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading categories...</p>
                </div>
              </div>
            }>
              <AdminCategories
                categories={categories}
                onRefresh={handleRefresh}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="items" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading menu items...</p>
                </div>
              </div>
            }>
              <AdminItems
                items={items}
                categories={categories}
                onRefresh={handleRefresh}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                </div>
              </div>
            }>
              <AdminOrders
                orders={orders}
                onRefresh={loadOrders}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});

export default Admin;
