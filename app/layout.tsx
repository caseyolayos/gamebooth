import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import DesktopNav from '@/components/DesktopNav'
import OnboardingModal from '@/components/OnboardingModal'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  verification: {
    google: '9G9RdHjDhcrBnHgN5ePgG-H4v8F4Mh_yfVV3O_FF7M0',
  },
  title: 'GameBooth — Mute the TV. Pick Your Booth.',
  description: 'Live fan commentary for every game. Pick your broadcaster, sync to the game clock, and watch with your crew.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GameBooth',
  },
  openGraph: {
    title: 'GameBooth',
    description: 'Mute the TV. Pick Your Booth.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q92CLF7LJS" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-Q92CLF7LJS');`,
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GameBooth" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen" style={{ background: '#0a0a0f' }}>
        <AuthProvider>
          <OnboardingModal />
          <div className="lg:flex lg:min-h-screen">
            <DesktopNav />
            <main className="flex-1 min-w-0 pb-24 lg:pb-0">
              {children}
            </main>
          </div>
          <div className="lg:hidden">
            <BottomNav />
          </div>
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
