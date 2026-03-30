'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SiteLockOverlay({ locked }: { locked: boolean }) {
  const path = usePathname()

  /* Block form submissions via document-level capture (doesn't block video clicks) */
  useEffect(() => {
    if (!locked || path.startsWith('/admin')) return
    const blockSubmit = (e: Event) => e.preventDefault()
    document.addEventListener('submit', blockSubmit, true)
    return () => document.removeEventListener('submit', blockSubmit, true)
  }, [locked, path])

  if (!locked || path.startsWith('/admin')) return null

  /* Only show the banner — pointer-events:none so videos and iframes are fully clickable */
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        pointerEvents: 'none',
        background: 'transparent',
      }}
      aria-hidden="true"
    >
      {/* Banner at bottom */}
      <div style={{
        position: 'fixed', bottom: 0, inset: 'auto 0 0 0', zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(139,38,53,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '14px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(212,168,67,0.4)',
      }}>
        <p style={{ color: '#FFF8E8', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>
          🔒 האתר בתצוגה מקדימה – הפעילויות יפתחו בקרוב!
        </p>
        <p style={{ color: 'rgba(255,248,232,0.65)', fontSize: '0.75rem', marginTop: 2 }}>
          בקרו שוב בליל הסדר 🍷
        </p>
      </div>
    </div>
  )
}
