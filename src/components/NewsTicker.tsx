'use client'

import { useEffect, useState } from 'react'

interface TickerItem { id: string; text: string }

export default function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/news-ticker', { cache: 'no-store' })
        const data = await res.json()
        setItems(data)
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!items.length) return null

  const combined = items.map(i => i.text).join('   ·   ')

  return (
    <div style={{
      width: '100%',
      background: 'rgba(139,38,53,0.92)',
      backdropFilter: 'blur(8px)',
      color: 'white',
      fontSize: '0.85rem',
      fontWeight: 700,
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '2px solid rgba(212,168,67,0.6)',
      display: 'flex',
      alignItems: 'center',
      height: 36,
    }}>
      {/* Label */}
      <div style={{
        flexShrink: 0,
        background: 'var(--wheat)',
        color: 'var(--wine)',
        fontWeight: 900,
        fontSize: '0.75rem',
        padding: '0 10px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        letterSpacing: '0.05em',
      }}>
        📰 מבזק
      </div>

      {/* Scrolling text */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div
          key={combined}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            paddingLeft: '100%',
            animation: `tickerScroll ${Math.max(18, combined.length * 0.22)}s linear infinite`,
          }}
        >
          {combined}
          <span style={{ padding: '0 48px' }} aria-hidden="true" />
          {combined}
        </div>
      </div>
    </div>
  )
}
