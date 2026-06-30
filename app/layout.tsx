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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground selection:bg-white/20 relative`}>
        <SmoothScrollProvider>
          <AuthProvider>
            <CursorSpotlight />
            {children}
            <Toaster richColors position="top-right" theme="dark" closeButton />
          </AuthProvider>
        </SmoothScrollProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}