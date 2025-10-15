import { useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Category, Item } from '../lib/supabase';
import { useLang } from '../lib/LangContext';
import ItemCard from './ItemCard';
import { Eye, Grid, List } from 'lucide-react';
import { useState } from 'react';

interface ViewAllItemsProps {
  categories: Category[];
  items: Item[];
  onCategorySelect?: (categoryId: string) => void;
}

export default function ViewAllItems({ categories, items, onCategorySelect }: ViewAllItemsProps) {
  const { lang } = useLang();
  const [viewMode, setViewMode] = useState<'sections' | 'grid'>('sections');

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: { [categoryId: string]: { category: Category; items: Item[] } } = {};
    
    // Add regular categories
    categories.forEach(category => {
      if (category.id !== 'cat-view-all' && category.id !== 'cat-other') {
        grouped[category.id] = {
          category,
          items: items.filter(item => item.category_id === category.id && !item.archived_at)
        };
      }
    });

    // Add uncategorized items to "Other" category
    const uncategorizedItems = items.filter(item => !item.category_id && !item.archived_at);
    if (uncategorizedItems.length > 0) {
      const otherCategory = categories.find(cat => cat.id === 'cat-other');
      if (otherCategory) {
        grouped['cat-other'] = {
          category: otherCategory,
          items: uncategorizedItems
        };
      }
    }

    return grouped;
  }, [categories, items]);

  // Sort categories by order, but put "Other" at the end
  const sortedCategoryEntries = useMemo(() => {
    return Object.entries(itemsByCategory).sort(([, a], [, b]) => {
      // Put "Other" category at the end
      if (a.category.id === 'cat-other') return 1;
      if (b.category.id === 'cat-other') return -1;
      return (a.category.order || 0) - (b.category.order || 0);
    });
  }, [itemsByCategory]);

  const totalItems = items.filter(item => !item.archived_at).length;

  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6" />
              All Items ({totalItems})
            </h2>
            <p className="text-muted-foreground">
              Browse all menu items in a single view
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'sections' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('sections')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              By Category
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Grid className="w-4 h-4" />
              All Items
            </Button>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items
            .filter(item => !item.archived_at)
            .sort((a, b) => {
              // Sort by category order first, then by item order
              const categoryA = categories.find(cat => cat.id === a.category_id);
              const categoryB = categories.find(cat => cat.id === b.category_id);
              
              if (categoryA && categoryB) {
                const categoryOrderDiff = (categoryA.order || 0) - (categoryB.order || 0);
                if (categoryOrderDiff !== 0) return categoryOrderDiff;
              }
              
              return ((a.order || 0) - (b.order || 0));
            })
            .map((item) => (
              <div key={item.id} className="relative">
                <ItemCard item={item} />
                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-black/70 text-white hover:bg-black/80"
                  >
                    {item.category_id 
                      ? categories.find(cat => cat.id === item.category_id)?.icon || '📦'
                      : '📦'
                    }
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6" />
            All Items ({totalItems})
          </h2>
          <p className="text-muted-foreground">
            Browse all menu items organized by category
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'sections' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('sections')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            By Category
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-2"
          >
            <Grid className="w-4 h-4" />
            All Items
          </Button>
        </div>
      </div>

      {/* Sections View */}
      <div className="space-y-8">
        {sortedCategoryEntries.map(([categoryId, { category, items: categoryItems }]) => {
          if (categoryItems.length === 0) return null;

          return (
            <Card key={categoryId} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {category.names[lang] || category.names.en}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {onCategorySelect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCategorySelect(categoryId)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Category
                      </Button>
                    )}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryItems
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-medium">Menu Summary</h4>
            <p className="text-sm text-muted-foreground">
              {sortedCategoryEntries.length} categories • {totalItems} total items
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {sortedCategoryEntries.map(([categoryId, { category, items: categoryItems }]) => (
                <Badge key={categoryId} variant="outline" className="gap-1">
                  <span>{category.icon}</span>
                  <span>{categoryItems.length}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
