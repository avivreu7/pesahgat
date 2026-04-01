import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import StockMarket from './StockMarket'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'בורסת החג 📈 | פסח בקיבוץ' }

export default async function StockPage() {
  let initialStocks = []
  let initialHistory: Record<string, { price: number; recorded_at: string }[]> = {}

  try {
    const supabase = createAdminClient()

    const { data: stocks } = await supabase
      .from('holiday_stocks')
      .select('*')
      .order('symbol')

    const since = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    const { data: historyRows } = await supabase
      .from('stock_price_history')
      .select('stock_symbol, price, recorded_at')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })

    initialStocks = stocks ?? []

    for (const row of historyRows ?? []) {
      if (!initialHistory[row.stock_symbol]) initialHistory[row.stock_symbol] = []
      initialHistory[row.stock_symbol].push({ price: Number(row.price), recorded_at: row.recorded_at })
    }
  } catch { /* DB may not exist yet */ }

  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6 gap-4">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">📈</p>
        <h1 className="heading-hero mb-1">בורסת החג</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block',
            boxShadow: '0 0 0 0 rgba(34,197,94,0.6)', animation: 'liveDotPulse 1.5s ease-out infinite',
          }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            מסחר חי בנכסי החג
          </span>
          <span style={{
            fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.1em',
            background: 'rgba(34,197,94,0.15)', color: '#16a34a',
            border: '1px solid rgba(34,197,94,0.4)', borderRadius: 4, padding: '2px 5px',
          }}>LIVE</span>
        </div>
      </header>

      {initialStocks.length === 0 ? (
        <div className="glass p-6 text-center">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            הבורסה עדיין לא מוכנה — יש להריץ את ה-SQL בסופבס תחילה 📋
          </p>
        </div>
      ) : (
        <StockMarket initialStocks={initialStocks} initialHistory={initialHistory} />
      )}
    </main>
  )
}
