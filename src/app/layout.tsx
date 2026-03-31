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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-card)', opacity: 0.7, marginBottom: 12 }}>
            נבנה באהבה לקיבוץ גת ❤️ · 2026
          </p>

          {/* Business card */}
          <a
            href="https://avivdigitalsolutions.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              maxWidth: 280,
              width: '100%',
              padding: '12px 20px',
              background: 'rgba(255,252,240,0.72)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212,168,67,0.35)',
              borderRadius: '1rem',
              boxShadow: '0 2px 12px rgba(90,55,10,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
              textDecoration: 'none',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            className="footer-biz-card"
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>⚡</span>
            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--wheat)', letterSpacing: '0.01em' }}>
              Aviv Digital Solutions
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              פתרונות דיגיטליים לאירועים ולעסקים
            </span>
            <span style={{
              marginTop: 4,
              fontSize: '0.68rem', fontWeight: 700,
              color: 'var(--wine)',
              border: '1px solid rgba(139,38,53,0.25)',
              borderRadius: 999,
              padding: '2px 10px',
              letterSpacing: '0.03em',
            }}>
              גלו עוד →
            </span>
          </a>
        </footer>
      </body>
    </html>
  )
}
