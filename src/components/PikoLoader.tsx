import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Progress } from './ui/progress';
import { useLang } from '../lib/LangContext';
import { t, dirFor } from '../lib/i18n';
import svgPaths from '../imports/svg-8vv1jmhkim';

export default function PikoLoader() {
  const [progress, setProgress] = useState(0);
  const { lang } = useLang();

  useEffect(() => {
    // Simulate loading progress with a more realistic curve
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        // Fast at first, then slower
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const getLoadingMessage = () => {
    if (progress < 30) return t('loadingMenu', lang);
    if (progress < 60) return t('fetchingCategories', lang);
    if (progress < 90) return t('loadingItems', lang);
    return t('almostReady', lang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-primary/5 p-6 overflow-hidden relative" dir={dirFor(lang)}>
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* More food emojis with varied animations */}
        <motion.div
          className="absolute text-6xl opacity-20"
          initial={{ x: -100, y: 100, rotate: 0, scale: 0.5 }}
          animate={{ 
            x: ['0%', '100%'],
            y: ['0%', '-30%', '0%'],
            rotate: [0, 360],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: '10%', top: '20%' }}
        >
          🥐
        </motion.div>
        
        <motion.div
          className="absolute text-5xl opacity-20"
          initial={{ x: 100, y: -100, rotate: 0, scale: 0.8 }}
          animate={{ 
            x: ['-100%', '0%'],
            y: ['100%', '20%', '100%'],
            rotate: [360, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ right: '15%', top: '60%' }}
        >
          ☕
        </motion.div>
        
        <motion.div
          className="absolute text-4xl opacity-20"
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{ 
            x: ['100%', '-100%'],
            y: ['50%', '0%', '50%'],
            rotate: [0, -360],
            scale: [0.6, 1.1, 0.6]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{ left: '60%', top: '80%' }}
        >
          🧁
        </motion.div>
        
        <motion.div
          className="absolute text-5xl opacity-20"
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.7 }}
          animate={{ 
            x: ['-50%', '150%'],
            y: ['80%', '20%', '80%'],
            rotate: [0, 180],
            scale: [0.7, 1.3, 0.7]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ left: '30%', top: '10%' }}
        >
          🍰
        </motion.div>

        {/* Additional tempting food items */}
        <motion.div
          className="absolute text-4xl opacity-15"
          initial={{ x: -50, y: 200, rotate: 0, scale: 0.4 }}
          animate={{ 
            x: ['0%', '120%'],
            y: ['100%', '0%', '100%'],
            rotate: [0, 270, 360],
            scale: [0.4, 1, 0.4]
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{ left: '20%', top: '70%' }}
        >
          🥞
        </motion.div>

        <motion.div
          className="absolute text-3xl opacity-15"
          initial={{ x: 150, y: -50, rotate: 0, scale: 0.5 }}
          animate={{ 
            x: ['-100%', '0%'],
            y: ['0%', '120%', '0%'],
            rotate: [0, -180, -360],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          style={{ right: '25%', top: '30%' }}
        >
          🍪
        </motion.div>

        <motion.div
          className="absolute text-4xl opacity-15"
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.3 }}
          animate={{ 
            x: ['80%', '-80%'],
            y: ['0%', '100%', '0%'],
            rotate: [0, 360, 720],
            scale: [0.3, 1.1, 0.3]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          style={{ left: '70%', top: '15%' }}
        >
          🥨
        </motion.div>

        <motion.div
          className="absolute text-3xl opacity-15"
          initial={{ x: -80, y: 0, rotate: 0, scale: 0.6 }}
          animate={{ 
            x: ['0%', '100%', '0%'],
            y: ['100%', '0%', '100%'],
            rotate: [0, -270, -540],
            scale: [0.6, 1, 0.6]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          style={{ left: '40%', top: '50%' }}
        >
          🥯
        </motion.div>

        {/* Floating steam effects */}
        <motion.div
          className="absolute text-2xl opacity-10"
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: '45%', top: '40%' }}
        >
          💨
        </motion.div>
        
        <motion.div
          className="absolute text-2xl opacity-10"
          animate={{
            y: [0, -25, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ right: '40%', top: '45%' }}
        >
          💨
        </motion.div>

        {/* Sparkle effects */}
        <motion.div
          className="absolute text-xl opacity-20"
          animate={{
            rotate: [0, 360],
            scale: [0.5, 1, 0.5],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ left: '15%', top: '35%' }}
        >
          ✨
        </motion.div>
        
        <motion.div
          className="absolute text-xl opacity-20"
          animate={{
            rotate: [360, 0],
            scale: [1, 0.5, 1],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ right: '20%', top: '25%' }}
        >
          ✨
        </motion.div>

        <motion.div
          className="absolute text-lg opacity-15"
          animate={{
            rotate: [0, 360],
            scale: [0.3, 1.2, 0.3],
            opacity: [0.1, 0.5, 0.1]
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ left: '80%', top: '60%' }}
        >
          ✨
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
        {/* Enhanced Animated Piko Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            opacity: 1
          }}
          transition={{ 
            type: "spring", 
            stiffness: 150, 
            damping: 15,
            duration: 1.2
          }}
          className="relative"
        >
          {/* Multiple glow effects */}
          <motion.div
            className="absolute -inset-6 bg-gradient-to-r from-amber-400/30 via-orange-400/30 to-yellow-400/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute -inset-4 bg-primary/25 rounded-full blur-2xl"
            animate={{
              scale: [1.1, 1.4, 1.1],
              opacity: [0.3, 0.7, 0.3],
              rotate: [360, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          {/* Pulsing ring */}
          <motion.div
            className="absolute -inset-2 border-2 border-primary/40 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Logo with enhanced animation */}
          <motion.div 
            className="relative w-24 h-24 sm:w-32 sm:h-32"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg className="block size-full drop-shadow-2xl" fill="none" preserveAspectRatio="none" viewBox="0 0 128 128">
              <g id="Piko Logo">
                <path d={svgPaths.p3e90c600} fill="#0C6071" />
                <path clipRule="evenodd" d={svgPaths.p29fb7080} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.p369c6600} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.pfa1e300} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.p6e0fd80} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.p299cc9d0} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.p10436b80} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.p5c92a80} fill="white" fillRule="evenodd" />
                <path d={svgPaths.p1d29df00} fill="white" />
                <path d={svgPaths.p1b39fe00} fill="white" />
                <path d={svgPaths.p135d2f0} fill="white" />
                <path d={svgPaths.p468fa00} fill="white" />
                <path d={svgPaths.p1af13470} fill="white" />
                <path d={svgPaths.p38aa3880} fill="white" />
                <path d={svgPaths.p8a30580} fill="white" />
                <path d={svgPaths.p39122d80} fill="white" />
                <path d={svgPaths.p3d44af00} fill="white" />
                <path d={svgPaths.p26000900} fill="white" />
                <path d={svgPaths.p268c0f70} fill="white" />
                <path d={svgPaths.p2cf33d80} fill="white" />
                <path d={svgPaths.p207a7a00} fill="white" />
                <path d={svgPaths.p28032c00} fill="white" />
                <path d={svgPaths.p27038480} fill="white" />
                <path d={svgPaths.p3412e680} fill="white" />
                <path d={svgPaths.p293a0a00} fill="white" />
                <path d={svgPaths.p34cb6100} fill="white" />
                <path d={svgPaths.p2d413c80} fill="white" />
                <path d={svgPaths.p237b5e00} fill="white" />
                <path d={svgPaths.p27cc4400} fill="white" />
                <path d={svgPaths.p1b9c0300} fill="white" />
                <path d={svgPaths.p18b77b00} fill="white" />
                <path d={svgPaths.p1466cc00} fill="white" />
                <path d={svgPaths.p3faa8c80} fill="white" />
                <path d={svgPaths.p2a859280} fill="white" />
                <path d={svgPaths.p1aff7700} fill="white" />
              </g>
            </svg>
          </motion.div>
        </motion.div>

        {/* Enhanced loading text with tempting animations */}
        <motion.div 
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h2 
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0%', '100%', '0%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 100%'
            }}
          >
            {t('brandName', lang)}
          </motion.h2>
          
          <motion.p 
            className="text-sm text-muted-foreground font-medium"
            animate={{ 
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {t('preparingMenu', lang)}
          </motion.p>
          
          {/* Tempting subtitle */}
          <motion.p 
            className="text-xs text-amber-600 dark:text-amber-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            {lang === 'en' ? '✨ Fresh pastries brewing... ✨' :
             lang === 'tr' ? '✨ Taze hamur işleri hazırlanıyor... ✨' :
             '✨ المعجنات الطازجة تُحضر... ✨'}
          </motion.p>
        </motion.div>

        {/* Enhanced Progress bar */}
        <motion.div 
          className="w-full space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          {/* Custom progress bar with gradient */}
          <div className="relative w-full h-3 bg-muted/30 rounded-full overflow-hidden border border-primary/20">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <motion.span
              key={progress}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-primary"
            >
              {progress}%
            </motion.span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-medium"
            >
              {getLoadingMessage()}
            </motion.span>
          </div>
        </motion.div>

        {/* Enhanced fun loading indicators */}
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              animate={{
                y: [0, -15, 0],
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Additional tempting message */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <motion.p 
            className="text-xs text-amber-700 dark:text-amber-300 font-medium"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          >
            {lang === 'en' ? '🍰 Something delicious is coming... 🍰' :
             lang === 'tr' ? '🍰 Lezzetli bir şey geliyor... 🍰' :
             '🍰 شيء لذيذ قادم... 🍰'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
