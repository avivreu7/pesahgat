import type { Metadata } from 'next'
import ElijahChat from './ElijahChat'

export const metadata: Metadata = {
  title: 'אליהו הנביא 🧙‍♂️ | פסח בקיבוץ',
}

export default function ElijahPage() {
  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6">
      <a href="/" className="self-start text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      {/* Header */}
      <div className="text-center mb-5 fade-in">
        <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: 8 }}>🧙‍♂️</div>
        <h1 className="heading-hero mb-1">אליהו הנביא</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          בקר אצלנו בקיבוץ גת לליל הסדר – שאל אותו כל דבר!
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(212,168,67,0.15)', borderRadius: 9999,
          padding: '4px 14px', marginTop: 10,
          border: '1px solid rgba(212,168,67,0.35)',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--wheat)', letterSpacing: '0.05em' }}>
            ✨ מופעל ע״י בינה מלאכותית
          </span>
        </div>
      </div>

      {/* Chat container */}
      <div className="glass p-4 sm:p-6 flex-1 flex flex-col fade-in">
        <ElijahChat />
      </div>
    </main>
  )
}
