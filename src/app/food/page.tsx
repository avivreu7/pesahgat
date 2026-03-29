import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import FoodMarket from './FoodMarket'

export const metadata: Metadata = { title: 'יד 2 של החג 🍽 | פסח בקיבוץ' }

export default async function FoodPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('food_items')
    .select('id, title, description, image_url, offered_by, is_available, price, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6 gap-6">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">🍽</p>
        <h1 className="heading-hero mb-1">יד 2 של החג</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          הציעו מנות לחברים – מי שהכין יותר מדי מציע, מי שרוצה לוקח 😄
        </p>
      </header>

      <FoodMarket initial={data ?? []} />
    </main>
  )
}
