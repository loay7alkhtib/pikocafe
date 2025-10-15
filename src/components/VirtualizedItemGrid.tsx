import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FixedSizeGrid as Grid } from 'react-window';
import { ItemCard } from './ItemCard';

interface VirtualizedItemGridProps {
  items: Array<{
    id: string;
    names: { en: string; tr: string; ar: string };
    price: number;
    image?: string | null;
    tags?: string[];
    variants?: any[];
  }>;
  onItemClick: (item: any) => void;
  onItemAdd: (item: any, size?: string, price?: number) => void;
  luckyItemId?: string | null;
  lang: string;
  containerHeight?: number;
}

const VirtualizedItemGrid = memo(function VirtualizedItemGrid({
  items,
  onItemClick,
  onItemAdd,
  luckyItemId,
  lang,
  containerHeight = 600
}: VirtualizedItemGridProps) {
  // Calculate grid dimensions based on container width
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 2;
    
    const width = window.innerWidth;
    if (width < 640) return 2; // sm
    if (width < 768) return 3; // md
    if (width < 1024) return 4; // lg
    if (width < 1280) return 5; // xl
    if (width < 1536) return 6; // 2xl
    return 7; // 2xl+
  }, []);

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(items.length / columnCount);
  const itemHeight = 280; // Approximate height of each item card

  const Cell = memo(function Cell({ columnIndex, rowIndex, style }: any) {
    const itemIndex = rowIndex * columnCount + columnIndex;
    const item = items[itemIndex];

    if (!item) {
      return <div style={style} />;
    }

    return (
      <div style={style} className="p-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(itemIndex * 0.02, 0.2) }}
        >
          <ItemCard
            name={item.names?.[lang] || item.names?.en || 'Item'}
            price={item.price}
            image={item.image}
            tags={item.tags}
            variants={item.variants}
            isLucky={luckyItemId === item.id}
            onAdd={() => {
              if (item.variants && item.variants.length > 0) {
                onItemClick(item);
              } else {
                onItemAdd(item);
              }
            }}
            onClick={() => onItemClick(item)}
          />
        </motion.div>
      </div>
    );
  });

  return (
    <Grid
      height={containerHeight}
      width="100%"
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={typeof window !== 'undefined' ? window.innerWidth / columnCount - 16 : 200}
      rowHeight={itemHeight}
      itemData={{ items, onItemClick, onItemAdd, luckyItemId, lang }}
    >
      {Cell}
    </Grid>
  );
});

VirtualizedItemGrid.displayName = 'VirtualizedItemGrid';

export default VirtualizedItemGrid;
