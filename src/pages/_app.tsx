import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/contexts/CartContext'
import NoFooterLayout from '@/components/NoFooterLayout'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <CartProvider>
        <NoFooterLayout>
          <Component {...pageProps} />
        </NoFooterLayout>
      </CartProvider>
    </SessionProvider>
  )
} 