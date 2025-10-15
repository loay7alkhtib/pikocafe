import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Tag, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useLang } from '../lib/LangContext';
import { t, translateSize } from '../lib/i18n';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { ItemVariant } from '../lib/supabase';

interface ItemPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    names: { en: string; tr: string; ar: string };
    price: number;
    image?: string | null;
    tags?: string[];
    variants?: ItemVariant[];
  } | null;
  items?: {
    id: string;
    names: { en: string; tr: string; ar: string };
    price: number;
    image?: string | null;
    tags?: string[];
    variants?: ItemVariant[];
  }[];
  currentIndex?: number;
  onAdd: (size?: string, price?: number) => void;
  categoryName?: string;
}

const ItemPreview = memo(function ItemPreview({ 
  isOpen, 
  onClose, 
  item, 
  items,
  currentIndex = 0,
  onAdd,
  categoryName 
}: ItemPreviewProps) {
  const { lang } = useLang();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(currentIndex);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (!items || items.length === 0) return;
    setCurrentItemIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items]);

  const navigateToNext = useCallback(() => {
    if (!items || items.length === 0) return;
    setCurrentItemIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items]);

  // Get current item (either from props or items array)
  const currentItem = items && items.length > 0 ? items[currentItemIndex] : item;

  // Update current item index when currentIndex prop changes
  useEffect(() => {
    setCurrentItemIndex(currentIndex);
  }, [currentIndex]);

  // Handle keyboard events for spacebar, escape to close, and arrow keys for navigation (desktop only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !items || items.length === 0) return;

      if (event.code === 'Space' || event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (typeof window !== 'undefined' && window.innerWidth > 768) {
        // Only allow arrow key navigation on desktop
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          navigateToPrevious();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          navigateToNext();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, items, currentItemIndex, navigateToPrevious, navigateToNext]);

  // Detect image aspect ratio when it loads
  useEffect(() => {
    if (!currentItem?.image) {
      setImageLoaded(false);
      setImageAspectRatio(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      setImageAspectRatio(aspectRatio);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageLoaded(true);
      setImageAspectRatio(null);
    };
    img.src = currentItem.image;
  }, [currentItem?.image]);
  
  if (!currentItem) return null;

  const itemName = currentItem.names?.[lang] || currentItem.names?.en || 'Item';
  const hasVariants = currentItem.variants && currentItem.variants.length > 0;
  
  // Get price based on selected size
  const getDisplayPrice = () => {
    if (hasVariants && selectedSize) {
      const variant = currentItem.variants?.find(v => v.size === selectedSize);
      return variant?.price || currentItem.price;
    }
    return currentItem.price;
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedSize) {
      // Auto-select first size if none selected
      const firstSize = currentItem.variants![0].size;
      const firstPrice = currentItem.variants![0].price;
      onAdd(firstSize, firstPrice);
    } else if (hasVariants && selectedSize) {
      const variant = currentItem.variants?.find(v => v.size === selectedSize);
      onAdd(selectedSize, variant?.price);
    } else {
      onAdd();
    }
    onClose();
  };

  // Handle swipe gestures for mobile
  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    // Close on swipe down with sufficient distance or velocity
    if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
      onClose();
    }
    // Navigate on horizontal swipes - only on mobile devices
    else if (typeof window !== 'undefined' && window.innerWidth <= 768 && items && items.length > 1) {
      if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
        if (offset.x > 0 || velocity.x > 0) {
          navigateToPrevious(); // Swipe right = previous
        } else {
          navigateToNext(); // Swipe left = next
        }
      }
    }
    
    setIsDragging(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Auto-select first size on open
  if (hasVariants && !selectedSize && currentItem.variants) {
    setSelectedSize(currentItem.variants[0].size);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ opacity: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            title="Click anywhere to close"
          >
            {/* Visual hint for mobile users */}
            <div className="absolute top-4 left-4 text-white/70 text-sm hidden sm:block">
              Click background to close
            </div>
          </motion.div>

          {/* Dialog */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" 
            ref={dragConstraintsRef}
            onClick={(e) => {
              // Only close if clicking the container itself, not the dialog
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="item-preview-title"
              aria-describedby="item-preview-price"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: isDragging ? 0 : 0 
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              drag={items && items.length > 1 && typeof window !== 'undefined' && window.innerWidth <= 768 ? true : "y"}
              dragConstraints={dragConstraintsRef}
              dragElastic={{ 
                top: 0, 
                bottom: 0.2, 
                left: items && items.length > 1 && typeof window !== 'undefined' && window.innerWidth <= 768 ? 0.1 : 0, 
                right: items && items.length > 1 && typeof window !== 'undefined' && window.innerWidth <= 768 ? 0.1 : 0 
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              dragMomentum={false}
            >
              {/* Mobile Drag Handle */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 w-12 h-1.5 bg-muted-foreground/30 rounded-full sm:hidden" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Buttons - Only show on desktop if there are multiple items */}
              {items && items.length > 1 && typeof window !== 'undefined' && window.innerWidth > 768 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={navigateToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors touch-manipulation"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={navigateToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors touch-manipulation"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image - Adaptive Height */}
              <div className="relative bg-muted/30 overflow-hidden">
                {currentItem.image ? (
                  <div 
                    className="relative w-full flex items-center justify-center"
                    style={{ 
                      aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '4/3',
                      minHeight: '180px',
                      maxHeight: imageAspectRatio && imageAspectRatio < 1 ? '50vh' : '40vh'
                    }}
                  >
                    <ImageWithFallback
                      src={currentItem.image}
                      alt={itemName}
                      className="max-w-full max-h-full object-contain"
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 sm:h-64 md:h-72 flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl md:text-8xl">🍽️</span>
                  </div>
                )}

                {/* Item Counter - Only show if there are multiple items */}
                {items && items.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    {currentItemIndex + 1} / {items.length}
                  </div>
                )}
              </div>

              {/* Content - Mobile Optimized */}
              <div className="p-3 sm:p-4 space-y-3">
                {/* Title and Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 text-start">
                    <h2 id="item-preview-title" className="text-lg sm:text-2xl font-medium">
                      {itemName}
                    </h2>
                    {categoryName && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {categoryName}
                      </p>
                    )}
                  </div>
                  <div id="item-preview-price" className="text-lg sm:text-xl font-medium text-primary whitespace-nowrap">
                    ₺{getDisplayPrice().toFixed(2)}
                  </div>
                </div>

                {/* Size Selection - Only show if item has variants */}
                {hasVariants && (
                  <div className="space-y-1.5 text-start">
                    <p className="text-sm font-medium">
                      {t('selectSize', lang)}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {currentItem.variants!.map((variant) => (
                        <button
                          key={variant.size}
                          onClick={() => setSelectedSize(variant.size)}
                          className={`
                            p-2 sm:p-2.5 rounded-lg border-2 transition-all touch-manipulation min-h-[50px] sm:min-h-auto
                            ${selectedSize === variant.size
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 active:border-primary/70'
                            }
                          `}
                        >
                          <div className="text-xs sm:text-sm font-medium">{translateSize(variant.size, lang)}</div>
                          <div className="text-xs text-primary font-medium mt-0.5">
                            ₺{variant.price.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {currentItem.tags && currentItem.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap pt-2">
                    {currentItem.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary/70 text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base gap-2 rounded-xl mt-2 touch-manipulation"
                  size="lg"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t('add', lang)}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

export default ItemPreview;
