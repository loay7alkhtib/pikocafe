import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import PikoLogo from './PikoLogo';
import LangToggle from './LangToggle';
import { useLang } from '../lib/LangContext';
import { useCart } from '../lib/CartContext';
import { t } from '../lib/i18n';
import { ShoppingBag, User } from 'lucide-react';
import CartSheet from './CartSheet';
import { authAPI } from '../lib/supabase';

interface NavBarProps {
  onLogoTripleTap?: () => void;
  showAccountIcon?: boolean;
}

const NavBar = memo(function NavBar({ onLogoTripleTap, showAccountIcon = true }: NavBarProps) {
  const router = useRouter();
  const { lang } = useLang();
  const { items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  
  // Memoize expensive calculation
  const itemCount = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0), 
    [items]
  );

  useEffect(() => {
    checkSession();
    
    // Check session periodically to detect login/logout from other components
    const interval = setInterval(checkSession, 2000);
    return () => clearInterval(interval);
  }, []);

  async function checkSession() {
    try {
      const { data } = await authAPI.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    }
  }

  async function handleLogout() {
    await authAPI.signOut();
    setUser(null);
    router.push('/');
  }

  return (
    <>
      <header className="w-full bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <PikoLogo onTripleTap={onLogoTripleTap} />
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium truncate">
              {t('brandName', lang)}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <LangToggle />
            
            {showAccountIcon && (
              <>
                {user ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline text-sm text-muted-foreground">{user.name || user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 sm:p-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-all active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
                      aria-label="Logout"
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="p-2.5 sm:p-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-all active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
                    aria-label="Login"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center justify-center p-2.5 sm:p-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all duration-300 transition-gentle active:scale-95 focus:ring-2 focus:ring-ring touch-manipulation min-h-[44px] min-w-[44px]"
              aria-label={t('myList', lang)}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] sm:text-xs flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
});

export default NavBar;
