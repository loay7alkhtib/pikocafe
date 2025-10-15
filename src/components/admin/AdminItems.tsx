import { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ImageUpload from '../ImageUpload';
import DraggableItem from './DraggableItem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { Category, Item } from '../../lib/supabase';
import { hybridItemsAPI } from '../../lib/hybridAPI';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Filter, X, Info, Search, Archive, CheckSquare, Square, MoveRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface AdminItemsProps {
  items: Item[];
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminItems({ items, categories, onRefresh }: AdminItemsProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Bulk editing state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    categoryId: '',
    price: 0,
    image: '',
    tags: '',
    variants: [] as { size: string; price: number }[],
    order: 0,
  });

  // Update local items when props change and auto-assign uncategorized items
  useEffect(() => {
    const processedItems = [...items].filter(item => item != null).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Check if there are uncategorized items and "Other" category exists
    const otherCategory = categories.find(cat => cat.id === 'cat-other');
    const uncategorizedItems = processedItems.filter(item => !item.category_id);
    
    if (uncategorizedItems.length > 0 && otherCategory) {
      // Auto-assign uncategorized items to "Other" category
      const autoAssignPromises = uncategorizedItems.map(async (item) => {
        try {
          await itemsAPI.update(item.id, {
            ...item,
            category_id: 'cat-other'
          });
        } catch (error) {
          console.error(`Failed to auto-assign item ${item.id} to Other category:`, error);
        }
      });
      
      // Run auto-assignment in background
      Promise.all(autoAssignPromises).then(() => {
        console.log(`Auto-assigned ${uncategorizedItems.length} items to "Other" category`);
        onRefresh(); // Refresh to show updated categories
      });
    }
    
    setLocalItems(processedItems);
  }, [items, categories, onRefresh]);

  // Filter items by selected category
  // Filter items by category, search query, and archive status
  const filteredItems = localItems.filter(item => {
    // Skip null/undefined items
    if (!item) return false;
    
    // Archive filter
    const archiveMatch = showArchived ? item.archived_at : !item.archived_at;
    
    // Category filter
    const categoryMatch = selectedCategory === 'all' || item.category_id === selectedCategory;
    
    // Search filter
    if (!searchQuery.trim()) return archiveMatch && categoryMatch;
    
    const query = searchQuery.toLowerCase().trim();
    const searchMatch = 
      item.names?.en?.toLowerCase().includes(query) ||
      item.names.tr?.toLowerCase().includes(query) ||
      item.names.ar?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return archiveMatch && categoryMatch && searchMatch;
  });


  const openDialog = (item?: Item) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nameEn: item.names?.en || 'Item',
        nameTr: item.names?.tr || 'Item',
        nameAr: item.names?.ar || 'Item',
        categoryId: item.category_id || '',
        price: item.price,
        image: item.image || '',
        tags: item.tags.join(', '),
        variants: item.variants || [],
        order: item.order || 0,
      });
    } else {
      setEditingId(null);
      const categoryItems = localItems.filter(i => i.category_id === categories[0]?.id);
      // Get the highest order value for this category and add 1
      const maxOrder = categoryItems.length > 0 
        ? Math.max(...categoryItems.map(i => i.order || 0)) + 1 
        : 0;
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        categoryId: categories[0]?.id || '',
        price: 0,
        image: '',
        tags: '',
        variants: [],
        order: maxOrder,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        names: {
          en: formData.nameEn,
          tr: formData.nameTr,
          ar: formData.nameAr,
        },
        category_id: formData.categoryId || null,
        price: formData.price,
        image: formData.image || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        variants: formData.variants.length > 0 ? formData.variants : undefined,
        order: formData.order,
      };

      if (editingId) {
        await hybridItemsAPI.update(editingId, data);
        toast.success('Item updated');
      } else {
        await hybridItemsAPI.create(data);
        toast.success('Item created');
      }

      setDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
  };

  const handleArchive = async (id: string) => {
    const item = localItems.find(item => item.id === id);
    const itemName = item ? (item.names?.[lang] || item.names?.en || 'this item') : 'this item';
    
    if (!confirm(`📦 Archive "${itemName}"? You can recover it later from the archive.`)) return;

    try {
      await hybridItemsAPI.archive(id);
      toast.success(`"${itemName}" archived successfully`);
      onRefresh();
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error(error.message || 'Failed to archive item');
    }
  };

  const handleCategoryChange = async (itemId: string, newCategoryId: string) => {
    try {
      const item = localItems.find(item => item.id === itemId);
      if (!item) return;

      // Update the item's category in the backend
      await itemsAPI.update(itemId, {
        ...item,
        category_id: newCategoryId
      });

      // Update local state immediately for better UX
      setLocalItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, category_id: newCategoryId }
            : item
        )
      );

      const newCategory = categories.find(cat => cat.id === newCategoryId);
      const categoryName = newCategory ? (newCategory.names?.[lang] || newCategory.names?.en) : 'Unknown';
      
      toast.success(`Item moved to "${categoryName}" category`);
    } catch (error: any) {
      console.error('Category change error:', error);
      toast.error(error.message || 'Failed to change category');
      // Refresh to get the correct state
      onRefresh();
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-medium">{t('items', lang)}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={() => setShowArchived(!showArchived)} 
            variant={showArchived ? "default" : "outline"}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          {!showArchived && (
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addNew', lang)}
            </Button>
          )}
        </div>
      </div>

      {/* Archive Info */}
      {showArchived ? (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Archived Items</AlertTitle>
          <AlertDescription className="text-orange-700">
            Showing archived (soft deleted) items. These items are hidden from customers but can be restored. Use the Archive tab to manage them.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Item Management</AlertTitle>
          <AlertDescription className="text-blue-700">
            Edit items to set display order. Use the Archive button to soft delete items (they can be restored from the Archive tab).
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search items by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-10 rounded-lg border-border focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by category:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All ({items.length})
          </Badge>
          {categories.map((cat) => {
            const count = items.filter(item => item && item.category_id === cat.id).length;
            return (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.names?.en || 'Category'} ({count})
              </Badge>
            );
          })}
          {selectedCategory !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setSelectedCategory('all')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="min-w-[150px]">Name (EN)</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Name (AR)</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="min-w-[120px] hidden lg:table-cell">Category</TableHead>
              <TableHead className="min-w-[150px] hidden xl:table-cell">Tags</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? (
                    <div className="space-y-2">
                      <Search className="w-8 h-8 mx-auto opacity-50" />
                        <p>No items found for &quot;{searchQuery}&quot;</p>
                      <p className="text-sm">Try adjusting your search terms or category filter</p>
                    </div>
                  ) : selectedCategory === 'all' ? (
                    <div className="space-y-2">
                      <p>No items found</p>
                      <p className="text-sm">Add your first item to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>No items in this category</p>
                        <p className="text-sm">Try selecting &quot;All Categories&quot; or add items to this category</p>
                    </div>
                  )}
                </td>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  categories={categories}
                  onEdit={openDialog}
                  onDelete={handleArchive}
                  onCategoryChange={handleCategoryChange}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('edit', lang) : t('addNew', lang)} {t('items', lang)}
            </DialogTitle>
            <DialogDescription>
              {editingId 
                ? (lang === 'en' ? 'Edit menu item details below' : 
                   lang === 'tr' ? 'Aşağıda menü öğesi detaylarını düzenleyin' : 
                   'قم بتحرير تفاصيل عنصر القائمة أدناه')
                : (lang === 'en' ? 'Add a new menu item with details below' : 
                   lang === 'tr' ? 'Aşağıda yeni bir menü öğesi ekleyin' : 
                   'أضف عنصر قائمة جديد مع التفاصيل أدناه')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={formData.image}
              onChange={(base64) => setFormData({ ...formData, image: base64 || '' })}
              label="Item Image"
              fallbackIcon="🍽️"
            />
            <div>
              <Label>Category</Label>
                <Select value={formData.categoryId} onValueChange={(val: string) => setFormData({ ...formData, categoryId: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.names?.en || 'Category'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name (English)</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Cappuccino"
              />
            </div>
            <div>
              <Label>Name (Turkish)</Label>
              <Input
                value={formData.nameTr}
                onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                placeholder="Kapuçino"
              />
            </div>
            <div>
              <Label>Name (Arabic)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="كابتشينو"
                dir="rtl"
              />
            </div>
            <div>
              <Label>Price (₺)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Premium, Fresh, Hot"
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first in the category
              </p>
            </div>

            {/* Size Variants */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Size Variants (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      variants: [...formData.variants, { size: '', price: 0 }]
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Size
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add different sizes with different prices (e.g., Small, Medium, Large)
              </p>
              {formData.variants.map((variant, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Size Name</Label>
                    <Input
                      value={variant.size}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].size = e.target.value;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      placeholder="Small, Medium, Large"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Price (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].price = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newVariants = formData.variants.filter((_, i) => i !== index);
                      setFormData({ ...formData, variants: newVariants });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel', lang)}
            </Button>
            <Button onClick={handleSave}>
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
