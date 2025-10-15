import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { categoriesAPI, itemsAPI, Category, Item } from './supabase';
import { performanceCache, debounce } from './PerformanceCache';
import './debug'; // Load diagnostics tool

interface DataContextType {
  categories: Category[];
  items: Item[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCategoryItems: (categoryId: string) => Item[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data once on mount
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first for instant loading
      const cachedCategories = performanceCache.get<Category[]>('categories');
      const cachedItems = performanceCache.get<Item[]>('items');
      
      if (cachedCategories && cachedItems) {
        console.log('📦 Using cached data for instant loading');
        setCategories(cachedCategories);
        setItems(cachedItems);
        setLoading(false);
        
        // Fetch fresh data in background
        setTimeout(async () => {
          try {
            const [freshCategories, freshItems] = await Promise.all([
              categoriesAPI.getAll(),
              itemsAPI.getAll()
            ]);
            
            // Update cache and state with fresh data
            performanceCache.set('categories', freshCategories, 5 * 60 * 1000);
            performanceCache.set('items', freshItems, 5 * 60 * 1000);
            setCategories(freshCategories);
            setItems(freshItems);
          } catch (err) {
            console.warn('Background refresh failed:', err);
          }
        }, 100);
        
        return;
      }

      console.log('🌐 Fetching fresh data from server...');

      // Try to fetch categories and items in parallel with minimum loading time
      const [categoriesData, itemsData] = await Promise.all([
        categoriesAPI.getAll().catch(err => {
          console.error('Categories fetch error:', err);
          return [];
        }),
        itemsAPI.getAll().catch(err => {
          console.error('Items fetch error:', err);
          return [];
        }),
        // Minimum 2.5 seconds to show the beautiful loading screen
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);

      // If both are empty, there might be an initialization issue
      if (!categoriesData || categoriesData.length === 0) {
        console.warn('⚠️ No categories found. Database might need initialization.');
      }

      // Sort categories by order field
      const sortedCategories = Array.isArray(categoriesData) 
        ? [...categoriesData].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];
      
      // Ensure items have order field and sort by order field within their categories
      const sortedItems = Array.isArray(itemsData) 
        ? [...itemsData]
            // First, ensure all items have an order field
            .map((item, index) => ({
              ...item,
              order: item.order ?? index
            }))
            // Then sort by category order and item order
            .sort((a, b) => {
              // First sort by category order, then by item order within category
              const categoryA = sortedCategories.find(cat => cat.id === a.category_id);
              const categoryB = sortedCategories.find(cat => cat.id === b.category_id);
              
              if (categoryA && categoryB) {
                const categoryOrderDiff = (categoryA.order || 0) - (categoryB.order || 0);
                if (categoryOrderDiff !== 0) return categoryOrderDiff;
              }
              
              // If same category or no category, sort by item order
              return (a.order || 0) - (b.order || 0);
            })
        : [];
      
      // Cache the data for 5 minutes
      performanceCache.set('categories', sortedCategories, 5 * 60 * 1000);
      performanceCache.set('items', sortedItems, 5 * 60 * 1000);

      setCategories(sortedCategories);
      setItems(sortedItems);
      
      console.log('✅ Data loaded and cached:', {
        categories: categoriesData?.length || 0,
        items: itemsData?.length || 0,
      });
    } catch (err) {
      console.error('❌ Data fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Full error details:', {
        error: err,
        message: errorMessage,
        type: typeof err,
      });
      setError(errorMessage);
      // Set empty arrays on error so app doesn't crash
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    // Fetch data directly
    const initData = async () => {
      console.log('🚀 Starting data fetch...');
      await fetchAllData();
    };
    
    const timer = setTimeout(initData, 100);
    return () => clearTimeout(timer);
  }, [fetchAllData]);

  // Helper to get items for a specific category, sorted by order with caching
  const getCategoryItems = useCallback((categoryId: string) => {
    const cacheKey = `categoryItems_${categoryId}`;
    const cached = performanceCache.get<Item[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const categoryItems = items
      .filter(item => item.category_id === categoryId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Cache for 2 minutes
    performanceCache.set(cacheKey, categoryItems, 2 * 60 * 1000);
    
    return categoryItems;
  }, [items]);

  // Refetch function for admin updates
  const refetch = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  return (
    <DataContext.Provider value={{
      categories,
      items,
      loading,
      error,
      refetch,
      getCategoryItems,
    }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden relative">
          {/* Elegant magical background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Sophisticated floating particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -150, 0],
                  x: [0, Math.random() * 30 - 15, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Elegant sparkles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-cyan-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${0.8 + Math.random() * 0.4}rem`,
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [0, 1.2, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                  ease: "easeInOut"
                }}
              >
                ✦
              </motion.div>
            ))}
            
            {/* Floating food with elegant movement */}
            {[
              { emoji: '🥐', delay: 0, duration: 12, x: 15, y: 25 },
              { emoji: '☕', delay: 2, duration: 14, x: 85, y: 30 },
              { emoji: '🧁', delay: 4, duration: 16, x: 25, y: 70 },
              { emoji: '🍰', delay: 6, duration: 13, x: 75, y: 65 },
              { emoji: '🥞', delay: 8, duration: 15, x: 45, y: 20 },
              { emoji: '🍪', delay: 10, duration: 11, x: 65, y: 80 },
            ].map((food, i) => (
              <motion.div
                key={`food-${i}`}
                className="absolute text-3xl opacity-60"
                style={{
                  left: `${food.x}%`,
                  top: `${food.y}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.sin(i) * 20, 0],
                  rotate: [0, 180, 360],
                  scale: [0.8, 1.1, 0.8],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: food.duration,
                  repeat: Infinity,
                  delay: food.delay,
                  ease: "easeInOut"
                }}
              >
                {food.emoji}
              </motion.div>
            ))}
            
            {/* Elegant magical orbs */}
            {[
              { color: 'rgba(34, 211, 238, 0.2)', size: 60, delay: 0 },
              { color: 'rgba(168, 85, 247, 0.15)', size: 80, delay: 1 },
              { color: 'rgba(236, 72, 153, 0.18)', size: 70, delay: 2 },
              { color: 'rgba(59, 130, 246, 0.16)', size: 90, delay: 3 },
            ].map((orb, i) => (
              <motion.div
                key={`orb-${i}`}
                className="absolute rounded-full opacity-40"
                style={{
                  background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                  width: orb.size,
                  height: orb.size,
                  left: `${20 + (i * 20)}%`,
                  top: `${30 + (i * 15)}%`,
                }}
                animate={{
                  scale: [0.8, 1.3, 0.8],
                  opacity: [0.2, 0.5, 0.2],
                  x: [0, Math.sin(i) * 30, 0],
                  y: [0, Math.cos(i) * 20, 0],
                }}
                transition={{
                  duration: 6 + Math.random() * 2,
                  repeat: Infinity,
                  delay: orb.delay,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Elegant light waves */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          {/* Main content with elegant magical effects */}
          <div className="relative z-10 text-center space-y-8">
            {/* Sophisticated logo container */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 120, 
                damping: 20,
                duration: 1.2
              }}
            >
              {/* Elegant glow layers */}
              <motion.div
                className="absolute -inset-10 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: [0, 180],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div
                className="absolute -inset-8 bg-gradient-to-r from-purple-400/25 via-pink-400/25 to-cyan-400/25 rounded-full blur-2xl"
                animate={{
                  scale: [1.1, 1.4, 1.1],
                  opacity: [0.4, 0.7, 0.4],
                  rotate: [180, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              
              {/* Elegant rings */}
              <motion.div
                className="absolute -inset-6 border border-cyan-400/40 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div
                className="absolute -inset-4 border border-purple-400/50 rounded-full"
                animate={{
                  scale: [1.1, 1.3, 1.1],
                  opacity: [0.6, 0.9, 0.6],
                  rotate: [360, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              />
              
              {/* Main logo */}
              <motion.div 
                className="relative text-7xl"
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(120deg)', 'hue-rotate(240deg)', 'hue-rotate(360deg)'],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🥐
              </motion.div>
            </motion.div>
            
            {/* Elegant text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <motion.h1 
                className="text-3xl sm:text-4xl font-light bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0%', '100%', '0%'],
                  textShadow: [
                    '0 0 30px rgba(34, 211, 238, 0.4)',
                    '0 0 50px rgba(168, 85, 247, 0.4)',
                    '0 0 30px rgba(34, 211, 238, 0.4)'
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 100%'
                }}
              >
                Piko Patisserie & Café
              </motion.h1>
              
              <motion.p 
                className="text-lg text-cyan-200/90 font-light"
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.01, 1],
                  textShadow: [
                    '0 0 15px rgba(34, 211, 238, 0.3)',
                    '0 0 25px rgba(34, 211, 238, 0.5)',
                    '0 0 15px rgba(34, 211, 238, 0.3)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✦ Crafting exquisite flavors... ✦
              </motion.p>
              
              <motion.p 
                className="text-sm text-purple-300/80 font-light"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
              >
                ◊ Preparing your magical experience... ◊
              </motion.p>
            </motion.div>
            
            {/* Elegant loading indicators */}
            <motion.div 
              className="flex gap-3 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                  animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 180],
                    boxShadow: [
                      '0 0 15px rgba(34, 211, 238, 0.4)',
                      '0 0 25px rgba(168, 85, 247, 0.6)',
                      '0 0 15px rgba(34, 211, 238, 0.4)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
            
            {/* Elegant progress bar */}
            <motion.div 
              className="w-full max-w-sm mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="relative w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: "70%" }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                >
                  {/* Elegant shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-start space-y-4 max-w-md">
            <div className="text-5xl">😔</div>
            <h2 className="text-xl font-medium">Cannot Connect to Server</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                The menu data couldn&apos;t be loaded. This might be because:
              </p>
              <ul className="text-xs text-muted-foreground text-start space-y-1 bg-muted/30 p-3 rounded-lg">
                <li>• The server is starting up (wait a moment)</li>
                <li>• Network connection issue</li>
                <li>• Database needs initialization</li>
              </ul>
              <p className="text-xs text-red-500/80 font-mono bg-red-50 dark:bg-red-950/20 p-2 rounded">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={refetch}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all"
                >
                  Retry Connection
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all"
                >
                  Refresh Page
                </button>
              </div>
              <button 
                onClick={async () => {
                  console.log('🔍 Running diagnostics...');
                  const { diagnoseConnection } = await import('./debug');
                  await diagnoseConnection();
                  console.log('💡 Check console for diagnostic results');
                }}
                className="px-3 py-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-500/20 transition-all"
              >
                Run Diagnostics (check console)
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
