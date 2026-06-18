import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-context'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CertiGuard - AI Fake Certificate Verification System',
  description: 'Detect fake certificates in seconds using advanced AI-powered verification technology',
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground selection:bg-neon-blue/30`}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" theme="dark" closeButton />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
