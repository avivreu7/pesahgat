import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Stock {
  symbol: string
  name_he: string
  emoji: string
  current_price: number
  description_he: string
}

interface PricePoint {
  price: number
  recorded_at: string
}

interface StockEvent {
  id: string
  name_he: string
  description_he: string
  stock_symbol: string
  price_change_pct: number
  triggered: boolean
  scheduled_at: string
}

const EVENTS_SEED = [
  { name_he: 'ניקיון חמץ הסתיים!', description_he: 'ביקוש למצות קפץ ברחבי הקיבוץ!', stock_symbol: 'MATZ', price_change_pct: 20 },
  { name_he: 'מישהו שפך את הכוס הרביעית', description_he: 'מחיר היין ירד בפאניקה 😬', stock_symbol: 'WINE', price_change_pct: -15 },
  { name_he: 'ריח הכבש מגיע מכל הקיבוץ!', description_he: 'כולם רוצים כבש — הביקוש פורח', stock_symbol: 'LAMB', price_change_pct: 25 },
  { name_he: 'הילדים חטפו את האפיקומן!', description_he: 'האפיקומן נדיר עכשיו — מחיר מזנק', stock_symbol: 'AFIK', price_change_pct: 40 },
  { name_he: 'קניידלך האגדה חזרה!', description_he: 'שרה הכינה קניידלך — הקיבוץ מתרגש', stock_symbol: 'KNEI', price_change_pct: 30 },
  { name_he: 'יותר מדי חומץ בחרוסת', description_he: 'הקהל מאוכזב — מחיר יורד', stock_symbol: 'CHAR', price_change_pct: -10 },
  { name_he: 'מרור טרי מהגינה!', description_he: 'מרירות מובטחת — ביקוש עצום', stock_symbol: 'MAROR', price_change_pct: 50 },
  { name_he: 'ביצים? שכחו!', description_he: 'חסר מלאי ביצים — מחיר קורס', stock_symbol: 'EGG', price_change_pct: -20 },
  { name_he: 'אליהו שתה מהכוס!', description_he: 'ראו בעיניהם — כוס אליהו התרוקנה', stock_symbol: 'ELIJ', price_change_pct: 15 },
  { name_he: 'כרפס — הכי פחות פופולרי', description_he: 'גם ביום החג הכרפס עצוב', stock_symbol: 'KARP', price_change_pct: -5 },
]

async function seedEventsIfEmpty(supabase: ReturnType<typeof createAdminClient>) {
  const { count } = await supabase
    .from('stock_events')
    .select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return

  const now = Date.now()
  const rows = EVENTS_SEED.map((e, i) => ({
    ...e,
    triggered: false,
    // Spread events randomly: 5 min to 100 min from now, roughly evenly spaced
    scheduled_at: new Date(now + (5 + i * 9 + Math.floor(Math.random() * 5)) * 60_000).toISOString(),
  }))
  await supabase.from('stock_events').insert(rows)
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Auto-seed events if needed
    await seedEventsIfEmpty(supabase)

    // Fire due events
    const now = new Date().toISOString()
    const { data: dueEvents } = await supabase
      .from('stock_events')
      .select('*')
      .eq('triggered', false)
      .lte('scheduled_at', now)
      .returns<StockEvent[]>()

    const firedEvents: StockEvent[] = []

    for (const event of dueEvents ?? []) {
      const { data: stockRow } = await supabase
        .from('holiday_stocks')
        .select('current_price')
        .eq('symbol', event.stock_symbol)
        .single()

      if (stockRow) {
        const newPrice = Math.max(1, Math.round(
          stockRow.current_price * (1 + event.price_change_pct / 100) * 100,
        ) / 100)

        await supabase
          .from('holiday_stocks')
          .update({ current_price: newPrice })
          .eq('symbol', event.stock_symbol)

        await supabase.from('stock_price_history').insert({
          stock_symbol: event.stock_symbol,
          price: newPrice,
        })

        await supabase
          .from('stock_events')
          .update({ triggered: true })
          .eq('id', event.id)

        firedEvents.push(event)
      }
    }

    // Fetch all stocks
    const { data: stocks } = await supabase
      .from('holiday_stocks')
      .select('*')
      .returns<Stock[]>()

    // Fetch price history (last 3 hours)
    const since = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    const { data: historyRows } = await supabase
      .from('stock_price_history')
      .select('stock_symbol, price, recorded_at')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })

    // Group history by symbol
    const history: Record<string, PricePoint[]> = {}
    for (const row of historyRows ?? []) {
      if (!history[row.stock_symbol]) history[row.stock_symbol] = []
      history[row.stock_symbol].push({ price: row.price, recorded_at: row.recorded_at })
    }

    return NextResponse.json({ stocks: stocks ?? [], history, firedEvents })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { symbol, action, quantity } = await req.json() as {
      symbol: string
      action: 'buy' | 'sell'
      quantity: number
    }

    if (!symbol || !action || !quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'קלט לא תקין' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: stockRow } = await supabase
      .from('holiday_stocks')
      .select('current_price')
      .eq('symbol', symbol)
      .single()

    if (!stockRow) return NextResponse.json({ error: 'מניה לא נמצאה' }, { status: 404 })

    const current = Number(stockRow.current_price)
    const impact = action === 'buy' ? 0.008 : 0.005
    const newPrice = action === 'buy'
      ? Math.min(9999, Math.round(current * (1 + impact * quantity) * 100) / 100)
      : Math.max(1, Math.round(current * (1 - impact * quantity) * 100) / 100)

    const cost = action === 'buy'
      ? Math.round(current * quantity * 100) / 100
      : Math.round(newPrice * quantity * 100) / 100

    await supabase
      .from('holiday_stocks')
      .update({ current_price: newPrice })
      .eq('symbol', symbol)

    await supabase.from('stock_price_history').insert({
      stock_symbol: symbol,
      price: newPrice,
    })

    return NextResponse.json({ new_price: newPrice, cost })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
  }
}
