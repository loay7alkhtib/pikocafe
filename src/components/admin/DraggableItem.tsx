import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GripVertical, Edit, Trash2, Check, X } from 'lucide-react';
import { Item, Category } from '../../lib/supabase';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DraggableItemProps {
  item: Item;
  index: number;
  categories: Category[];
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (itemId: string, newCategoryId: string) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
  categoryId: string;
}

export default function DraggableItem({
  item,
  index,
  categories,
  onMove,
  onEdit,
  onDelete,
  onCategoryChange,
}: DraggableItemProps) {
  const ref = useRef<HTMLTableRowElement>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [tempCategoryId, setTempCategoryId] = useState(item.category_id);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(dragItem: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = dragItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Only allow reordering within the same category
      if (dragItem.categoryId !== item.category_id) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'item',
    item: () => {
      return { id: item.id, index, categoryId: item.category_id };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.3 : 1;
  drag(drop(ref));

  const category = categories.find((c) => c.id === item.category_id);

  const handleCategoryEdit = () => {
    setIsEditingCategory(true);
    setTempCategoryId(item.category_id);
  };

  const handleCategorySave = () => {
    if (tempCategoryId !== item.category_id) {
      onCategoryChange(item.id, tempCategoryId);
    }
    setIsEditingCategory(false);
  };

  const handleCategoryCancel = () => {
    setTempCategoryId(item.category_id);
    setIsEditingCategory(false);
  };

  return (
    <TableRow 
      ref={ref} 
      style={{ opacity }} 
      data-handler-id={handlerId}
      className={`transition-all duration-200 ${isDragging ? 'shadow-lg bg-primary/5' : 'hover:bg-muted/30'}`}
    >
      <TableCell className="w-8">
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50">
          <GripVertical className="w-5 h-5" />
        </div>
      </TableCell>
      <TableCell className="w-16">
        {item.image ? (
          <ImageWithFallback
            src={item.image}
            alt={item.names.en}
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="font-medium">{item.names.en}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
          {item.names.tr}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="text-sm truncate max-w-[150px]">{item.names.ar}</div>
      </TableCell>
      <TableCell className="font-medium">{item.price} TL</TableCell>
      <TableCell className="hidden lg:table-cell">
        {isEditingCategory ? (
          <div className="flex items-center gap-2">
            <Select value={tempCategoryId} onValueChange={setTempCategoryId}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.names.en}
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
                {category.icon} {category.names.en}
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
          <Button onClick={() => onDelete(item.id)} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
