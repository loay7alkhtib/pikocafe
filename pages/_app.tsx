import type { AppProps } from 'next/app'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LangProvider } from '../src/lib/LangContext'
import { CartProvider } from '../src/lib/CartContext'
import { DataProvider } from '../src/lib/DataContext'
import { createQueryClient } from '../src/lib/queryClient'
import { Toaster } from '../src/components/ui/sonner'
import LanguageWrapper from '../src/components/LanguageWrapper'
import { PerformanceMonitor } from '../src/components/PerformanceMonitor'
import ErrorBoundary from '../src/components/ErrorBoundary'
import '../src/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  // Create a new QueryClient instance for each user session
  const [queryClient] = useState(() => createQueryClient())

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          <LanguageWrapper>
            <DataProvider>
              <CartProvider>
                <div className="min-h-screen bg-background text-foreground">
                  <Component {...pageProps} />
                </div>
                <Toaster position="bottom-center" />
                <PerformanceMonitor />
              </CartProvider>
            </DataProvider>
          </LanguageWrapper>
        </LangProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
