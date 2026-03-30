import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import QuiltDrawing from './QuiltDrawing'
import QuiltSouvenir from './QuiltSouvenir'

export const metadata: Metadata = { title: 'שמיכת הטלאים 🎨 | פסח בקיבוץ' }

export default async function QuiltPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quilt_drawings')
    .select('id, family_name, image_url, created_at')
    .order('created_at', { ascending: true })

  const drawings = data ?? []

  return (
    <main className="min-h-dvh flex flex-col max-w-3xl mx-auto px-4 py-6 gap-8">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">🎨</p>
        <h1 className="heading-hero mb-1">שמיכת הטלאים</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          כל משפחה מציירת טלאי אחד – יחד יוצרים מזכרת משותפת לפסח 2026
        </p>
      </header>

      {/* ── Community quilt gallery — shown first so everyone sees it ── */}
      {drawings.length > 0 && (
        <section className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-section">🧵 שמיכת הקיבוץ ({drawings.length} טלאים)</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 6,
          }}>
            {drawings.map(d => (
              <div key={d.id} style={{
                borderRadius: '0.5rem', overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
                border: '2px solid rgba(212,168,67,0.35)',
              }}>
                <img
                  src={d.image_url}
                  alt={`ציור של משפחת ${d.family_name}`}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  background: 'rgba(255,252,235,0.92)', padding: '4px 8px',
                  fontSize: '0.65rem', fontWeight: 700, color: 'var(--wheat)',
                  textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {d.family_name}
                </div>
              </div>
            ))}
          </div>

          {/* Download souvenir */}
          <div className="mt-5">
            <QuiltSouvenir drawings={drawings} />
          </div>
        </section>
      )}

      {/* ── Drawing form ── */}
      <section className="fade-in">
        <h2 className="heading-section mb-4 text-center">✏️ הוסיפו את הטלאי שלכם</h2>
        <QuiltDrawing initial={drawings} />
      </section>

      {drawings.length === 0 && (
        <p className="text-center text-sm py-4 fade-in" style={{ color: 'var(--text-muted)' }}>
          אין ציורים עדיין — היו הראשונים לצייר! 🎨
        </p>
      )}
    </main>
  )
}
