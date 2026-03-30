import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import KneidlachCounter from '@/components/KneidlachCounter'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'קניידלך הקיבוץ 🫕 | פסח בקיבוץ גת' }

export default async function KneidlachPage() {
  const supabase = await createClient()
  const { data: makers } = await supabase
    .from('kneidlach_makers')
    .select('maker_name, count')
    .order('count', { ascending: false })

  const makerList = makers ?? []
  const initial = {
    makers: makerList,
    total:  makerList.reduce((s: number, m: { count: number }) => s + m.count, 0),
  }

  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6 gap-8">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">🫕</p>
        <h1 className="heading-hero mb-1">קניידלך הקיבוץ</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          כמה קניידלך הכנו הלילה? לחצו כל פעם שאתם מכינים!
        </p>
      </header>

      <KneidlachCounter initial={initial} />
    </main>
  )
}
