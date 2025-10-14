import type { AppProps } from 'next/app'
import { LangProvider } from '../src/lib/LangContext'
import { CartProvider } from '../src/lib/CartContext'
import { DataProvider } from '../src/lib/DataContext'
import { Toaster } from '../src/components/ui/sonner'
import LanguageWrapper from '../src/components/LanguageWrapper'
import '../src/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LangProvider>
      <LanguageWrapper>
        <DataProvider>
          <CartProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Component {...pageProps} />
            </div>
            <Toaster position="bottom-center" />
          </CartProvider>
        </DataProvider>
      </LanguageWrapper>
    </LangProvider>
  )
}
