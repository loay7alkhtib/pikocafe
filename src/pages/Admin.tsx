'use client';

import { useEffect, useState, memo, lazy, Suspense, useCallback } from 'react';
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
const HistoryPanelComponent = lazy(() => import('../components/admin/HistoryPanel').then(module => ({ default: module.HistoryPanel })));
const ItemReorganizer = lazy(() => import('../components/admin/ItemReorganizer').then(module => ({ default: module.ItemReorganizer })));
const ArchiveCleaner = lazy(() => import('../components/admin/ArchiveCleaner').then(module => ({ default: module.ArchiveCleaner })));
const SmartCategorizer = lazy(() => import('../components/admin/SmartCategorizer'));
const DiagnosticTool = lazy(() => import('../components/DiagnosticTool'));

const Admin = memo(function Admin() {
  const router = useRouter();
  const { lang } = useLang();
  const { categories, items, refetch } = useData(); // Use cached data!
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking admin session...');
      const { data: { session } } = await authAPI.getSession();
      
      if (!session) {
        console.log('❌ No session found, redirecting to login');
        toast.error('Not authorized');
        router.push('/admin-login');
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
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
        <Tabs defaultValue="diagnostics" className="w-full">
          {/* Simplified Tab Navigation */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <TabsList className="flex md:grid md:grid-cols-7 w-full max-w-5xl mx-auto gap-2 min-w-max">
                <TabsTrigger value="diagnostics" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Diagnostics
                </TabsTrigger>
                <TabsTrigger value="categories" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Categories
                </TabsTrigger>
                <TabsTrigger value="items" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Menu Items
                </TabsTrigger>
                <TabsTrigger value="smart-categorizer" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Smart AI
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="reorganize" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Reorganize
                </TabsTrigger>
                <TabsTrigger value="archive" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                  Archive
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Contents */}
          <TabsContent value="diagnostics" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading diagnostics...</p>
                </div>
              </div>
            }>
              <DiagnosticTool />
            </Suspense>
          </TabsContent>

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

          <TabsContent value="smart-categorizer" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading Smart Categorizer...</p>
                </div>
              </div>
            }>
              <SmartCategorizer
                categories={categories}
                items={items}
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

              <TabsContent value="reorganize" className="mt-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading reorganizer...</p>
                    </div>
                  </div>
                }>
                  <div className="space-y-8">
                    <ItemReorganizer onComplete={handleRefresh} />
                    <ArchiveCleaner onComplete={handleRefresh} />
                  </div>
                </Suspense>
              </TabsContent>

              <TabsContent value="archive" className="mt-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading archive...</p>
                    </div>
                  </div>
                }>
                  <HistoryPanelComponent onRestore={handleRefresh} />
                </Suspense>
              </TabsContent>
            </Tabs>
      </main>
    </div>
  );
});

export default Admin;
