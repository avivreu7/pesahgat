'use client'

import { useEffect, useState } from 'react'

interface TickerItem { id: string; text: string }

export default function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/news-ticker', { cache: 'no-store' })
        setItems(await res.json())
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!items.length) return null

  /* Build scrolling text with icons and separators */
  const combined = items.map(i => `📢 ${i.text}`).join('   ✦   ')
  const speed = Math.max(22, combined.length * 0.18)

  return (
    <div style={{
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      borderBottom: '1.5px solid rgba(212,168,67,0.45)',
      boxShadow: '0 2px 16px rgba(139,38,53,0.3)',
      /* Shimmer gradient background */
      background: 'linear-gradient(90deg, #4a0d15 0%, #6e1a26 30%, #2d0a0f 60%, #6e1a26 80%, #4a0d15 100%)',
      backgroundSize: '200% 100%',
      animation: 'tickerShimmer 4s linear infinite',
    }}>
      {/* "מבזק" label badge */}
      <div style={{
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        background: 'linear-gradient(135deg, #D4A843 0%, #B8902A 100%)',
        borderLeft: '2px solid rgba(212,168,67,0.6)',
        gap: 6,
        boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '0.75rem' }}>📰</span>
        <span style={{
          fontWeight: 900,
          fontSize: '0.72rem',
          color: '#1a0800',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>מבזק</span>
      </div>

      {/* Scrolling text — two copies for seamless loop */}
      <div style={{ overflow: 'hidden', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
        <div
          key={combined}
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            animation: `tickerScroll ${speed}s linear infinite`,
            color: '#F0C96A',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.04em',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ paddingLeft: 48 }}>{combined}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;</span>
          <span aria-hidden="true" style={{ paddingLeft: 0 }}>{combined}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      {/* Right fade mask */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: '100%',
        background: 'linear-gradient(to left, #4a0d15, transparent)',
        pointerEvents: 'none', zIndex: 1,
      }} />
    </div>
  )
}
