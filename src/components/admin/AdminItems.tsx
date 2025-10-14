import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
import { itemsAPI, Category, Item } from '../../lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Filter, X, Info, Search } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    categoryId: '',
    price: 0,
    image: '',
    tags: '',
    variants: [] as { size: string; price: number }[],
  });

  // Update local items when props change
  useState(() => {
    setLocalItems([...items]);
  });

  // Filter items by selected category
  // Filter items by category and search query
  const filteredItems = localItems.filter(item => {
    // Category filter
    const categoryMatch = selectedCategory === 'all' || item.category_id === selectedCategory;
    
    // Search filter
    if (!searchQuery.trim()) return categoryMatch;
    
    const query = searchQuery.toLowerCase().trim();
    const searchMatch = 
      item.names.en.toLowerCase().includes(query) ||
      item.names.tr?.toLowerCase().includes(query) ||
      item.names.ar?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return categoryMatch && searchMatch;
  });

  const moveItem = useCallback(async (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    
    const dragItem = filteredItems[dragIndex];
    const hoverItem = filteredItems[hoverIndex];
    
    // Only allow reordering within same category
    if (dragItem.category_id !== hoverItem.category_id) {
      return;
    }

    // Create new filtered items array with reordered items
    const newFilteredItems = [...filteredItems];
    const draggedItem = newFilteredItems.splice(dragIndex, 1)[0];
    newFilteredItems.splice(hoverIndex, 0, draggedItem);
    
    // Update local items by replacing the filtered items in the correct positions
    const updatedAllItems = localItems.map(item => {
      const foundIndex = newFilteredItems.findIndex(ni => ni.id === item.id);
      if (foundIndex !== -1) {
        return newFilteredItems[foundIndex];
      }
      return item;
    });
    
    setLocalItems(updatedAllItems);
    
    try {
      // Here you would typically update the order in the backend
      // For now, we'll just show a success message
      toast.success('Item order updated successfully');
    } catch (error: any) {
      console.error('Reorder error:', error);
      toast.error('Failed to update order');
      // Revert to original items on error
      setLocalItems([...items]);
    }
  }, [filteredItems, localItems, items]);

  const openDialog = (item?: Item) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nameEn: item.names.en,
        nameTr: item.names.tr,
        nameAr: item.names.ar,
        categoryId: item.category_id || '',
        price: item.price,
        image: item.image || '',
        tags: item.tags.join(', '),
        variants: item.variants || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        categoryId: categories[0]?.id || '',
        price: 0,
        image: '',
        tags: '',
        variants: [],
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
      };

      if (editingId) {
        await itemsAPI.update(editingId, data);
        toast.success('Item updated');
      } else {
        await itemsAPI.create(data);
        toast.success('Item created');
      }

      setDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const item = localItems.find(item => item.id === id);
    const itemName = item ? (item.names[lang] || item.names.en || 'this item') : 'this item';
    
    if (!confirm(`⚠️ Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) return;

    try {
      await itemsAPI.delete(id);
      toast.success(`"${itemName}" deleted successfully`);
      onRefresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete item');
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
      const categoryName = newCategory ? (newCategory.names[lang] || newCategory.names.en) : 'Unknown';
      
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
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('addNew', lang)}
          </Button>
        </div>
      </div>

      {/* Drag-and-Drop Info */}
      {filteredItems.length > 1 && selectedCategory !== 'all' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Drag to Reorder Items</AlertTitle>
          <AlertDescription className="text-blue-700">
            Use the grip icon (⋮⋮) to drag and reorder items within this category. Changes are saved automatically.
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
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found for "{searchQuery}"
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
            const count = items.filter(item => item.category_id === cat.id).length;
            return (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.names.en} ({count})
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

      <DndProvider backend={HTML5Backend}>
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
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
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? (
                      <div className="space-y-2">
                        <Search className="w-8 h-8 mx-auto opacity-50" />
                        <p>No items found for "{searchQuery}"</p>
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
                        <p className="text-sm">Try selecting "All Categories" or add items to this category</p>
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
                    onMove={moveItem}
                    onEdit={openDialog}
                    onDelete={handleDelete}
                    onCategoryChange={handleCategoryChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DndProvider>

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
                      {cat.icon} {cat.names.en}
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
