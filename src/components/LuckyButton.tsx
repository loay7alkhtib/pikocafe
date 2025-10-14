import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { useCart } from '../lib/CartContext';
import { t } from '../lib/i18n';
import { Item } from '../lib/supabase';
import { 
  Sparkles, 
  Shuffle, 
  Star, 
  Heart, 
  Zap, 
  Crown, 
  Gift,
  Rainbow,
  PartyPopper,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';

interface LuckyButtonProps {
  onItemSelected?: (item: Item) => void;
}

const LuckyButton = ({ onItemSelected }: LuckyButtonProps) => {
  const { lang } = useLang();
  const { categories, getCategoryItems } = useData();
  const { addItem } = useCart();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showResult, setShowResult] = useState(false);

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

  const magicIcons = [
    <Sparkles className="w-5 h-5" key="sparkles" />,
    <Shuffle className="w-5 h-5" key="shuffle" />,
    <Star className="w-5 h-5" key="star" />,
    <Heart className="w-5 h-5" key="heart" />,
    <Zap className="w-5 h-5" key="zap" />,
    <Crown className="w-5 h-5" key="crown" />,
    <Gift className="w-5 h-5" key="gift" />,
    <Rainbow className="w-5 h-5" key="rainbow" />,
    <PartyPopper className="w-5 h-5" key="party" />,
    <Wand2 className="w-5 h-5" key="wand" />
  ];

  const getRandomIcon = () => magicIcons[Math.floor(Math.random() * magicIcons.length)];

  const handleLuckySpin = useCallback(async () => {
    if (allItems.length === 0) {
      toast.error('No items available for lucky selection');
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setSelectedItem(null);

    // Create suspense with multiple rapid selections
    const spinDuration = 3000; // 3 seconds
    const spinInterval = 100; // Change every 100ms
    
    let currentIndex = 0;
    const spinTimer = setInterval(() => {
      currentIndex = Math.floor(Math.random() * allItems.length);
      setSelectedItem(allItems[currentIndex]);
    }, spinInterval);

    // Stop spinning and show final result
    setTimeout(() => {
      clearInterval(spinTimer);
      const finalItem = allItems[Math.floor(Math.random() * allItems.length)];
      setSelectedItem(finalItem);
      setShowResult(true);
      setIsSpinning(false);

      // Add to cart automatically
      addItem({
        id: finalItem.id,
        name: finalItem.names[lang] || finalItem.names.en,
        price: finalItem.price,
        quantity: 1,
        image: finalItem.image || undefined,
      });

      // Show success message
      toast.success(
        lang === 'en' ? `🎉 Lucky choice: ${finalItem.names.en}!` :
        lang === 'tr' ? `🎉 Şanslı seçim: ${finalItem.names.tr || finalItem.names.en}!` :
        `🎉 اختيار محظوظ: ${finalItem.names.ar || finalItem.names.en}!`,
        { duration: 5000 }
      );

      // Call callback if provided
      if (onItemSelected) {
        onItemSelected(finalItem);
      }
    }, spinDuration);
  }, [allItems, lang, addItem, onItemSelected]);

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
    <div className="relative">
      {/* Lucky Button */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleLuckySpin}
          disabled={isSpinning}
          className={`
            relative overflow-hidden h-14 px-8 rounded-2xl font-bold text-lg
            bg-gradient-to-r from-purple-500 via-pink-500 to-red-500
            hover:from-purple-600 hover:via-pink-600 hover:to-red-600
            text-white shadow-2xl
            ${isSpinning ? 'animate-pulse' : ''}
          `}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
            animate={{
              x: isSpinning ? [-100, 100] : 0,
              opacity: isSpinning ? [0.5, 1, 0.5] : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpinning ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          
          {/* Floating magic particles */}
          <AnimatePresence>
            {isSpinning && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-300"
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      opacity: 0,
                      scale: 0 
                    }}
                    animate={{
                      x: Math.random() * 200 - 100,
                      y: Math.random() * 200 - 100,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: 360
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    {getRandomIcon()}
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Button content */}
          <div className="relative z-10 flex items-center gap-2">
            {isSpinning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                >
                  <Wand2 className="w-6 h-6" />
                </motion.div>
                <span>
                  {lang === 'en' ? 'Spinning...' :
                   lang === 'tr' ? 'Döndürülüyor...' :
                   'جاري الدوران...'}
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

      {/* Result Display */}
      <AnimatePresence>
        {showResult && selectedItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-6 rounded-3xl shadow-2xl text-white text-center max-w-sm">
              {/* Celebration particles */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    initial={{
                      x: Math.random() * 300,
                      y: Math.random() * 200,
                      opacity: 0
                    }}
                    animate={{
                      y: [0, -100],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl mb-2"
                >
                  🎉
                </motion.div>
                
                <h3 className="text-xl font-bold mb-2">
                  {lang === 'en' ? 'Your Lucky Choice!' :
                   lang === 'tr' ? 'Şanslı Seçiminiz!' :
                   'اختيارك المحظوظ!'}
                </h3>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <div className="text-2xl mb-2">{selectedItem.names[lang] || selectedItem.names.en}</div>
                  <div className="text-lg font-bold">₺{selectedItem.price.toFixed(2)}</div>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-sm opacity-90"
                >
                  {lang === 'en' ? 'Added to your cart!' :
                   lang === 'tr' ? 'Sepetinize eklendi!' :
                   'تم إضافته إلى سلة التسوق!'}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyButton;
