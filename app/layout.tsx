import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-context'
import { Toaster } from 'sonner'
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import { CursorSpotlight } from '@/components/cursor-spotlight'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CertiGuard - AI Fake Certificate Verification',
  description: 'Premium certificate verification with liquid glass analysis',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground selection:bg-white/20 relative`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SmoothScrollProvider>
            <AuthProvider>
              <CursorSpotlight />
              {children}
              <Toaster richColors position="top-right" theme="system" closeButton />
            </AuthProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}