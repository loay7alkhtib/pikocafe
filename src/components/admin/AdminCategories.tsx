import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import ImageUpload from '../ImageUpload';
import DraggableCategory from './DraggableCategory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { categoriesAPI, Category } from '../../lib/supabase';
import { toast } from 'sonner';
import { Plus, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function AdminCategories({ categories, onRefresh }: AdminCategoriesProps) {
  const { lang } = useLang();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    nameAr: '',
    icon: '🍽️',
    image: '',
    order: 0,
  });

  // Update local categories when props change
  useEffect(() => {
    setLocalCategories([...categories].sort((a, b) => a.order - b.order));
  }, [categories]);

  const moveCategory = useCallback(async (dragIndex: number, hoverIndex: number) => {
    const dragCategory = localCategories[dragIndex];
    const newCategories = [...localCategories];
    newCategories.splice(dragIndex, 1);
    newCategories.splice(hoverIndex, 0, dragCategory);
    
    // Update local state immediately for smooth UX
    setLocalCategories(newCategories);
    
    // Update order values and save to backend
    try {
      const updates = newCategories.map((cat, index) => ({
        ...cat,
        order: index,
      }));
      
      // Save all updates
      await Promise.all(
        updates.map((cat) => categoriesAPI.update(cat.id, { ...cat, order: cat.order }))
      );
      
      toast.success('Order updated');
      onRefresh();
    } catch (error: any) {
      console.error('Reorder error:', error);
      toast.error('Failed to update order');
      setLocalCategories(categories); // Revert on error
    }
  }, [localCategories, categories, onRefresh]);

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        nameEn: category.names.en,
        nameTr: category.names.tr,
        nameAr: category.names.ar,
        icon: category.icon,
        image: category.image || '',
        order: category.order,
      });
    } else {
      setEditingId(null);
      setFormData({
        nameEn: '',
        nameTr: '',
        nameAr: '',
        icon: '🍽️',
        image: '',
        order: categories.length,
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
        icon: formData.icon,
        image: formData.image || undefined,
        order: formData.order,
      };

      console.log('Saving category with image:', formData.image ? 'Yes (length: ' + formData.image.length + ')' : 'No');

      if (editingId) {
        await categoriesAPI.update(editingId, data);
        toast.success('Category updated');
      } else {
        await categoriesAPI.create(data);
        toast.success('Category created');
      }

      setDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const category = localCategories.find(cat => cat.id === id);
    const categoryName = category ? (category.names[lang] || category.names.en || 'this category') : 'this category';
    
    if (!confirm(`⚠️ Are you sure you want to delete "${categoryName}"? This will also delete all items in this category. This action cannot be undone.`)) return;

    try {
      await categoriesAPI.delete(id);
      toast.success(`"${categoryName}" deleted successfully`);
      onRefresh();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">{t('categories', lang)}</h2>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('addNew', lang)}
          </Button>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Drag to Reorder</AlertTitle>
          <AlertDescription>
            Drag categories by the grip icon to change their display order on the menu.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {localCategories.map((category, index) => (
            <DraggableCategory
              key={category.id}
              category={category}
              index={index}
              onMove={moveCategory}
              onEdit={openDialog}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('edit', lang) : t('addNew', lang)} {t('categories', lang)}
            </DialogTitle>
            <DialogDescription>
              {editingId 
                ? (lang === 'en' ? 'Edit category details below' : 
                   lang === 'tr' ? 'Aşağıda kategori detaylarını düzenleyin' : 
                   'قم بتحرير تفاصيل الفئة أدناه')
                : (lang === 'en' ? 'Add a new category with details below' : 
                   lang === 'tr' ? 'Aşağıda yeni bir kategori ekleyin' : 
                   'أضف فئة جديدة مع التفاصيل أدناه')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={formData.image}
              onChange={(base64) => {
                console.log('ImageUpload onChange called with:', base64 ? 'base64 data (' + base64.length + ' chars)' : 'null');
                setFormData({ ...formData, image: base64 || '' });
              }}
              label="Category Image"
              fallbackIcon={formData.icon}
            />
            <div>
              <Label>Fallback Icon (Emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🍽️"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used when no image is uploaded
              </p>
            </div>
            <div>
              <Label>Name (English)</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Hot Drinks"
              />
            </div>
            <div>
              <Label>Name (Turkish)</Label>
              <Input
                value={formData.nameTr}
                onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                placeholder="Sıcak İçecekler"
              />
            </div>
            <div>
              <Label>Name (Arabic)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مشروبات ساخنة"
                dir="rtl"
              />
            </div>
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              />
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
    </DndProvider>
  );
}
