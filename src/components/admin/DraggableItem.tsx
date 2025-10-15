import { useState } from 'react';
import { TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Trash2, Check, X, Archive } from 'lucide-react';
import { Item, Category } from '../../lib/supabase';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DraggableItemProps {
  item: Item;
  index: number;
  categories: Category[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (itemId: string, newCategoryId: string) => void;
}

export default function DraggableItem({
  item,
  index,
  categories,
  onEdit,
  onDelete,
  onCategoryChange,
}: DraggableItemProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [tempCategoryId, setTempCategoryId] = useState(item.category_id);

  const category = categories.find((c) => c.id === item.category_id);

  const handleCategoryEdit = () => {
    setIsEditingCategory(true);
    setTempCategoryId(item.category_id);
  };

  const handleCategorySave = () => {
    if (tempCategoryId !== item.category_id && tempCategoryId) {
      onCategoryChange(item.id, tempCategoryId);
    }
    setIsEditingCategory(false);
  };

  const handleCategoryCancel = () => {
    setTempCategoryId(item.category_id);
    setIsEditingCategory(false);
  };

  return (
    <TableRow className="transition-all duration-200 hover:bg-muted/30">
      <TableCell className="w-16">
        {item.image ? (
          <ImageWithFallback
            src={item.image}
            alt={item.names?.en || 'Item'}
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">{item.names?.en || 'Item'}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
          {item.names?.tr || 'Item'}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="text-sm truncate max-w-[150px]">{item.names?.ar || 'Item'}</div>
      </TableCell>
      <TableCell className="font-medium">{item.price} TL</TableCell>
      <TableCell className="hidden lg:table-cell">
        {isEditingCategory ? (
          <div className="flex items-center gap-2">
            <Select value={tempCategoryId || ''} onValueChange={setTempCategoryId}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.names?.en || 'Category'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCategorySave}
              className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCategoryCancel}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div 
            className="cursor-pointer group"
            onClick={handleCategoryEdit}
            title="Click to change category"
          >
            {category && (
              <Badge variant="outline" className="group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors">
                {category.icon} {category.names?.en || 'Category'}
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {item.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button onClick={() => onEdit(item)} variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => onDelete(item.id)} 
            variant="outline" 
            size="sm" 
            className="text-orange-600 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300" 
            title="Archive item (soft delete - can be restored)"
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
