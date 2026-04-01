'use client'

import { useState, useEffect, useRef } from 'react'
import CandleChart from './CandleChart'

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

interface FiredEvent {
  name_he: string
  description_he: string
  stock_symbol: string
  price_change_pct: number
}

const STARTING_WALLET = 1000
const POLL_MS = 8_000

export default function StockMarket({
  initialStocks,
  initialHistory,
}: {
  initialStocks: Stock[]
  initialHistory: Record<string, PricePoint[]>
}) {
  const [stocks, setStocks]             = useState<Stock[]>(initialStocks)
  const [history, setHistory]           = useState<Record<string, PricePoint[]>>(initialHistory)
  const [wallet, setWallet]             = useState<number>(STARTING_WALLET)
  const [holdings, setHoldings]         = useState<Record<string, number>>({})
  const [selected, setSelected]         = useState<string>(initialStocks[0]?.symbol ?? 'MATZ')
  const [quantity, setQuantity]         = useState<number>(1)
  const [trading, setTrading]           = useState(false)
  const [eventToast, setEventToast]     = useState<FiredEvent | null>(null)
  const [eventLeaving, setEventLeaving] = useState(false)
  const [tradeMsg, setTradeMsg]         = useState<string | null>(null)
  const prevPricesRef = useRef<Record<string, number>>({})

  // Load wallet + holdings from localStorage
  useEffect(() => {
    const w = localStorage.getItem('stock_zuzim')
    setWallet(w !== null ? parseFloat(w) : STARTING_WALLET)
    try {
      const h = localStorage.getItem('stock_holdings')
      setHoldings(h ? JSON.parse(h) : {})
    } catch { setHoldings({}) }

    // Seed initial prices ref
    initialStocks.forEach(s => { prevPricesRef.current[s.symbol] = s.current_price })
  }, [initialStocks])

  function saveWallet(v: number) {
    setWallet(v)
    localStorage.setItem('stock_zuzim', String(v))
  }

  function saveHoldings(h: Record<string, number>) {
    setHoldings(h)
    localStorage.setItem('stock_holdings', JSON.stringify(h))
  }

  // Poll prices
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/stocks', { cache: 'no-store' })
        const data = await res.json()
        if (!data.stocks) return
        setStocks(data.stocks)
        setHistory(data.history ?? {})

        if (data.firedEvents?.length) {
          const event = data.firedEvents[0]
          setEventToast(event)
          setEventLeaving(false)
          setTimeout(() => {
            setEventLeaving(true)
            setTimeout(() => setEventToast(null), 400)
          }, 6000)
        }
      } catch { /* silent */ }
    }
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const selectedStock = stocks.find(s => s.symbol === selected) ?? stocks[0]
  const selectedHistory = history[selected] ?? []

  // Price change vs first history point
  function priceChange(stock: Stock) {
    const h = history[stock.symbol]
    if (!h?.length) return 0
    return ((stock.current_price - h[0].price) / h[0].price) * 100
  }

  async function trade(action: 'buy' | 'sell') {
    if (!selectedStock || trading) return
    const qty = quantity

    if (action === 'buy') {
      const cost = Math.round(selectedStock.current_price * qty * 100) / 100
      if (wallet < cost) {
        setTradeMsg('אין מספיק זוזים 😬')
        setTimeout(() => setTradeMsg(null), 2500)
        return
      }
    } else {
      const owned = holdings[selected] ?? 0
      if (owned < qty) {
        setTradeMsg('אין לך מספיק מניות 📉')
        setTimeout(() => setTradeMsg(null), 2500)
        return
      }
    }

    setTrading(true)
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selected, action, quantity: qty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { new_price, cost } = data

      // Update stock price locally
      setStocks(prev => prev.map(s =>
        s.symbol === selected ? { ...s, current_price: new_price } : s,
      ))

      // Update wallet
      if (action === 'buy') {
        saveWallet(Math.round((wallet - cost) * 100) / 100)
        const newH = { ...holdings, [selected]: (holdings[selected] ?? 0) + qty }
        saveHoldings(newH)
        setTradeMsg(`✅ קנית ${qty} יח' ב-${cost} זוזים`)
      } else {
        saveWallet(Math.round((wallet + cost) * 100) / 100)
        const newH = { ...holdings, [selected]: Math.max(0, (holdings[selected] ?? 0) - qty) }
        saveHoldings(newH)
        setTradeMsg(`✅ מכרת ${qty} יח', קיבלת ${cost} זוזים`)
      }
      setTimeout(() => setTradeMsg(null), 3000)
    } catch {
      setTradeMsg('שגיאה בביצוע עסקה')
      setTimeout(() => setTradeMsg(null), 2500)
    } finally {
      setTrading(false)
    }
  }

  const totalPortfolioValue = stocks.reduce((sum, s) => {
    return sum + (holdings[s.symbol] ?? 0) * s.current_price
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

      {/* Wallet bar */}
      <div className="glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.6rem' }}>🪙</span>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>ארנק המסחר</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--wheat)', margin: 0 }}>
              {wallet.toLocaleString('he-IL')} זוזים
            </p>
          </div>
        </div>
        {totalPortfolioValue > 0 && (
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>שווי תיק</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--grass-light)', margin: 0 }}>
              +{Math.round(totalPortfolioValue)} זוזים
            </p>
          </div>
        )}
      </div>

      {/* Stock list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stocks.map(s => {
          const change = priceChange(s)
          const isUp = change >= 0
          const isSelected = s.symbol === selected
          const owned = holdings[s.symbol] ?? 0
          return (
            <button
              key={s.symbol}
              onClick={() => setSelected(s.symbol)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', textAlign: 'right',
                background: isSelected
                  ? 'rgba(212,168,67,0.12)'
                  : 'rgba(255,252,240,0.6)',
                border: isSelected
                  ? '1.5px solid rgba(212,168,67,0.5)'
                  : '1.5px solid rgba(212,168,67,0.15)',
                borderRadius: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{s.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {s.name_he}
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: 6, fontWeight: 600 }}>
                    {s.symbol}
                  </span>
                </p>
                {owned > 0 && (
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--wheat)', fontWeight: 700 }}>
                    בידיך: {owned} יח'
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {s.current_price.toFixed(1)}
                </p>
                <p style={{
                  margin: 0, fontSize: '0.7rem', fontWeight: 800,
                  color: isUp ? '#16a34a' : '#dc2626',
                }}>
                  {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedStock && (
        <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '2rem' }}>{selectedStock.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem', color: 'var(--gold)' }}>
                {selectedStock.name_he}
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {selectedStock.description_he}
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-main)' }}>
                {selectedStock.current_price.toFixed(2)}
              </p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>זוזים</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{
            background: 'rgba(10,5,0,0.06)', borderRadius: 10,
            padding: '8px 4px', overflow: 'hidden',
          }}>
            <CandleChart history={selectedHistory} currentPrice={selectedStock.current_price} />
          </div>

          {/* Trade controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Quantity selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>כמות:</span>
              {[1, 2, 5, 10].map(q => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontWeight: 800, fontSize: '0.8rem',
                    background: quantity === q ? 'var(--wheat)' : 'rgba(212,168,67,0.12)',
                    color: quantity === q ? '#1a0a00' : 'var(--text-main)',
                    border: '1.5px solid rgba(212,168,67,0.3)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Buy / Sell */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => trade('buy')}
                disabled={trading}
                className="btn-gold"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', fontWeight: 900 }}
              >
                {trading ? '...' : `▲ קנה — ${(selectedStock.current_price * quantity).toFixed(1)} זוזים`}
              </button>
              <button
                onClick={() => trade('sell')}
                disabled={trading || (holdings[selected] ?? 0) < quantity}
                style={{
                  flex: 1, padding: '10px', fontSize: '0.85rem', fontWeight: 900,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1.5px solid rgba(239,68,68,0.4)',
                  borderRadius: 10, cursor: 'pointer',
                  color: '#dc2626', transition: 'all 0.12s',
                  opacity: (holdings[selected] ?? 0) < quantity ? 0.4 : 1,
                }}
              >
                {trading ? '...' : `▼ מכור — ${holdings[selected] ?? 0} בידיך`}
              </button>
            </div>

            {/* Trade feedback */}
            {tradeMsg && (
              <p style={{
                margin: 0, fontSize: '0.8rem', fontWeight: 700, textAlign: 'center',
                color: tradeMsg.startsWith('✅') ? '#16a34a' : '#dc2626',
              }}>
                {tradeMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Event toast */}
      {eventToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, maxWidth: 320, width: '90vw',
          background: eventToast.price_change_pct > 0
            ? 'linear-gradient(135deg, rgba(22,163,74,0.95), rgba(16,122,56,0.95))'
            : 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(185,28,28,0.95))',
          backdropFilter: 'blur(12px)',
          borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 6px 32px rgba(0,0,0,0.35)',
          animation: eventLeaving ? 'toastSlideOut 0.35s ease forwards' : 'toastSlideIn 0.35s ease forwards',
        }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: 'white' }}>
            📢 {eventToast.name_he}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
            {eventToast.description_he} &nbsp;
            <strong>
              {eventToast.price_change_pct > 0 ? `▲ +${eventToast.price_change_pct}%` : `▼ ${eventToast.price_change_pct}%`}
            </strong>
          </p>
        </div>
      )}
    </div>
  )
}
