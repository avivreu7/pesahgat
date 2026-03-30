import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import QuiltDrawing from './QuiltDrawing'
import QuiltGallery from './QuiltGallery'

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

      {/* ── Community quilt gallery — live-polling client component ── */}
      <QuiltGallery initial={drawings} />

      {/* ── Drawing form ── */}
      <section className="fade-in">
        <h2 className="heading-section mb-4 text-center">✏️ הוסיפו את הטלאי שלכם</h2>
        <QuiltDrawing initial={drawings} />
      </section>
    </main>
  )
}
