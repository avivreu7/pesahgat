import type { Metadata, Viewport } from 'next'
import { Assistant } from 'next/font/google'
import './globals.css'
import ReactionsBar from '@/components/ReactionsBar'
import PassoverParticles from '@/components/PassoverParticles'
import NewsTicker from '@/components/NewsTicker'

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
        <NewsTicker />
        {children}
        <ReactionsBar />
        <footer style={{
          textAlign: 'center', padding: '20px 16px 96px',
          borderTop: '1px solid rgba(212,168,67,0.2)',
          marginTop: 8,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            נבנה באהבה לקיבוץ גת ❤️ · 2026
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            רוצים פתרון דיגיטלי דומה לאירוע שלכם?{' '}
            <a
              href="https://avivdigitalsolutions.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--wheat)', fontWeight: 700, textDecoration: 'none' }}
            >
              avivdigitalsolutions.vercel.app
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
