import type { Metadata, Viewport } from 'next'
import { Assistant } from 'next/font/google'
import './globals.css'
import ReactionsBar from '@/components/ReactionsBar'
import PassoverParticles from '@/components/PassoverParticles'

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-assistant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'פסח שמח! 🍷',
  description: 'חגיגת ליל הסדר – ברכות, אפיקומן ואטרקציות',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C9A84C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="font-[family-name:var(--font-assistant)] min-h-dvh">
        <div className="seder-bg" aria-hidden="true" />
        <PassoverParticles />
        {children}
        <ReactionsBar />
      </body>
    </html>
  )
}
