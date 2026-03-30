import type { Metadata, Viewport } from 'next'
import { Assistant } from 'next/font/google'
import './globals.css'
import ReactionsBar from '@/components/ReactionsBar'
import PassoverParticles from '@/components/PassoverParticles'
import NewsTicker from '@/components/NewsTicker'
import SiteLockOverlay from '@/components/SiteLockOverlay'
import { createClient } from '@/lib/supabase/server'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let siteLocked = false
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('settings').select('site_locked').eq('id', 1).maybeSingle()
    siteLocked = !!(data as { site_locked?: boolean } | null)?.site_locked
  } catch { /* settings table may not have site_locked column yet */ }

  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="font-(family-name:--font-assistant) min-h-dvh">
        <div className="seder-bg" aria-hidden="true" />
        <PassoverParticles />
        <NewsTicker />
        <SiteLockOverlay locked={siteLocked} />
        {children}
        <ReactionsBar />
        <footer style={{
          textAlign: 'center', padding: '20px 16px 96px',
          borderTop: '1px solid rgba(212,168,67,0.25)',
          marginTop: 8,
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-card)', opacity: 0.7, marginBottom: 4 }}>
            נבנה באהבה לקיבוץ גת ❤️ · 2026
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-card)', opacity: 0.65 }}>
            רוצים פתרון דיגיטלי דומה לאירוע שלכם?{' '}
            <a
              href="https://avivdigitalsolutions.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--wine)', fontWeight: 800, textDecoration: 'underline' }}
            >
              Aviv Digital Solutions
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
