import type { Metadata } from 'next'
import ElijahMap from './ElijahMap'

export const metadata: Metadata = { title: 'אליהו השליח 🗺️ | פסח בקיבוץ' }

export default function ElijahMapPage() {
  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6 gap-4">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">🗺️</p>
        <h1 className="heading-hero mb-1">אליהו השליח</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          עקבו אחרי אליהו הנביא בקיבוץ גת בזמן אמת
        </p>
      </header>

      <ElijahMap />
    </main>
  )
}
