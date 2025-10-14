import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t } from '../lib/i18n';
import { Item } from '../lib/supabase';
import { Sparkles, Shuffle } from 'lucide-react';

interface LuckyButtonProps {
  onItemSelected?: (item: Item) => void;
}

const LuckyButton = ({ onItemSelected }: LuckyButtonProps) => {
  const router = useRouter();
  const { lang } = useLang();
  const { categories, getCategoryItems } = useData();
  const [isSpinning, setIsSpinning] = useState(false);

  // Get all items from all categories
  const allItems = useMemo(() => {
    const items: Item[] = [];
    
    // Collect items from all categories
    if (categories && getCategoryItems) {
      categories.forEach(category => {
        const categoryItems = getCategoryItems(category.id);
        items.push(...categoryItems);
      });
    }
    
    return items;
  }, [categories, getCategoryItems]);


  const handleLuckySpin = useCallback(() => {
    if (allItems.length === 0) {
      return;
    }

    setIsSpinning(true);

    // Pick a random item
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    
    // Find the category for this item
    const itemCategory = categories.find(cat => 
      getCategoryItems(cat.id).some(item => item.id === randomItem.id)
    );

    // Call callback if provided
    if (onItemSelected) {
      onItemSelected(randomItem);
    }

    // Redirect to the category page with the selected item highlighted
    if (itemCategory) {
      router.push(`/category/${itemCategory.id}?lucky=${randomItem.id}`);
    }

    setIsSpinning(false);
  }, [allItems, categories, getCategoryItems, onItemSelected, router]);

  const getLuckyText = () => {
    const texts = {
      en: ['Feeling Lucky?', 'Surprise Me!', 'Lucky Dip!', 'Random Pick!', 'Magic Choice!'],
      tr: ['Şanslı Hissediyor musun?', 'Sürpriz Yap!', 'Şanslı Seçim!', 'Rastgele Seç!', 'Büyülü Seçim!'],
      ar: ['تشعر بالحظ؟', 'فاجئني!', 'اختيار محظوظ!', 'اختيار عشوائي!', 'اختيار سحري!']
    };
    const langTexts = texts[lang as keyof typeof texts] || texts.en;
    return langTexts[Math.floor(Math.random() * langTexts.length)];
  };

  // Don't show if no items available
  if (!allItems || allItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p className="text-sm">
          {lang === 'en' ? 'No items available for lucky selection' :
           lang === 'tr' ? 'Şanslı seçim için ürün bulunmuyor' :
           'لا توجد عناصر متاحة للاختيار المحظوظ'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={handleLuckySpin}
        disabled={isSpinning}
        className="h-14 px-8 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white shadow-xl"
      >
        <div className="flex items-center gap-2">
          {isSpinning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                <Shuffle className="w-6 h-6" />
              </motion.div>
              <span>
                {lang === 'en' ? 'Picking...' :
                 lang === 'tr' ? 'Seçiliyor...' :
                 'جاري الاختيار...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>{getLuckyText()}</span>
            </>
          )}
        </div>
      </Button>
    </motion.div>
  );
};

export default LuckyButton;
